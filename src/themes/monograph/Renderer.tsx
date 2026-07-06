"use client";

// ─── Monograph ───────────────────────────────────────────────────────
// Editorial magazine: strong typography, generous whitespace, restrained
// colour, alternating image/text rhythm. Reading column for text, wider
// column for images, optional full-bleed hero and chapter numbering.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";

const GAP_CLASS = { tight: "gap-1", regular: "gap-4", loose: "gap-8" } as const;

function Caption({
  image,
  position,
}: {
  image: PageImage;
  position: string | boolean | undefined;
}) {
  if (!image.caption) return null;
  return (
    <figcaption
      className={`text-[13px] leading-relaxed text-[var(--sh-muted)] ${
        position === "margin" ? "lg:text-left" : ""
      } mt-3 italic`}
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {image.caption}
    </figcaption>
  );
}

function MonographSection({
  section,
  chapterNumber,
  settings,
  priority,
}: {
  section: Section;
  chapterNumber: number | null;
  settings: ThemeRenderProps["settings"];
  priority: boolean;
}) {
  const frame =
    settings.imageFrame === "hairline" ? "border border-[var(--sh-border)] p-2 sm:p-3" : "";
  const captionPos = settings.captions;

  switch (section.type) {
    case "hero": {
      const tall = section.height === "full";
      return (
        <div className={`relative w-full overflow-hidden ${tall ? "min-h-[88svh]" : ""}`}>
          {section.image ? (
            <SmartImage
              image={section.image}
              priority={priority}
              fit="cover"
              aspect={tall ? undefined : "21 / 9"}
              sizes="100vw"
              className={tall ? "!absolute inset-0 h-full" : ""}
            />
          ) : (
            <div className={tall ? "absolute inset-0 bg-[var(--sh-surface)]" : "aspect-[21/9] bg-[var(--sh-surface)]"} />
          )}
          <div
            className={`${tall ? "absolute" : "absolute"} inset-x-0 bottom-0 px-6 sm:px-12 pb-10 pt-28`}
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
            }}
          >
            <h1
              className="text-4xl sm:text-6xl font-light text-white [text-wrap:balance] max-w-4xl"
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="mt-3 text-white/80 text-base sm:text-lg italic max-w-2xl" style={{ fontFamily: "var(--sh-annotation)" }}>
                {section.subtitle}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "heading":
      return (
        <Container width="text" className="text-center">
          {settings.chapterNumbers === true && chapterNumber !== null && (
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--sh-accent)] mb-4">
              № {String(chapterNumber).padStart(2, "0")}
            </p>
          )}
          <h2
            className={`font-light [text-wrap:balance] ${section.level === 1 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-4 text-[var(--sh-muted)] italic" style={{ fontFamily: "var(--sh-annotation)" }}>
              {section.subtitle}
            </p>
          )}
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[17px] leading-[1.9] ${section.align === "center" ? "text-center" : ""}`}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text" className="text-center">
          <div className="w-10 h-px bg-[var(--sh-accent)] mx-auto mb-8" />
          <blockquote
            className="text-2xl sm:text-3xl font-light italic leading-snug [text-wrap:balance]"
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.text}
          </blockquote>
          {section.attribution && (
            <cite className="block mt-6 not-italic text-[12px] uppercase tracking-[0.25em] text-[var(--sh-muted)]">
              {section.attribution}
            </cite>
          )}
        </Container>
      );

    case "image": {
      if (!section.image) return null;
      const marginCaption = captionPos === "margin" && section.width !== "full";
      return (
        <Container width={section.width}>
          <figure
            className={
              marginCaption
                ? "lg:grid lg:grid-cols-[1fr_14rem] lg:gap-8 lg:items-end"
                : ""
            }
          >
            <div className={frame}>
              <SmartImage image={section.image} priority={priority} sizes="(max-width: 1100px) 100vw, 1100px" />
            </div>
            <Caption image={section.image} position={captionPos} />
          </figure>
        </Container>
      );
    }

    case "split":
      return (
        <Container width="wide">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8 items-start">
            {section.images.map((image) => (
              <figure key={image.id}>
                <div className={frame}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <Caption image={image} position={captionPos} />
              </figure>
            ))}
          </div>
        </Container>
      );

    case "row":
      return (
        <Container width="wide">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-start">
            {section.images.map((image) => (
              <figure key={image.id}>
                <div className={frame}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <Caption image={image} position={captionPos} />
              </figure>
            ))}
          </div>
        </Container>
      );

    case "grid":
    case "contact-sheet": {
      const images = section.images;
      const columns = section.type === "grid" ? section.columns : 4;
      const gapClass = section.type === "grid" ? GAP_CLASS[section.gap] : "gap-2";
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} ${gapClass}`}>
            {images.map((image) => (
              <figure key={image.id}>
                <SmartImage
                  image={image}
                  group={images}
                  fit="cover"
                  aspect="1 / 1"
                  sizes={`(max-width: 640px) 50vw, ${Math.round(100 / columns)}vw`}
                />
              </figure>
            ))}
          </div>
        </Container>
      );
    }

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image) => (
            <Container width="wide" key={image.id}>
              <figure>
                <div className={frame}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 1100px) 100vw, 1100px" />
                </div>
                <Caption image={image} position={captionPos} />
              </figure>
            </Container>
          ))}
        </div>
      );

    case "spacer":
      return (
        <Container width="text">
          <SpacerBlock size={section.size} divider={section.divider} />
        </Container>
      );
  }
}

export function MonographRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";
  let chapterCount = 0;

  return (
    <article className="pb-24">
      {!startsWithHero && (
        <header className="pt-12 pb-2">
          <Container width="wide">
            <div className="flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.28em] text-[var(--sh-muted)]">
              <span className="truncate">{author?.displayName ?? ""}</span>
              <span className="truncate text-right">{title}</span>
            </div>
            <div className="mt-4 h-px bg-[var(--sh-border)]" />
          </Container>
        </header>
      )}

      <div className="flex flex-col" style={{ gap: "var(--sh-gap)", paddingTop: startsWithHero ? 0 : "var(--sh-gap)" }}>
        {document.sections.map((section, index) => {
          const chapterNumber = section.type === "heading" ? ++chapterCount : null;
          return (
            <Reveal key={section.id} disabled={index === 0}>
              <MonographSection
                section={section}
                chapterNumber={chapterNumber}
                settings={settings}
                priority={index === 0}
              />
            </Reveal>
          );
        })}
      </div>

      {author && (
        <footer className="mt-28">
          <Container width="text" className="text-center">
            <div className="w-10 h-px bg-[var(--sh-border)] mx-auto mb-8" />
            <p className="text-[12px] uppercase tracking-[0.28em] text-[var(--sh-muted)]">
              {author.displayName}
            </p>
          </Container>
        </footer>
      )}
    </article>
  );
}
