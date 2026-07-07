"use client";

// ─── Roll 36 ─────────────────────────────────────────────────────────
// Contact sheet / film roll: dense organised grids, frame numbers, small
// archival annotations, darkroom or light-table surface. Frame numbering
// runs across the whole page like exposures on a roll.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody, frameNumber } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow, type PhotoRowItemOpts } from "../shared/PhotoRow";
import { portraitConstraint } from "../shared/photo-layout";

const DENSITY_COLS: Record<string, { grid: string; sheet: string; size: string }> = {
  loose: { grid: "sm:grid-cols-3", sheet: "sm:grid-cols-4", size: "33vw" },
  standard: { grid: "sm:grid-cols-4", sheet: "sm:grid-cols-6", size: "25vw" },
  dense: { grid: "sm:grid-cols-5", sheet: "sm:grid-cols-8", size: "20vw" },
};

function Frame({
  image,
  group,
  number,
  settings,
  sizes,
  layout,
}: {
  image: PageImage;
  group: PageImage[];
  number: number;
  settings: ThemeRenderProps["settings"];
  sizes: string;
  /** Optional PhotoRow layout opts — override the crop setting per cell. */
  layout?: PhotoRowItemOpts;
}) {
  const bordered = settings.borders === true;
  const uniform = settings.crop !== "natural";
  const imgProps = layout
    ? layout.img
    : { fit: (uniform ? "cover" : "natural") as "cover" | "natural", aspect: uniform ? "3 / 2" : undefined };
  return (
    <figure className={`min-w-0 ${layout?.figureClass ?? ""}`}>
      <div
        className={`${bordered ? "border border-[var(--sh-border)] bg-[var(--sh-surface)] p-1" : ""} ${layout?.mediaClass ?? ""}`}
      >
        <SmartImage image={image} group={group} sizes={sizes} {...imgProps} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[10px] leading-tight text-[var(--sh-muted)]">
        {settings.frameNumbers === true && (
          <span className="shrink-0 text-[var(--sh-accent)]">{frameNumber(number)}</span>
        )}
        {settings.showCaptions === true && image.caption && (
          <figcaption className="truncate text-right">{image.caption}</figcaption>
        )}
      </div>
    </figure>
  );
}

function Roll36Section({
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
  const density = DENSITY_COLS[String(settings.density)] ?? DENSITY_COLS.standard;

  switch (section.type) {
    case "hero":
      return (
        <div>
          {section.image && (
            <Container width="full">
              <SmartImage image={section.image} priority={priority} fit="cover" aspect="21 / 9" sizes="100vw" />
            </Container>
          )}
          <Container width="wide" className="mt-6">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[var(--sh-border)] pb-4">
              <h1 className="text-2xl sm:text-4xl uppercase tracking-[0.08em]" style={{ fontFamily: "var(--sh-heading)" }}>
                {section.title}
              </h1>
              {section.subtitle && (
                <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--sh-muted)]">{section.subtitle}</p>
              )}
            </div>
          </Container>
        </div>
      );

    case "heading":
      return (
        <Container width="wide">
          <div className="flex items-baseline gap-4 border-b border-[var(--sh-border)] pb-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sh-accent)]">▸</span>
            <h2
              className={`uppercase tracking-[0.08em] ${section.level === 1 ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-[11px] text-[var(--sh-muted)] uppercase tracking-[0.15em]">{section.subtitle}</p>
            )}
          </div>
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[14px] leading-[1.85] ${section.align === "center" ? "text-center" : ""}`}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text">
          <blockquote className="border-l-2 border-[var(--sh-accent)] pl-5 text-[15px] leading-relaxed">
            {section.text}
            {section.attribution && (
              <cite className="block mt-3 not-italic text-[11px] uppercase tracking-[0.2em] text-[var(--sh-muted)]">
                — {section.attribution}
              </cite>
            )}
          </blockquote>
        </Container>
      );

    case "image":
      if (!section.image) return null;
      return (
        <Container width={section.width === "text" ? "text" : "wide"}>
          <div style={settings.crop === "natural" ? portraitConstraint(section.image) : undefined}>
            <Frame
              image={section.image}
              group={[section.image]}
              number={startNumber}
              settings={settings}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        </Container>
      );

    case "split":
    case "row": {
      // Uniform mode crops every frame to 3:2 — the row is already even,
      // like exposures on a strip. Natural mode uses the layout planner.
      if (settings.crop !== "natural") {
        const cols = section.type === "split" ? "sm:grid-cols-2" : "sm:grid-cols-3";
        const size = section.type === "split" ? "50vw" : "33vw";
        return (
          <Container width="wide">
            <div className={`grid grid-cols-1 ${cols} gap-3`}>
              {section.images.map((image, i) => (
                <Frame key={image.id} image={image} group={section.images} number={startNumber + i} settings={settings} sizes={`(max-width: 640px) 100vw, ${size}`} />
              ))}
            </div>
          </Container>
        );
      }
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-3"
            renderItem={(planned, opts) => (
              <Frame
                image={planned.image}
                group={section.images}
                number={startNumber + planned.index}
                settings={settings}
                sizes={opts.sizes}
                layout={opts}
              />
            )}
          />
        </Container>
      );
    }

    case "grid":
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${density.grid} gap-2 sm:gap-3`}>
            {section.images.map((image, i) => (
              <Frame key={image.id} image={image} group={section.images} number={startNumber + i} settings={settings} sizes={`(max-width: 640px) 50vw, ${density.size}`} />
            ))}
          </div>
        </Container>
      );

    case "contact-sheet":
      return (
        <Container width="wide">
          <div className="border border-[var(--sh-border)] bg-[var(--sh-surface)] p-2 sm:p-3">
            <div className={`grid grid-cols-3 ${density.sheet} gap-1.5`}>
              {section.images.map((image, i) => (
                <figure key={image.id} className="min-w-0">
                  <SmartImage
                    image={image}
                    group={section.images}
                    fit="cover"
                    aspect="3 / 2"
                    sizes="(max-width: 640px) 33vw, 16vw"
                  />
                  {section.numbered && (
                    <figcaption className="mt-0.5 text-[9px] text-[var(--sh-muted)]">
                      <span className="text-[var(--sh-accent)]">{frameNumber(startNumber + i)}</span>
                      {settings.showCaptions === true && image.caption ? ` ${image.caption}` : ""}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </Container>
      );

    case "sequence":
      return (
        <div className="flex flex-col gap-8">
          {section.images.map((image, i) => (
            <Container width="wide" key={image.id}>
              <div style={settings.crop === "natural" ? portraitConstraint(image) : undefined}>
                <Frame image={image} group={section.images} number={startNumber + i} settings={settings} sizes="(max-width: 1200px) 100vw, 1200px" />
              </div>
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

export function Roll36Renderer({ document, settings, title, author }: ThemeRenderProps) {
  // Global frame counter, like exposures on a roll.
  const startNumbers: number[] = [];
  let counter = 1;
  for (const section of document.sections) {
    startNumbers.push(counter);
    if (["image", "split", "row", "grid", "contact-sheet", "sequence"].includes(section.type)) {
      counter +=
        section.type === "image"
          ? section.image
            ? 1
            : 0
          : "images" in section
            ? section.images.length
            : 0;
    }
  }
  const startsWithHero = document.sections[0]?.type === "hero";

  return (
    <article className="pb-20">
      <header className="pt-8 pb-6">
        <Container width="wide">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--sh-muted)]">
            <span>
              {author?.displayName ?? ""} {author ? "·" : ""} ROLL
            </span>
            <span>{counter - 1 > 0 ? `${counter - 1} EXP` : ""}</span>
          </div>
          {!startsWithHero && (
            <h1 className="mt-4 text-2xl sm:text-4xl uppercase tracking-[0.08em] border-b border-[var(--sh-border)] pb-4" style={{ fontFamily: "var(--sh-heading)" }}>
              {title}
            </h1>
          )}
        </Container>
      </header>

      <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <Roll36Section
              section={section}
              settings={settings}
              startNumber={startNumbers[index]}
              priority={index === 0}
            />
          </Reveal>
        ))}
      </div>

      {author && (
        <footer className="mt-20">
          <Container width="wide">
            <div className="border-t border-[var(--sh-border)] pt-4 text-[10px] uppercase tracking-[0.3em] text-[var(--sh-muted)] flex justify-between">
              <span>{author.displayName}</span>
              <span>END OF ROLL</span>
            </div>
          </Container>
        </footer>
      )}
    </article>
  );
}
