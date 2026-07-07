"use client";

// ─── Riviera ─────────────────────────────────────────────────────────
// Sun-lit postcard: shell paper, azure ink, white postcard mats (slightly
// tilted, like cards pinned to a board), an airmail stripe, and the photo
// rail — a horizontal scroll-snap carousel for contact sheets.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody, frameNumber } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow } from "../shared/PhotoRow";
import { ScrollRail } from "../shared/ScrollRail";
import { portraitConstraint } from "../shared/photo-layout";

const MAT = "bg-white p-2 sm:p-2.5 border border-[var(--sh-border)]";

/** Classic airmail edge — the postcard signature. */
function AirmailStripe() {
  return (
    <div
      aria-hidden
      className="h-[5px] w-full"
      style={{
        background:
          "repeating-linear-gradient(45deg, var(--sh-accent) 0 12px, transparent 12px 24px, #c94f33 24px 36px, transparent 36px 48px)",
      }}
    />
  );
}

function tiltClass(enabled: boolean, index: number): string {
  if (!enabled) return "";
  return index % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]";
}

function PostcardCaption({
  image,
  number,
  postmarks,
}: {
  image: PageImage;
  number: number | null;
  postmarks: boolean;
}) {
  if (!image.caption && !(postmarks && number !== null)) return null;
  return (
    <figcaption
      className="mt-2 flex items-baseline gap-2 text-[11px] text-[var(--sh-muted)]"
      style={{ fontFamily: "var(--sh-annotation)" }}
    >
      {postmarks && number !== null && (
        <span className="uppercase tracking-[0.15em] text-[var(--sh-accent)] shrink-0">
          № {frameNumber(number)}
        </span>
      )}
      {image.caption && <span>{image.caption}</span>}
    </figcaption>
  );
}

function RivieraSection({
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
  const tilt = settings.tilt === true;
  const postmarks = settings.postmarks === true;

  switch (section.type) {
    case "hero":
      return (
        <div className="relative">
          {section.image && (
            <SmartImage
              image={section.image}
              priority={priority}
              fit="cover"
              aspect={section.height === "full" ? undefined : "21 / 9"}
              fill={false}
              sizes="100vw"
              className={section.height === "full" ? "h-[88svh] w-full object-cover" : ""}
            />
          )}
          <div className="absolute left-4 sm:left-10 bottom-6 sm:bottom-10 max-w-[85%]">
            <div className="bg-[var(--sh-bg)] px-5 py-4 sm:px-7 sm:py-5 border border-[var(--sh-border)]">
              <h1
                className="text-3xl sm:text-5xl font-light italic leading-tight [text-wrap:balance]"
                style={{ fontFamily: "var(--sh-heading)" }}
              >
                {section.title}
              </h1>
              {section.subtitle && (
                <p
                  className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[var(--sh-muted)]"
                  style={{ fontFamily: "var(--sh-annotation)" }}
                >
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
          <h2
            className={`${section.level === 1 ? "text-3xl sm:text-4xl" : "text-2xl"} font-light italic leading-snug [text-wrap:balance]`}
            style={{ fontFamily: "var(--sh-heading)" }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p
              className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[var(--sh-muted)]"
              style={{ fontFamily: "var(--sh-annotation)" }}
            >
              {section.subtitle}
            </p>
          )}
          <div className="mt-4 flex gap-1">
            <span className="block w-10 h-[3px] bg-[var(--sh-accent)]" />
            <span className="block w-3 h-[3px] bg-[var(--sh-accent)] opacity-50" />
          </div>
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <TextBody
            text={section.body}
            className={`text-[15px] leading-[1.95] ${section.align === "center" ? "text-center" : ""}`}
          />
        </Container>
      );

    case "quote":
      return (
        <Container width="text">
          <div className="border-l-[3px] border-[var(--sh-accent)] pl-6 sm:pl-8">
            <blockquote
              className="text-2xl sm:text-[1.75rem] font-light italic leading-snug"
              style={{ fontFamily: "var(--sh-heading)" }}
            >
              {section.text}
            </blockquote>
            {section.attribution && (
              <cite
                className="block mt-3 not-italic text-[11px] uppercase tracking-[0.2em] text-[var(--sh-muted)]"
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
            className={`${section.width === "text" ? "" : "max-w-3xl mx-auto"} ${tiltClass(tilt, startNumber)}`}
            style={portraitConstraint(section.image)}
          >
            <div className={MAT}>
              <SmartImage image={section.image} sizes="(max-width: 820px) 100vw, 820px" priority={priority} />
            </div>
            <PostcardCaption image={section.image} number={postmarks ? startNumber : null} postmarks={postmarks} />
          </figure>
        </Container>
      );

    case "split":
    case "row":
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-5 sm:gap-7"
            justifiedItemClass={(i) => tiltClass(tilt, i)}
            renderItem={(planned, opts) => (
              <figure className={opts.figureClass}>
                <div className={`${MAT} ${opts.mediaClass}`}>
                  <SmartImage image={planned.image} group={section.images} sizes={opts.sizes} {...opts.img} />
                </div>
                <PostcardCaption
                  image={planned.image}
                  number={postmarks ? startNumber + planned.index : null}
                  postmarks={postmarks}
                />
              </figure>
            )}
          />
        </Container>
      );

    case "grid": {
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[section.columns];
      const gapClass = { tight: "gap-3", regular: "gap-6", loose: "gap-10" }[section.gap];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-2 ${colClass} ${gapClass}`}>
            {section.images.map((image, i) => (
              <figure key={image.id} className={tiltClass(tilt, i)}>
                <div className={MAT}>
                  <SmartImage
                    image={image}
                    group={section.images}
                    fit="cover"
                    aspect="4 / 3"
                    sizes={`(max-width: 640px) 50vw, ${Math.round(100 / section.columns)}vw`}
                  />
                </div>
                <PostcardCaption image={image} number={postmarks ? startNumber + i : null} postmarks={postmarks} />
              </figure>
            ))}
          </div>
        </Container>
      );
    }

    case "contact-sheet": {
      // The photo rail — postcards on a rack, scrolled sideways.
      const wide = settings.rail !== "strip";
      const cardClass = wide ? "w-[280px] sm:w-[340px]" : "w-[170px] sm:w-[210px]";
      const sizesHint = wide ? "340px" : "210px";
      return (
        <Container width="wide">
          <ScrollRail gapClass="gap-5" ariaLabel="Photo rail">
            {section.images.map((image, i) => (
              <figure key={image.id} className={`${cardClass} ${tiltClass(tilt, i)}`}>
                <div className={MAT}>
                  <SmartImage image={image} group={section.images} fit="cover" aspect="3 / 2" sizes={sizesHint} />
                </div>
                <PostcardCaption
                  image={image}
                  number={section.numbered ? startNumber + i : null}
                  postmarks={section.numbered}
                />
              </figure>
            ))}
          </ScrollRail>
        </Container>
      );
    }

    case "sequence":
      return (
        <div className="flex flex-col" style={{ gap: "var(--sh-gap)" }}>
          {section.images.map((image, i) => (
            <Container width="wide" key={image.id}>
              <figure
                className={`max-w-3xl mx-auto ${tiltClass(tilt, i)}`}
                style={portraitConstraint(image)}
              >
                <div className={MAT}>
                  <SmartImage image={image} group={section.images} sizes="(max-width: 820px) 100vw, 820px" />
                </div>
                <PostcardCaption image={image} number={postmarks ? startNumber + i : null} postmarks={postmarks} />
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

export function RivieraRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";
  const postmarks = settings.postmarks === true;

  // Running photo numbers, postcard-style.
  const startNumbers: number[] = [];
  let counter = 1;
  for (const section of document.sections) {
    startNumbers.push(counter);
    if (section.type === "image" && section.image) counter += 1;
    else if ("images" in section) counter += section.images.length;
  }

  return (
    <article className="pb-24">
      {postmarks && <AirmailStripe />}

      <header className={startsWithHero ? "pt-0" : "pt-14 pb-2"}>
        {!startsWithHero && (
          <Container width="wide">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] text-[var(--sh-accent)]"
                  style={{ fontFamily: "var(--sh-annotation)" }}
                >
                  {author ? `Carte postale · ${author.displayName}` : "Carte postale"}
                </p>
                <h1
                  className="mt-4 text-4xl sm:text-6xl font-light italic leading-[1.05] [text-wrap:balance]"
                  style={{ fontFamily: "var(--sh-heading)" }}
                >
                  {title}
                </h1>
              </div>
              {postmarks && (
                <div
                  aria-hidden
                  className="hidden sm:flex shrink-0 w-20 h-20 rounded-full border border-[var(--sh-muted)] items-center justify-center -rotate-12 mt-2"
                >
                  <span
                    className="text-[8px] uppercase tracking-[0.2em] text-[var(--sh-muted)] text-center leading-relaxed"
                    style={{ fontFamily: "var(--sh-annotation)" }}
                  >
                    Slant
                    <br />
                    Hour
                    <br />
                    Post
                  </span>
                </div>
              )}
            </div>
          </Container>
        )}
      </header>

      <div className={`flex flex-col ${startsWithHero ? "" : "pt-10"}`} style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <RivieraSection
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
            <div
              className="border-t border-[var(--sh-border)] pt-4 flex items-baseline justify-between text-[10px] uppercase tracking-[0.25em] text-[var(--sh-muted)]"
              style={{ fontFamily: "var(--sh-annotation)" }}
            >
              <span>{author.displayName}</span>
              <span className="italic normal-case tracking-normal" style={{ fontFamily: "var(--sh-heading)" }}>
                fin.
              </span>
            </div>
          </Container>
        </footer>
      )}
    </article>
  );
}
