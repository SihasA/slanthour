"use client";

// ─── Cabinet ─────────────────────────────────────────────────────────
// Museum catalogue: archival labels, index numbering, structured groups,
// matted mounts, quiet typography. Item numbers run across the page like
// accession numbers; heading sections read as collection group headers.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";

const MAT_CLASS: Record<string, string> = {
  none: "",
  thin: "bg-white p-2 sm:p-3 border border-[var(--sh-border)]",
  deep: "bg-white p-4 sm:p-7 border border-[var(--sh-border)] shadow-[0_1px_4px_rgba(40,36,28,0.08)]",
};

const SCALE_COLS: Record<string, { cols: string; n: 2 | 3 | 4 }> = {
  compact: { cols: "sm:grid-cols-4", n: 4 },
  standard: { cols: "sm:grid-cols-3", n: 3 },
  large: { cols: "sm:grid-cols-2", n: 2 },
};

function Label({
  image,
  number,
  settings,
}: {
  image: PageImage;
  number: number | null;
  settings: ThemeRenderProps["settings"];
}) {
  const full = settings.metadata === "full";
  const hasAny = number !== null || image.caption || full;
  if (!hasAny) return null;
  return (
    <figcaption
      className="mt-2.5 text-[11px] leading-relaxed text-[var(--sh-muted)]"
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {settings.numbering === true && number !== null && (
        <span className="text-[var(--sh-text)]">No. {String(number).padStart(3, "0")}</span>
      )}
      {settings.numbering === true && number !== null && image.caption && <span> — </span>}
      {image.caption && <span>{image.caption}</span>}
      {full && image.width && image.height && (
        <span className="block mt-0.5 opacity-75">
          {image.width} × {image.height} px
        </span>
      )}
    </figcaption>
  );
}

function CabinetSection({
  section,
  settings,
  startNumber,
  groupNumber,
  priority,
}: {
  section: Section;
  settings: ThemeRenderProps["settings"];
  startNumber: number;
  groupNumber: number | null;
  priority: boolean;
}) {
  const mat = MAT_CLASS[String(settings.mat)] ?? MAT_CLASS.thin;
  const scale = SCALE_COLS[String(settings.gridScale)] ?? SCALE_COLS.standard;

  switch (section.type) {
    case "hero":
      return (
        <Container width="wide">
          <div className="border-b border-[var(--sh-border)] pb-8">
            {section.image && (
              <div className={mat}>
                <SmartImage image={section.image} priority={priority} fit="cover" aspect="2 / 1" sizes="(max-width: 1200px) 100vw, 1200px" />
              </div>
            )}
            <h1
              className="mt-8 text-3xl sm:text-[2.6rem] leading-tight [text-wrap:balance]"
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="mt-3 text-[13px] uppercase tracking-[0.2em] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-annotation)" }}>
                {section.subtitle}
              </p>
            )}
          </div>
        </Container>
      );

    case "heading":
      return (
        <Container width="wide">
          <div className="flex items-baseline gap-5">
            {groupNumber !== null && (
              <span
                className="text-[11px] uppercase tracking-[0.25em] text-[var(--sh-accent)] shrink-0"
                style={{ fontFamily: "var(--sh-annotation)" }}
              >
                {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][groupNumber - 1] ?? groupNumber}
              </span>
            )}
            <div className="flex-1">
              <h2
                className={`${section.level === 1 ? "text-2xl sm:text-3xl" : "text-xl"} leading-snug`}
                style={{ fontFamily: "var(--sh-heading)" }}
              >
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="mt-1.5 text-[12px] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-annotation)" }}>
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--sh-border)]" />
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[15px] leading-[1.9] ${section.align === "center" ? "text-center" : ""}`}
            style={{ fontFamily: "var(--sh-heading)" }}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text">
          <div className="border border-[var(--sh-border)] bg-white/60 px-7 py-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--sh-accent)] mb-3" style={{ fontFamily: "var(--sh-annotation)" }}>
              Note
            </p>
            <blockquote className="text-lg leading-relaxed italic" style={{ fontFamily: "var(--sh-heading)" }}>
              {section.text}
            </blockquote>
            {section.attribution && (
              <cite className="block mt-3 not-italic text-[11px] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-annotation)" }}>
                — {section.attribution}
              </cite>
            )}
          </div>
        </Container>
      );

    case "image":
      if (!section.image) return null;
      return (
        <Container width={section.width === "full" ? "wide" : section.width}>
          <figure className={section.width === "text" ? "" : "max-w-3xl mx-auto"}>
            <div className={mat}>
              <SmartImage image={section.image} sizes="(max-width: 820px) 100vw, 820px" priority={priority} />
            </div>
            <Label image={section.image} number={startNumber} settings={settings} />
          </figure>
        </Container>
      );

    case "split":
      return (
        <Container width="wide">
          <div className="grid sm:grid-cols-2 gap-6 items-start">
            {section.images.map((image, i) => (
              <figure key={image.id}>
                <div className={mat}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <Label image={image} number={startNumber + i} settings={settings} />
              </figure>
            ))}
          </div>
        </Container>
      );

    case "row":
      return (
        <Container width="wide">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {section.images.map((image, i) => (
              <figure key={image.id}>
                <div className={mat}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <Label image={image} number={startNumber + i} settings={settings} />
              </figure>
            ))}
          </div>
        </Container>
      );

    case "grid":
    case "contact-sheet": {
      const columns = section.type === "grid" ? section.columns : scale.n;
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} gap-x-5 gap-y-9`}>
            {section.images.map((image, i) => (
              <figure key={image.id}>
                <div className={mat}>
                  <SmartImage
                    image={image}
                    group={section.images}
                    fit="cover"
                    aspect="4 / 5"
                    sizes={`(max-width: 640px) 50vw, ${Math.round(100 / columns)}vw`}
                  />
                </div>
                <Label image={image} number={startNumber + i} settings={settings} />
              </figure>
            ))}
          </div>
        </Container>
      );
    }

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image, i) => (
            <Container width="wide" key={image.id}>
              <figure className="max-w-3xl mx-auto">
                <div className={mat}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 820px) 100vw, 820px" />
                </div>
                <Label image={image} number={startNumber + i} settings={settings} />
              </figure>
            </Container>
          ))}
        </div>
      );

    case "spacer":
      return (
        <Container width="wide">
          <SpacerBlock size={section.size} divider={section.divider} />
        </Container>
      );
  }
}

export function CabinetRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";

  // Accession numbering across the page; Roman numerals for group headers.
  const startNumbers: number[] = [];
  let itemCounter = 1;
  let groupCounter = 0;
  const groupNumbers: (number | null)[] = [];
  for (const section of document.sections) {
    startNumbers.push(itemCounter);
    groupNumbers.push(section.type === "heading" ? ++groupCounter : null);
    if (section.type === "image" && section.image) itemCounter += 1;
    else if ("images" in section) itemCounter += section.images.length;
  }

  return (
    <article className="pb-24">
      <header className="pt-12 pb-4">
        <Container width="wide">
          <p
            className="text-[10px] uppercase tracking-[0.35em] text-[var(--sh-muted)]"
            style={{ fontFamily: "var(--sh-annotation)" }}
          >
            {author ? `Collection of ${author.displayName}` : "Collection"}
          </p>
          {!startsWithHero && (
            <>
              <h1 className="mt-4 text-3xl sm:text-[2.6rem] leading-tight [text-wrap:balance]" style={{ fontFamily: "var(--sh-heading)" }}>
                {title}
              </h1>
              <div className="mt-6 h-px bg-[var(--sh-border)]" />
            </>
          )}
        </Container>
      </header>

      <div className="flex flex-col pt-6" style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <CabinetSection
              section={section}
              settings={settings}
              startNumber={startNumbers[index]}
              groupNumber={groupNumbers[index]}
              priority={index === 0}
            />
          </Reveal>
        ))}
      </div>

      {author && (
        <footer className="mt-24">
          <Container width="wide">
            <div className="border-t border-[var(--sh-border)] pt-4 flex justify-between text-[10px] uppercase tracking-[0.3em] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-annotation)" }}>
              <span>{author.displayName}</span>
              <span>{itemCounter - 1 > 0 ? `${itemCounter - 1} items` : ""}</span>
            </div>
          </Container>
        </footer>
      )}
    </article>
  );
}
