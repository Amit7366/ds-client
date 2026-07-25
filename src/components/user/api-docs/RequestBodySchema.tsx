export type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export function RequestBodySchema({
  fields,
  title = 'Request Body',
  subtitle = 'Required and optional fields for the launch request.',
}: {
  fields: SchemaField[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-[var(--fg)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <article
            key={field.name}
            className="surface-card rounded-2xl border border-[var(--border)] p-4 sm:p-5"
          >
            <code className="font-mono text-sm font-semibold text-[var(--fg)]">{field.name}</code>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                {field.type}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  field.required
                    ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}
              >
                {field.required ? 'Required' : 'Optional'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
              {field.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
