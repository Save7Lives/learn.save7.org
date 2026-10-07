/**
 * What has to be true of the film's files before they are committed or uploaded.
 *
 * Shared by `check-media.ts` (the CLI, and CI) and `upload-media.ts`, which refuses
 * to publish a file that fails any of it. Plain Node, no app imports, so it runs
 * under tsx outside Next.
 *
 * The rule that matters most is the first: **a file's name carries the first eight
 * hex characters of the SHA-256 of its bytes.** The files are served with a
 * one-year cache (#23), so a corrected file that kept its name would be served
 * stale from every cache that had it. A name that disagrees with its contents
 * means someone edited a file in place; the fix is to rename it, and to update the
 * registry in `src/lib/films.ts`.
 */
import { createHash } from "node:crypto";
import { closeSync, existsSync, fstatSync, openSync, readFileSync, readSync } from "node:fs";
import { join } from "node:path";

import { FILMS, type Film } from "../src/lib/films";

export type Asset = { label: string; src: string; contentType: string };

/** Every file a film is served from, in the order they are checked and uploaded. */
export function filmAssets(film: Film): Asset[] {
  return [
    { label: "video", src: film.video.src, contentType: film.video.type },
    { label: "poster", src: film.poster.src, contentType: film.poster.type },
    { label: "captions", src: film.captions.src, contentType: "text/vtt" },
  ];
}

export function localPath(src: string, repoRoot = process.cwd()): string {
  return join(repoRoot, "public", src);
}

export function sha8(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 8);
}

// ── WebVTT ──────────────────────────────────────────────────────────────────

export type Cue = { start: number; end: number; text: string };

function seconds(stamp: string): number {
  const m = /^(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})$/.exec(stamp);
  if (!m) throw new Error(`bad timestamp ${JSON.stringify(stamp)}`);
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

/** Just enough WebVTT for the files this project writes: no styles, regions or notes. */
export function parseVtt(source: string): Cue[] {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!text.startsWith("WEBVTT")) throw new Error("does not start with WEBVTT");
  const cues: Cue[] = [];
  for (const block of text.split(/\n{2,}/).slice(1)) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    const timing = lines.findIndex((l) => l.includes("-->"));
    if (timing === -1) throw new Error(`a block has no timing line: ${JSON.stringify(lines[0])}`);
    const [from, to] = lines[timing].split("-->").map((s) => s.trim().split(/\s+/)[0]);
    cues.push({
      start: seconds(from),
      end: seconds(to),
      text: lines
        .slice(timing + 1)
        .join(" ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    });
  }
  return cues;
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

// ── MP4 ─────────────────────────────────────────────────────────────────────

/** The movie header's duration, and whether `moov` comes before `mdat` (fast start). */
export function mp4Facts(path: string): { durationSeconds: number; fastStart: boolean } {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    const head = Buffer.alloc(16);
    let offset = 0;
    let sawMdat = false;
    let fastStart = false;
    let durationSeconds: number | null = null;

    while (offset + 8 <= size) {
      readSync(fd, head, 0, 16, offset);
      let boxSize = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      let header = 8;
      if (boxSize === 1) {
        boxSize = Number(head.readBigUInt64BE(8));
        header = 16;
      } else if (boxSize === 0) {
        boxSize = size - offset;
      }
      if (boxSize < header) throw new Error(`bad mp4 box ${JSON.stringify(type)} at ${offset}`);

      if (type === "mdat") sawMdat = true;
      if (type === "moov") {
        fastStart = !sawMdat;
        const moov = Buffer.alloc(boxSize - header);
        readSync(fd, moov, 0, moov.length, offset + header);
        const at = moov.indexOf("mvhd", 0, "latin1");
        if (at === -1) throw new Error("moov has no mvhd");
        const body = at + 4;
        const version = moov[body];
        const timescale = moov.readUInt32BE(body + (version === 1 ? 20 : 12));
        const duration =
          version === 1 ? Number(moov.readBigUInt64BE(body + 24)) : moov.readUInt32BE(body + 16);
        durationSeconds = duration / timescale;
      }
      offset += boxSize;
    }
    if (durationSeconds === null) throw new Error("no moov box");
    return { durationSeconds, fastStart };
  } finally {
    closeSync(fd);
  }
}

// ── the checks ──────────────────────────────────────────────────────────────

export type MediaReport = { errors: string[]; notes: string[] };

export function checkMedia(repoRoot = process.cwd()): MediaReport {
  const errors: string[] = [];
  const notes: string[] = [];

  for (const [key, film] of Object.entries(FILMS) as [string, Film][]) {
    const at = (what: string) => `${key}: ${what}`;

    for (const asset of filmAssets(film)) {
      const path = localPath(asset.src, repoRoot);
      if (!existsSync(path)) {
        errors.push(at(`${asset.label} ${asset.src} is not in public/media`));
        continue;
      }
      const bytes = readFileSync(path);
      const named = /\.([0-9a-f]{8})\.[a-z0-9]+$/.exec(asset.src)?.[1];
      const actual = sha8(bytes);
      if (!named) {
        errors.push(at(`${asset.src} has no content hash in its name (expected name.<8 hex>.ext)`));
      } else if (named !== actual) {
        errors.push(
          at(
            `${asset.src} is named for hash ${named} but its contents hash to ${actual}. ` +
              `An edited file must ship under a new name: a one-year cache would serve the old one.`,
          ),
        );
      }
      if (asset.label === "video" && bytes.length !== film.sizeBytes) {
        errors.push(at(`video is ${bytes.length} bytes but the registry says ${film.sizeBytes}`));
      }
      if (asset.label === "poster" && !(bytes[0] === 0xff && bytes[1] === 0xd8)) {
        errors.push(at("poster is not a JPEG"));
      }
    }

    // The film itself: the registry's duration must be the file's.
    const videoPath = localPath(film.video.src, repoRoot);
    if (existsSync(videoPath)) {
      try {
        const facts = mp4Facts(videoPath);
        if (Math.abs(facts.durationSeconds - film.durationSeconds) > 1) {
          errors.push(
            at(`video runs ${facts.durationSeconds.toFixed(1)}s but the registry says ${film.durationSeconds}s`),
          );
        }
        notes.push(
          `${key}: video ${facts.durationSeconds.toFixed(1)}s, ` +
            (facts.fastStart ? "moov before mdat (starts without a second request)" : "moov after mdat (a player needs one extra range request before it can start)"),
        );
      } catch (e) {
        errors.push(at(`video could not be read as MP4: ${(e as Error).message}`));
      }
    }

    // The captions: well formed, in order, inside the film, and the transcript's words.
    const vttPath = localPath(film.captions.src, repoRoot);
    if (existsSync(vttPath)) {
      try {
        const cues = parseVtt(readFileSync(vttPath, "utf8"));
        if (cues.length === 0) errors.push(at("captions have no cues"));
        cues.forEach((cue, i) => {
          if (!(cue.start < cue.end)) errors.push(at(`cue ${i + 1} ends before it starts`));
          if (i > 0 && cue.start < cues[i - 1].end) errors.push(at(`cue ${i + 1} overlaps the one before`));
          if (!squash(cue.text)) errors.push(at(`cue ${i + 1} is empty`));
        });
        const last = cues[cues.length - 1];
        if (last && last.end > film.durationSeconds + 1) {
          errors.push(at(`captions run to ${last.end}s, past the film's ${film.durationSeconds}s`));
        }

        const spoken = squash(cues.map((c) => c.text).join(" ")).split(" ");
        const transcript = squash(film.transcript.join(" ")).split(" ");
        const limit = Math.max(spoken.length, transcript.length);
        for (let i = 0; i < limit; i++) {
          if (spoken[i] !== transcript[i]) {
            errors.push(
              at(
                `captions and transcript differ at word ${i + 1}: captions ` +
                  `${JSON.stringify(spoken.slice(Math.max(0, i - 3), i + 4).join(" "))}, transcript ` +
                  `${JSON.stringify(transcript.slice(Math.max(0, i - 3), i + 4).join(" "))}`,
              ),
            );
            break;
          }
        }
        notes.push(
          `${key}: ${cues.length} cues, ${spoken.length} words, identical to the transcript, ending at ${last?.end}s`,
        );
      } catch (e) {
        errors.push(at(`captions could not be read: ${(e as Error).message}`));
      }
    }

    if (film.corrections.length === 0) errors.push(at("the film has no corrections noted"));
  }

  return { errors, notes };
}
