"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The Baseline trend (#71): one line per Level across the four Sitting slots.
 *
 * Navy only: a Level is told apart by marker (circle, square, diamond) and dash
 * (solid, dashed, dotted), never by colour (#68). Amber ticks mark the slots on the
 * axis, always beside a text label, so amber is decoration and never the signal.
 *
 * It is drawn at the container's real pixel width and redrawn on resize. Scaling a
 * fixed viewBox would shrink the text with the box, and nothing here may fall under
 * 12px. The server passes plain numbers and strings; the page also renders the
 * table twin from the same Sittings, so the two cannot disagree.
 */

export type TrendSlot = {
  /** The axis label when wide: the fixed slot name, or what prompted a taken Sitting. */
  name: string;
  /** Under the name: "11 of 20", "Do this first", "Offered now", "Not yet". */
  status: string;
  taken: boolean;
  offered: boolean;
};

export type TrendSeries = {
  slug: string;
  title: string;
  /** Percentage per slot index; null where the Sitting is not taken. */
  values: Array<number | null>;
};

export type TrendData = {
  slots: TrendSlot[];
  /** In Course order; the first three get circle, square and diamond. */
  series: TrendSeries[];
  summary: string;
};

type Marker = "circle" | "square" | "diamond";
const MARKERS: Marker[] = ["circle", "square", "diamond"];
const DASH: Array<string | undefined> = [undefined, "8 5", "0.1 7"];

function MarkerShape({ kind, x, y, className }: { kind: Marker; x: number; y: number; className?: string }) {
  if (kind === "circle") return <circle className={className} cx={x} cy={y} r={5} />;
  if (kind === "square") return <rect className={className} x={x - 5} y={y - 5} width={10} height={10} />;
  return (
    <rect className={className} x={x - 4.5} y={y - 4.5} width={9} height={9} transform={`rotate(45 ${x} ${y})`} />
  );
}

const MARKER_CLASS = "fill-navy stroke-white stroke-[1.5]";

/** A legend glyph: the line style and marker, in navy. */
function LegendGlyph({ index }: { index: number }) {
  const dash = DASH[index];
  return (
    <svg width={44} height={14} viewBox="0 0 44 14" aria-hidden="true">
      <line
        x1={2}
        x2={42}
        y1={7}
        y2={7}
        className="stroke-navy"
        strokeWidth={index === 2 ? 3 : 2.5}
        strokeDasharray={dash}
        strokeLinecap={index === 2 ? "round" : "butt"}
      />
      <MarkerShape kind={MARKERS[index] ?? "circle"} x={22} y={7} className={MARKER_CLASS} />
    </svg>
  );
}

/** Greedy word wrap at an estimated 7.4px a character (13px Lexend). */
function wrap(text: string, maxPx: number): string[] {
  const perLine = Math.max(8, Math.floor(maxPx / 7.4));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const H = 268;
const LINE_H = 16;

function Chart({ data, width }: { data: TrendData; width: number }) {
  const narrow = width < 480;
  const n = data.slots.filter((s) => s.taken).length;
  const m = { l: 40, r: narrow ? 40 : 56, t: 44 };
  const pw = width - m.l - m.r;
  const spacing = pw / 3;

  const labels = data.slots.map((s, i) => (narrow ? [`Sitting ${i + 1}`] : wrap(s.name, spacing - 10)));
  const labelLines = Math.max(...labels.map((l) => l.length));
  const bottom = 38 + labelLines * LINE_H + 22;
  const ph = H - m.t - bottom;

  const X = (i: number) => m.l + (pw * i) / 3;
  const Y = (p: number) => m.t + ph * (1 - p / 100);
  const y0 = m.t + ph;

  // End-of-line values at the latest taken Sitting: merged when identical, nudged apart otherwise.
  const ends: Array<{ y: number; text: string }> = [];
  if (n > 0) {
    for (const s of data.series) {
      const v = s.values[n - 1];
      if (v === null || v === undefined) continue;
      const y = Y(v);
      const text = `${v}%`;
      if (!ends.some((e) => Math.abs(e.y - y) < 0.5 && e.text === text)) ends.push({ y, text });
    }
    ends.sort((a, b) => a.y - b.y);
    for (let j = 1; j < ends.length; j++) {
      if (ends[j].y - ends[j - 1].y < 15) ends[j].y = ends[j - 1].y + 15;
    }
  }

  return (
    <svg
      width={width}
      height={H}
      viewBox={`0 0 ${width} ${H}`}
      role="img"
      aria-label={data.summary}
      className="block overflow-visible"
    >
      {[0, 25, 50, 75, 100].map((p) => (
        <g key={p}>
          <line className="stroke-line" x1={m.l} x2={m.l + pw} y1={Y(p)} y2={Y(p)} />
          <text className="fill-grey text-xs" x={m.l - 8} y={Y(p) + 4} textAnchor="end">
            {p}%
          </text>
        </g>
      ))}
      {data.slots.map((_, i) => (
        <line key={i} className="stroke-line" strokeDasharray="2 4" x1={X(i)} x2={X(i)} y1={m.t} y2={y0} />
      ))}

      {/* Lines first, markers over them. */}
      {n >= 2
        ? data.series.slice(0, 3).map((s, si) => {
            const pts = s.values.slice(0, n).map((v, k) => `${k === 0 ? "M" : "L"}${X(k)},${Y(v ?? 0)}`);
            return (
              <path
                key={s.slug}
                d={pts.join(" ")}
                fill="none"
                className="stroke-navy"
                strokeWidth={si === 2 ? 3 : 2.5}
                strokeLinejoin="round"
                strokeLinecap={si === 2 ? "round" : "butt"}
                strokeDasharray={DASH[si]}
              />
            );
          })
        : null}
      {[2, 1, 0].map((si) => {
        const s = data.series[si];
        if (!s) return null;
        return s.values.slice(0, n).map((v, k) =>
          v === null ? null : (
            <MarkerShape key={`${s.slug}-${k}`} kind={MARKERS[si]} x={X(k)} y={Y(v)} className={MARKER_CLASS} />
          ),
        );
      })}
      {ends.map((e) => (
        <text key={`${e.y}-${e.text}`} className="fill-navy text-[12.5px] font-semibold" x={X(n - 1) + 12} y={e.y + 4}>
          {e.text}
        </text>
      ))}

      {/* The four Sitting slots: an amber tick when taken, a dashed one when not, always with words. */}
      {data.slots.map((s, i) => (
        <g key={i}>
          {s.taken ? (
            <rect className="fill-amber" x={X(i) - 2} y={y0 + 6} width={4} height={14} rx={2} />
          ) : (
            <rect
              className="fill-none stroke-line-strong"
              strokeDasharray="3 3"
              x={X(i) - 2}
              y={y0 + 6}
              width={4}
              height={14}
              rx={2}
            />
          )}
          <text className="fill-navy text-[13px] font-medium" x={X(i)} y={y0 + 38} textAnchor="middle">
            {labels[i].map((line, li) => (
              <tspan key={li} x={X(i)} dy={li === 0 ? 0 : LINE_H}>
                {line}
              </tspan>
            ))}
          </text>
          <text
            className={s.offered ? "fill-pink text-[12.5px] font-medium" : "fill-grey text-[12.5px]"}
            x={X(i)}
            y={y0 + 38 + labelLines * LINE_H + 1}
            textAnchor="middle"
          >
            {s.status}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BaselineTrend({ data }: { data: TrendData }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <ul aria-hidden="true" className="m-0 mb-1 flex list-none flex-wrap gap-x-[22px] gap-y-1.5 p-0 text-sm text-navy">
        {data.series.slice(0, 3).map((s, i) => (
          <li key={s.slug} className="inline-flex items-center gap-2">
            <LegendGlyph index={i} />
            {s.title}
          </li>
        ))}
      </ul>
      <div ref={host} className="min-h-[268px] w-full">
        <Chart data={data} width={width} />
      </div>
    </div>
  );
}
