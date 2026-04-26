'use client'

interface SideBySideProps {
  designImageUrl: string
  implImageUrl: string
  designFigmaUrl: string | null
}

export function SideBySide({ designImageUrl, implImageUrl, designFigmaUrl }: SideBySideProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Panel
        title="Design"
        link={
          designFigmaUrl ? (
            <a
              href={designFigmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              Open in Figma
            </a>
          ) : null
        }
      >
        {designImageUrl ? (
          <img
            src={designImageUrl}
            alt="Design"
            className="block max-h-[600px] w-full object-contain"
          />
        ) : (
          <div
            role="img"
            aria-label="Design pending"
            className="flex h-48 items-center justify-center text-sm text-gray-500"
          >
            Rendering Figma design…
          </div>
        )}
      </Panel>
      <Panel title="Implementation">
        <img
          src={implImageUrl}
          alt="Implementation"
          className="block max-h-[600px] w-full object-contain"
        />
      </Panel>
    </div>
  )
}

interface PanelProps {
  title: string
  link?: React.ReactNode
  children: React.ReactNode
}

function Panel({ title, link, children }: PanelProps) {
  return (
    <section className="rounded border border-[var(--exo-color-border-default,#e2e8f0)] bg-white p-3">
      <header className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {link}
      </header>
      {children}
    </section>
  )
}
