"use client";

// ─── Verdigris ───────────────────────────────────────────────────────
// Botanical dusk: deep green grounds, copper and patina inks, arched
// plate frames like conservatory windows, engraved "Pl. IV" captions and
// fleuron ornaments. Airy, centered, unhurried.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow } from "../shared/PhotoRow";
import { portraitConstraint } from "../shared/photo-layout";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

function roman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

function Fleuron({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span aria-hidden className="block text-center text-[var(--sh-accent)] text-lg leading-none">
      ❦
    </span>
  );
}

function PlateCaption({
  image,
  number,
  botanical,
}: {
  image: PageImage;
  number: number | null;
  botanical: boolean;
}) {
  if (!image.caption && !(botanical && number !== null)) return null;
  return (
    <figcaption
      className="mt-3 text-center text-[12px] italic leading-relaxed text-[var(--sh-muted)]"
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {botanical && number !== null && (
        <span className="not-italic text-[10px] uppercase tracking-[0.25em] text-[var(--sh-accent)]">
          Pl. {roman(number)}
        </span>
      )}
      {botanical && number !== null && image.caption && <span className="not-italic"> · </span>}
      {image.caption && <span>{image.caption}</span>}
    </figcaption>
  );
}

/** Arch mask for cover-cropped frames — a conservatory window. */
function archStyle(enabled: boolean): React.CSSProperties | undefined {
  return enabled
    ? { borderTopLeftRadius: "999px", borderTopRightRadius: "999px", overflow: "hidden" }
    : undefined;
}

function VerdigrisSection({
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
  const arches = settings.arches === true;
  const botanical = settings.plates !== "plain";
  const filigree = settings.filigree === true;
  const frame = "border border-[var(--sh-border)] p-1.5 bg-[var(--sh-surface)]";

  switch (section.type) {
    case "hero":
      if (section.height === "half") {
        return (
          <Container width="wide">
            <div className="max-w-xl mx-auto">
              {section.image && (
                <div style={archStyle(arches)}>
                  <SmartImage
                    image={section.image}
                    priority={priority}
                    fit="cover"
                    aspect="3 / 4"
                    sizes="(max-width: 640px) 100vw, 576px"
                  />
                </div>
              )}
              <div className="mt-10 text-center">
                <Fleuron show={filigree} />
                <h1
                  className="mt-3 text-4xl sm:text-5xl font-extralight italic leading-tight [text-wrap:balance]"
                  style={{ fontFamily: "var(--sh-heading)" }}
                >
                  {section.title}
                </h1>
                {section.subtitle && (
                  <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-[var(--sh-muted)]">
                    {section.subtitle}
                  </p>
                )}
              </div>
            </div>
          </Container>
        );
      }
      return (
        <div className="relative">
          {section.image && (
            <SmartImage
              image={section.image}
              priority={priority}
              fit="cover"
              sizes="100vw"
              className="h-[88svh] w-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-10 flex justify-center px-5">
            <div className="bg-[var(--sh-bg)]/85 backdrop-blur-sm border border-[var(--sh-border)] px-8 py-6 text-center max-w-2xl">
              <h1
                className="text-3xl sm:text-5xl font-extralight italic leading-tight [text-wrap:balance]"
                style={{ fontFamily: "var(--sh-heading)" }}
              >
                {section.title}
              </h1>
              {section.subtitle && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[var(--sh-muted)]">
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case "heading":
      return (
        <Container width="text">
          <div className="text-center">
            <Fleuron show={filigree} />
            <h2
              className={`mt-3 font-extralight italic leading-snug [text-wrap:balance] ${section.level === 1 ? "text-3xl sm:text-4xl" : "text-2xl"}`}
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[var(--sh-muted)]">
                {section.subtitle}
              </p>
            )}
          </div>
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[16px] leading-[2] ${section.align === "center" ? "text-center" : ""}`}
            style={{ fontFamily: "var(--sh-heading)" }}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text">
          <div className="text-center">
            <Fleuron show={filigree} />
            <blockquote
              className="mt-4 text-2xl sm:text-[1.8rem] font-extralight italic leading-relaxed [text-wrap:balance]"
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.text}
            </blockquote>
            {section.attribution && (
              <cite className="block mt-5 not-italic text-[10px] uppercase tracking-[0.3em] text-[var(--sh-muted)]">
                {section.attribution}
              </cite>
            )}
          </div>
        </Container>
      );

    case "image": {
      if (!section.image) return null;
      const portrait =
        (section.image.height ?? 0) > (section.image.width ?? 1) && section.width !== "full";
      return (
        <Container width={section.width === "full" ? "wide" : section.width}>
          <figure
            className={section.width === "text" ? "" : "max-w-3xl mx-auto"}
            style={portraitConstraint(section.image)}
          >
            {portrait && arches ? (
              <div style={archStyle(true)}>
                <SmartImage
                  image={section.image}
                  fit="cover"
                  aspect="3 / 4"
                  sizes="(max-width: 820px) 100vw, 820px"
                  priority={priority}
                />
              </div>
            ) : (
              <div className={frame}>
                <SmartImage image={section.image} sizes="(max-width: 820px) 100vw, 820px" priority={priority} />
              </div>
            )}
            <PlateCaption image={section.image} number={botanical ? startNumber : null} botanical={botanical} />
          </figure>
        </Container>
      );
    }

    case "split":
    case "row":
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-5 sm:gap-8"
            renderItem={(planned, opts) => (
              <figure className={opts.figureClass}>
                <div className={`${frame} ${opts.mediaClass}`}>
                  <SmartImage image={planned.image} group={section.images} sizes={opts.sizes} {...opts.img} />
                </div>
                <PlateCaption
                  image={planned.image}
                  number={botanical ? startNumber + planned.index : null}
                  botanical={botanical}
                />
              </figure>
            )}
          />
        </Container>
      );

    case "grid": {
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[section.columns];
      const gapClass = { tight: "gap-4", regular: "gap-8", loose: "gap-12" }[section.gap];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} ${gapClass}`}>
            {section.images.map((image, i) => (
              <figure key={image.id}>
                <div style={archStyle(arches)} className={arches ? "" : frame}>
                  <SmartImage
                    image={image}
                    group={section.images}
                    fit="cover"
                    aspect="3 / 4"
                    sizes={`(max-width: 640px) 50vw, ${Math.round(100 / section.columns)}vw`}
                  />
                </div>
                <PlateCaption image={image} number={botanical ? startNumber + i : null} botanical={botanical} />
              </figure>
            ))}
          </div>
        </Container>
      );
    }

    case "contact-sheet":
      return (
        <Container width="wide">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {section.images.map((image, i) => (
              <figure key={image.id}>
                <div className={frame}>
                  <SmartImage image={image} group={section.images} fit="cover" aspect="1 / 1" sizes="20vw" />
                </div>
                {section.numbered && (
                  <figcaption className="mt-1.5 text-center text-[9px] uppercase tracking-[0.2em] text-[var(--sh-muted)]">
                    Pl. {roman(startNumber + i)}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Container>
      );

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image, i) => (
            <Container width="wide" key={image.id}>
              <figure className="max-w-2xl mx-auto" style={portraitConstraint(image)}>
                <div className={frame}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 672px) 100vw, 672px" />
                </div>
                <PlateCaption image={image} number={botanical ? startNumber + i : null} botanical={botanical} />
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

export function VerdigrisRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";
  const filigree = settings.filigree === true;

  const startNumbers: number[] = [];
  let counter = 1;
  for (const section of document.sections) {
    startNumbers.push(counter);
    if (section.type === "image" && section.image) counter += 1;
    else if ("images" in section) counter += section.images.length;
  }

  return (
    <article className="pb-28">
      <header className={startsWithHero ? "pt-0" : "pt-16 pb-4"}>
        {!startsWithHero && (
          <Container width="text">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--sh-muted)]">
                {author ? `A collection by ${author.displayName}` : "A collection"}
              </p>
              <h1
                className="mt-6 text-4xl sm:text-6xl font-extralight italic leading-[1.1] [text-wrap:balance]"
                style={{ fontFamily: "var(--sh-heading)" }}
              >
                {title}
              </h1>
              {filigree && (
                <div className="mt-8 flex items-center justify-center gap-3" aria-hidden>
                  <span className="block w-16 h-px bg-[var(--sh-border)]" />
                  <span className="text-[var(--sh-accent)] text-sm leading-none">❦</span>
                  <span className="block w-16 h-px bg-[var(--sh-border)]" />
                </div>
              )}
            </div>
          </Container>
        )}
      </header>

      <div className={`flex flex-col ${startsWithHero ? "" : "pt-12"}`} style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <VerdigrisSection
              section={section}
              settings={settings}
              startNumber={startNumbers[index]}
              priority={index === 0}
            />
          </Reveal>
        ))}
      </div>

      {author && (
        <footer className="mt-28">
          <Container width="text">
            <div className="text-center">
              {filigree && <Fleuron show />}
              <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-[var(--sh-muted)]">
                {author.displayName}
              </p>
            </div>
          </Container>
        </footer>
      )}
    </article>
  );
}
