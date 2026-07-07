"use client";

// ─── Klaxon ──────────────────────────────────────────────────────────
// Risograph zine: acid paper, hard ink outlines, inverted index tags,
// gig-poster headlines. The contact sheet becomes an index table — number,
// thumbnail, caption, dimensions — like a zine's list of plates.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody, frameNumber } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow } from "../shared/PhotoRow";
import { portraitConstraint } from "../shared/photo-layout";

const OUTLINE: Record<string, string> = {
  hairline: "border",
  bold: "border-2",
  heavy: "border-4",
};

function IndexTag({ n }: { n: number }) {
  return (
    <span
      className="absolute -top-2.5 -left-2.5 z-10 px-1.5 py-0.5 text-[10px] leading-none bg-[var(--sh-text)] text-[var(--sh-bg)]"
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {frameNumber(n)}
    </span>
  );
}

function InkCaption({ image }: { image: PageImage }) {
  if (!image.caption) return null;
  return (
    <figcaption
      className="mt-2 text-[11px] lowercase text-[var(--sh-muted)]"
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {image.caption}
    </figcaption>
  );
}

function KlaxonSection({
  section,
  settings,
  startNumber,
  priority,
}: {
  section: Section;
  settings: ThemeRenderProps["settings"];
  startNumber: number;
  priority: boolean;
}) {
  const outline = `${OUTLINE[String(settings.outline)] ?? OUTLINE.bold} border-[var(--sh-text)]`;
  const tags = settings.indexTags === true;
  const shout = settings.shout !== "lower";
  const headlineCase = shout ? "uppercase" : "lowercase";

  switch (section.type) {
    case "hero":
      return (
        <Container width="wide">
          <h1
            className={`${headlineCase} font-black leading-[0.88] tracking-tight [text-wrap:balance] text-[clamp(2.6rem,9vw,6.5rem)]`}
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.title}
          </h1>
          {section.subtitle && (
            <p
              className="mt-4 text-[12px] uppercase tracking-[0.25em] text-[var(--sh-accent)]"
              style={{ fontFamily: "var(--sh-annotation)" }}
            >
              {section.subtitle}
            </p>
          )}
          {section.image && (
            <figure className="relative mt-8">
              {tags && <IndexTag n={startNumber} />}
              <div className={outline}>
                <SmartImage
                  image={section.image}
                  priority={priority}
                  fit="cover"
                  aspect={section.height === "full" ? "16 / 10" : "21 / 9"}
                  sizes="(max-width: 1250px) 100vw, 1250px"
                />
              </div>
            </figure>
          )}
        </Container>
      );

    case "heading":
      return (
        <Container width="wide">
          <div className="flex items-center gap-4">
            <span className="w-4 h-4 bg-[var(--sh-accent)] shrink-0" aria-hidden />
            <h2
              className={`${headlineCase} font-black tracking-tight leading-none ${section.level === 1 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h2>
          </div>
          {section.subtitle && (
            <p
              className="mt-3 text-[12px] text-[var(--sh-muted)] lowercase"
              style={{ fontFamily: "var(--sh-annotation)" }}
            >
              {section.subtitle}
            </p>
          )}
          {section.level === 1 && <div className="mt-5 h-1 bg-[var(--sh-text)]" />}
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[15.5px] leading-[1.85] ${section.align === "center" ? "text-center" : ""}`}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text">
          <div className="bg-[var(--sh-accent)] px-7 py-6 sm:px-9 sm:py-8">
            <blockquote
              className={`${headlineCase} font-bold leading-tight text-xl sm:text-2xl text-[var(--sh-bg)]`}
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.text}
            </blockquote>
            {section.attribution && (
              <cite
                className="block mt-4 not-italic text-[11px] lowercase text-[var(--sh-bg)] opacity-80"
                style={{ fontFamily: "var(--sh-annotation)" }}
              >
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
          <figure
            className={`relative ${section.width === "text" ? "" : "max-w-3xl mx-auto"}`}
            style={portraitConstraint(section.image)}
          >
            {tags && <IndexTag n={startNumber} />}
            <div className={outline}>
              <SmartImage image={section.image} sizes="(max-width: 820px) 100vw, 820px" priority={priority} />
            </div>
            <InkCaption image={section.image} />
          </figure>
        </Container>
      );

    case "split":
    case "row":
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-4 sm:gap-5"
            renderItem={(planned, opts) => (
              <figure className={`relative ${opts.figureClass}`}>
                {tags && <IndexTag n={startNumber + planned.index} />}
                <div className={`${outline} ${opts.mediaClass}`}>
                  <SmartImage image={planned.image} group={section.images} sizes={opts.sizes} {...opts.img} />
                </div>
                <InkCaption image={planned.image} />
              </figure>
            )}
          />
        </Container>
      );

    case "grid": {
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[section.columns];
      const gapClass = { tight: "gap-1.5", regular: "gap-4", loose: "gap-8" }[section.gap];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} ${gapClass}`}>
            {section.images.map((image, i) => (
              <figure key={image.id} className="relative">
                {tags && <IndexTag n={startNumber + i} />}
                <div className={outline}>
                  <SmartImage
                    image={image}
                    group={section.images}
                    fit="cover"
                    aspect="1 / 1"
                    sizes={`(max-width: 640px) 50vw, ${Math.round(100 / section.columns)}vw`}
                  />
                </div>
                <InkCaption image={image} />
              </figure>
            ))}
          </div>
        </Container>
      );
    }

    case "contact-sheet":
      // Index table: the zine's list of plates.
      return (
        <Container width="wide">
          <div className={outline}>
            <ul>
              {section.images.map((image, i) => (
                <li
                  key={image.id}
                  className="flex items-center gap-4 sm:gap-6 px-3 sm:px-5 py-3 border-b border-[var(--sh-border)] last:border-b-0"
                >
                  {section.numbered && (
                    <span
                      className="w-8 shrink-0 text-[12px] text-[var(--sh-accent)]"
                      style={{ fontFamily: "var(--sh-annotation)" }}
                    >
                      {frameNumber(startNumber + i)}
                    </span>
                  )}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                    <SmartImage image={image} group={section.images} fit="cover" aspect="1 / 1" sizes="64px" />
                  </div>
                  <span
                    className="flex-1 min-w-0 truncate text-[12px] lowercase"
                    style={{ fontFamily: "var(--sh-annotation)" }}
                  >
                    {image.caption || image.alt || "untitled"}
                  </span>
                  {image.width && image.height && (
                    <span
                      className="hidden sm:block shrink-0 text-[11px] text-[var(--sh-muted)]"
                      style={{ fontFamily: "var(--sh-annotation)" }}
                    >
                      {image.width}×{image.height}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      );

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image, i) => (
            <Container width="wide" key={image.id}>
              <figure className="relative" style={portraitConstraint(image)}>
                {tags && <IndexTag n={startNumber + i} />}
                <div className={outline}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 1250px) 100vw, 1250px" />
                </div>
                <InkCaption image={image} />
              </figure>
            </Container>
          ))}
        </div>
      );

    case "spacer":
      return (
        <Container width="wide">
          <SpacerBlock size={section.size} divider={section.divider} dividerClassName="!max-w-none !bg-[var(--sh-text)] h-[3px]" />
        </Container>
      );
  }
}

export function KlaxonRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";
  const shout = settings.shout !== "lower";

  const startNumbers: number[] = [];
  let counter = 1;
  for (const section of document.sections) {
    startNumbers.push(counter);
    if (section.type === "image" && section.image) counter += 1;
    else if ("images" in section) counter += section.images.length;
  }
  const total = counter - 1;

  return (
    <article className="pb-24">
      <header className="pt-10 pb-2">
        <Container width="wide">
          <div
            className="flex items-baseline justify-between gap-4 border-b-4 border-[var(--sh-text)] pb-3 text-[11px] lowercase text-[var(--sh-muted)]"
            style={{ fontFamily: "var(--sh-annotation)" }}
          >
            <span>{author ? `by ${author.displayName}` : "slanthour"}</span>
            <span>{total > 0 ? `${total} frames` : ""}</span>
          </div>
          {!startsWithHero && (
            <h1
              className={`${shout ? "uppercase" : "lowercase"} mt-8 font-black leading-[0.88] tracking-tight [text-wrap:balance] text-[clamp(2.6rem,9vw,6.5rem)]`}
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {title}
            </h1>
          )}
        </Container>
      </header>

      <div className="flex flex-col pt-10" style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <KlaxonSection
              section={section}
              settings={settings}
              startNumber={startNumbers[index]}
              priority={index === 0}
            />
          </Reveal>
        ))}
      </div>

      {author && (
        <footer className="mt-24">
          <Container width="wide">
            <div className="h-1 bg-[var(--sh-text)]" />
            <div
              className="pt-3 flex justify-between text-[11px] lowercase text-[var(--sh-muted)]"
              style={{ fontFamily: "var(--sh-annotation)" }}
            >
              <span>{author.displayName}</span>
              <span>end of roll.</span>
            </div>
          </Container>
        </footer>
      )}
    </article>
  );
}
