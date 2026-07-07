"use client";

// ─── After Dark ──────────────────────────────────────────────────────
// Cinematic dark presentation: full-width frames, chapter cards, optional
// letterboxing, restrained accents. Landscape images dominate the viewport;
// portrait images are centred against the dark field rather than cropped.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow } from "../shared/PhotoRow";

const LETTERBOX_ASPECT: Record<string, string | undefined> = {
  none: undefined,
  widescreen: "16 / 9",
  cinema: "2.39 / 1",
};

function isPortrait(image: PageImage): boolean {
  return !!image.width && !!image.height && image.height > image.width;
}

function CinemaFrame({
  image,
  group,
  settings,
  priority = false,
  sizes = "100vw",
}: {
  image: PageImage;
  group: PageImage[];
  settings: ThemeRenderProps["settings"];
  priority?: boolean;
  sizes?: string;
}) {
  const letterbox = LETTERBOX_ASPECT[String(settings.letterbox)];
  const overlay = settings.captions === "overlay";
  const portrait = isPortrait(image);

  return (
    <figure className="relative">
      {portrait ? (
        // Portrait: present elegantly against the dark field, never force-crop.
        <div className="flex justify-center bg-[var(--sh-surface)]">
          <div className="w-full max-w-md sm:max-w-lg">
            <SmartImage image={image} group={group} sizes="(max-width: 640px) 100vw, 512px" priority={priority} />
          </div>
        </div>
      ) : letterbox ? (
        <SmartImage image={image} group={group} fit="cover" aspect={letterbox} sizes={sizes} priority={priority} />
      ) : (
        <SmartImage image={image} group={group} sizes={sizes} priority={priority} />
      )}
      {image.caption &&
        (overlay ? (
          <figcaption
            className="absolute inset-x-0 bottom-0 px-5 py-4 text-[13px] text-white/85 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}
          >
            {image.caption}
          </figcaption>
        ) : (
          <figcaption className="mt-3 px-5 sm:px-0 text-[12px] uppercase tracking-[0.18em] text-[var(--sh-muted)]">
            {image.caption}
          </figcaption>
        ))}
    </figure>
  );
}

function AfterDarkSection({
  section,
  settings,
  chapterNumber,
  priority,
}: {
  section: Section;
  settings: ThemeRenderProps["settings"];
  chapterNumber: number | null;
  priority: boolean;
}) {
  switch (section.type) {
    case "hero":
      return (
        <div className="relative min-h-[92svh] flex items-end overflow-hidden">
          {section.image && (
            <SmartImage
              image={section.image}
              priority={priority}
              fit="cover"
              sizes="100vw"
              className="!absolute inset-0 h-full"
            />
          )}
          <div
            className="relative w-full px-6 sm:px-14 pb-14 pt-40"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
          >
            <div className="w-12 h-[2px] mb-6" style={{ background: "var(--sh-accent)" }} />
            <h1
              className="text-4xl sm:text-6xl font-medium tracking-tight text-white [text-wrap:balance] max-w-4xl"
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="mt-4 text-white/70 text-sm sm:text-base uppercase tracking-[0.2em]">
                {section.subtitle}
              </p>
            )}
          </div>
        </div>
      );

    case "heading":
      return (
        <div className="min-h-[46svh] flex flex-col items-center justify-center text-center px-6">
          {settings.chapterStyle === "numbered" && chapterNumber !== null && (
            <p className="text-[11px] uppercase tracking-[0.5em] mb-6" style={{ color: "var(--sh-accent)" }}>
              Chapter {String(chapterNumber).padStart(2, "0")}
            </p>
          )}
          <h2
            className={`font-medium tracking-tight [text-wrap:balance] ${section.level === 1 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-5 text-[var(--sh-muted)] text-sm uppercase tracking-[0.25em] max-w-xl">
              {section.subtitle}
            </p>
          )}
        </div>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[16px] leading-[1.95] text-[color-mix(in_srgb,var(--sh-text)_88%,transparent)] ${section.align === "center" ? "text-center" : ""}`}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text" className="text-center">
          <blockquote
            className="text-2xl sm:text-3xl font-light leading-snug [text-wrap:balance]"
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.text}
          </blockquote>
          {section.attribution && (
            <cite className="block mt-6 not-italic text-[11px] uppercase tracking-[0.4em]" style={{ color: "var(--sh-accent)" }}>
              {section.attribution}
            </cite>
          )}
        </Container>
      );

    case "image": {
      if (!section.image) return null;
      if (section.width === "full") {
        return <CinemaFrame image={section.image} group={[section.image]} settings={settings} sizes="100vw" priority={priority} />;
      }
      return (
        <Container width={section.width}>
          <CinemaFrame image={section.image} group={[section.image]} settings={settings} sizes="(max-width: 1300px) 100vw, 1300px" priority={priority} />
        </Container>
      );
    }

    case "split":
    case "row": {
      const overlay = settings.captions === "overlay";
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-2"
            renderItem={(planned, opts) => (
              <figure className={`relative ${opts.figureClass}`}>
                <div className={opts.mediaClass}>
                  <SmartImage
                    image={planned.image}
                    group={section.images}
                    sizes={opts.sizes}
                    {...opts.img}
                  />
                </div>
                {planned.image.caption &&
                  (overlay ? (
                    <figcaption
                      className="absolute inset-x-0 bottom-0 px-4 py-3 text-[12px] text-white/85 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}
                    >
                      {planned.image.caption}
                    </figcaption>
                  ) : (
                    <figcaption className="mt-2 text-[11px] uppercase tracking-[0.15em] text-[var(--sh-muted)]">
                      {planned.image.caption}
                    </figcaption>
                  ))}
              </figure>
            )}
          />
        </Container>
      );
    }

    case "grid":
    case "contact-sheet": {
      const columns = section.type === "grid" ? section.columns : 4;
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} gap-1.5`}>
            {section.images.map((image) => (
              <SmartImage
                key={image.id}
                image={image}
                group={section.images}
                fit="cover"
                aspect="1 / 1"
                sizes={`(max-width: 640px) 50vw, ${Math.round(100 / columns)}vw`}
              />
            ))}
          </div>
        </Container>
      );
    }

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image, i) => (
            <CinemaFrame key={image.id} image={image} group={section.images} settings={settings} sizes="100vw" priority={priority && i === 0} />
          ))}
        </div>
      );

    case "spacer":
      return (
        <Container width="text">
          <SpacerBlock size={section.size} divider={section.divider} dividerClassName="!bg-[var(--sh-accent)] opacity-50 !max-w-[3rem]" />
        </Container>
      );
  }
}

export function AfterDarkRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";
  const reveals = settings.transitions === true;
  let chapterCount = 0;

  return (
    <article className="pb-24">
      {!startsWithHero && (
        <header className="min-h-[38svh] flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-[2px] mb-8" style={{ background: "var(--sh-accent)" }} />
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight [text-wrap:balance]" style={{ fontFamily: "var(--sh-heading)" }}>
            {title}
          </h1>
          {author && (
            <p className="mt-6 text-[11px] uppercase tracking-[0.4em] text-[var(--sh-muted)]">
              {author.displayName}
            </p>
          )}
        </header>
      )}

      <div className="flex flex-col" style={{ gap: "var(--sh-gap)", paddingTop: startsWithHero ? 0 : "var(--sh-gap)" }}>
        {document.sections.map((section, index) => {
          const chapterNumber = section.type === "heading" ? ++chapterCount : null;
          return (
            <Reveal key={section.id} disabled={!reveals || index === 0}>
              <AfterDarkSection
                section={section}
                settings={settings}
                chapterNumber={chapterNumber}
                priority={index === 0}
              />
            </Reveal>
          );
        })}
      </div>

      {author && (
        <footer className="mt-28 text-center px-6">
          <div className="w-8 h-[2px] mx-auto mb-6" style={{ background: "var(--sh-accent)" }} />
          <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--sh-muted)]">
            {author.displayName}
          </p>
        </footer>
      )}
    </article>
  );
}
