import { Badge, Card } from "@/components/ui/primitives";
import { RESOURCE_TYPE_LABELS, type ResourceType } from "@/lib/constants";
import type { ResourceListPayload } from "@/lib/lesson-payloads";

export type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  isRequired: boolean;
  source: string | null;
  author: string | null;
  externalUrl: string | null;
  filePath: string | null;
  licenceNote: string | null;
  isStub: boolean;
};

/**
 * Further reading.
 *
 * Stub resources render as an explicit "citation incomplete" state rather than
 * being hidden. A missing reference list is a visible gap Save7 can act on; a
 * fabricated citation is a plausible-looking error that gets repeated. The
 * incomplete version is strictly better.
 */
export function ResourceList({
  payload,
  resources,
}: {
  payload: ResourceListPayload | null;
  resources: ResourceRow[];
}) {
  const required = resources.filter((r) => r.isRequired);
  const optional = resources.filter((r) => !r.isRequired);

  return (
    <div>
      {payload?.intro ? <p className="text-sand-600">{payload.intro}</p> : null}
      {payload?.note ? (
        <p className="mt-2 text-sm italic text-sand-500">{payload.note}</p>
      ) : null}

      {resources.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-sand-300 bg-sand-100/60 px-4 py-3 text-sm text-sand-600">
          No further reading has been attached to this module yet.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {required.length > 0 ? (
            <Section title="Primary sources" resources={required} />
          ) : null}
          {optional.length > 0 ? (
            <Section
              title={required.length > 0 ? "Optional deeper reading" : "Optional reading"}
              resources={optional}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function Section({ title, resources }: { title: string; resources: ResourceRow[] }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-sand-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {resources.map((resource) => (
          <Card as="li" key={resource.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                {RESOURCE_TYPE_LABELS[resource.type as ResourceType] ?? resource.type}
              </Badge>
              {resource.isRequired ? <Badge tone="pink">Primary source</Badge> : null}
              {resource.filePath ? <Badge tone="teal">Opens here</Badge> : null}
              {resource.isStub ? <Badge tone="review">Citation incomplete</Badge> : null}
            </div>

            <p className="mt-2.5 font-semibold text-ink">
              {/* Prefer the supplied file: a learner should be able to open the
                  reading rather than land on a paywall. */}
              {resource.filePath || resource.externalUrl ? (
                <a
                  href={resource.filePath ?? resource.externalUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-pink-200 decoration-2 underline-offset-2 hover:decoration-pink"
                >
                  {resource.title}
                </a>
              ) : (
                resource.title
              )}
            </p>

            {resource.description ? (
              <p className="mt-1 text-sm text-sand-600">{resource.description}</p>
            ) : null}

            {resource.author || resource.source ? (
              <p className="mt-1.5 text-xs text-sand-500">
                {[resource.author, resource.source].filter(Boolean).join(" · ")}
              </p>
            ) : null}

            {resource.isStub ? (
              <p className="mt-2 text-xs italic text-sand-500">
                {resource.licenceNote ??
                  "Full citation awaiting Save7's reference list. Nothing here has been invented."}
              </p>
            ) : null}
          </Card>
        ))}
      </ul>
    </section>
  );
}
