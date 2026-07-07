"use client";

// ─── Keepsake ────────────────────────────────────────────────────────
// Warm scrapbook: paper layers, tape/pin accents, controlled rotation,
// handwritten annotations. Compositions are predefined templates (never
// free-position); rotations are deterministic per image so layouts are
// stable, and everything recomposes on mobile.

import type { Section, PageImage } from "@/lib/page-document";
import type { ThemeRenderProps } from "../types";
import { Container, Reveal, SpacerBlock, TextBody } from "../shared/primitives";
import { SmartImage } from "../shared/SmartImage";
import { PhotoRow, type PhotoRowItemOpts } from "../shared/PhotoRow";
import { portraitConstraint } from "../shared/photo-layout";

const ROTATIONS = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2, -2.6, 2.0];

function rotationFor(id: string, intensity: string | boolean | undefined): number {
  if (intensity === "none") return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const base = ROTATIONS[Math.abs(hash) % ROTATIONS.length];
  return intensity === "playful" ? base * 1.8 : base;
}

function Tape({ settings, variant = 0 }: { settings: ThemeRenderProps["settings"]; variant?: number }) {
  if (settings.accents === "none") return null;
  if (settings.accents === "pins") {
    return (
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full shadow-sm z-10"
        style={{ background: "var(--sh-accent)", boxShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
      />
    );
  }
  const angle = variant % 2 === 0 ? "-6deg" : "5deg";
  return (
    <span
      aria-hidden
      className="absolute -top-3 left-1/2 w-20 h-6 z-10 opacity-70"
      style={{
        background: "color-mix(in srgb, var(--sh-accent) 32%, #f5efdf)",
        transform: `translateX(-50%) rotate(${angle})`,
      }}
    />
  );
}

function PhotoCard({
  image,
  group,
  settings,
  sizes,
  tapeVariant = 0,
  priority = false,
  layout,
}: {
  image: PageImage;
  group: PageImage[];
  settings: ThemeRenderProps["settings"];
  sizes: string;
  tapeVariant?: number;
  priority?: boolean;
  /** Optional PhotoRow layout opts (equal-height rows / mosaic cells). */
  layout?: PhotoRowItemOpts;
}) {
  const rotation = rotationFor(image.id, settings.rotation);
  const edges = settings.edges;
  const frameClass =
    edges === "polaroid"
      ? "bg-white p-2.5 pb-12 shadow-[0_2px_10px_rgba(60,40,20,0.18)]"
      : edges === "border"
        ? "bg-white p-2 shadow-[0_2px_8px_rgba(60,40,20,0.15)]"
        : "shadow-[0_2px_8px_rgba(60,40,20,0.12)]";

  return (
    <figure
      className={`relative motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:rotate-0 motion-safe:hover:scale-[1.01] ${layout?.figureClass ?? ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Tape settings={settings} variant={tapeVariant} />
      <div className={`${frameClass} ${layout?.mediaClass ?? ""}`}>
        <SmartImage image={image} group={group} sizes={sizes} priority={priority} {...(layout?.img ?? {})} />
        {edges === "polaroid" && image.caption && (
          <figcaption
            className="absolute bottom-3 inset-x-3 text-center text-[16px] leading-tight text-[#4a4032] truncate"
            style={{ fontFamily: "var(--sh-annotation)" }}
          >
            {image.caption}
          </figcaption>
        )}
      </div>
      {edges !== "polaroid" && image.caption && (
        <figcaption
          className="mt-2.5 text-center text-[17px] leading-snug text-[var(--sh-muted)]"
          style={{ fontFamily: "var(--sh-annotation)" }}
        >
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function KeepsakeSection({
  section,
  settings,
  priority,
}: {
  section: Section;
  settings: ThemeRenderProps["settings"];
  priority: boolean;
}) {
  // On midnight paper the "note card" surfaces become subtle light washes
  // instead of bright white cards; photo frames stay white like real prints.
  const dark = settings.paper === "midnight";
  const noteCard = dark
    ? "bg-white/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
    : "bg-white/70 shadow-[0_1px_6px_rgba(60,40,20,0.1)]";
  const quoteCard = dark
    ? "bg-white/[0.07] shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
    : "bg-white/80 shadow-[0_2px_8px_rgba(60,40,20,0.14)]";

  switch (section.type) {
    case "hero":
      return (
        <Container width="wide" className="pt-4">
          <div className="max-w-2xl mx-auto">
            {section.image && (
              <PhotoCard
                image={section.image}
                group={[section.image]}
                settings={settings}
                sizes="(max-width: 720px) 100vw, 720px"
                priority={priority}
              />
            )}
            <div className="text-center mt-10">
              <h1
                className="text-4xl sm:text-5xl [text-wrap:balance]"
                style={{ fontFamily: "var(--sh-annotation)" }}
              >
                {section.title}
              </h1>
              {section.subtitle && (
                <p className="mt-3 text-[15px] text-[var(--sh-muted)] italic" style={{ fontFamily: "var(--sh-heading)" }}>
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
        </Container>
      );

    case "heading":
      return (
        <Container width="text" className="text-center">
          <h2
            className={`[text-wrap:balance] ${section.level === 1 ? "text-3xl sm:text-4xl" : "text-2xl"}`}
            style={{ fontFamily: "var(--sh-annotation)" }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-2 text-[14px] italic text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-heading)" }}>
              {section.subtitle}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
            <span className="w-1 h-1 rounded-full bg-[var(--sh-accent)]" />
            <span className="w-1 h-1 rounded-full bg-[var(--sh-accent)]" />
            <span className="w-1 h-1 rounded-full bg-[var(--sh-accent)]" />
          </div>
        </Container>
      );

    case "text":
      return (
        <Container width="text">
          <div className={`${noteCard} px-6 py-7 sm:px-10 sm:py-9`}>
            <TextBody
              text={section.body}
              className={`text-[15.5px] leading-[1.85] ${section.align === "center" ? "text-center" : ""}`}
              style={{ fontFamily: "var(--sh-heading)" }}
            />
          </div>
        </Container>
      );

    case "quote":
      return (
        <Container width="text" className="text-center">
          <div
            className={`inline-block ${quoteCard} px-8 py-7 motion-safe:transition-transform`}
            style={{ transform: `rotate(${rotationFor(section.id, settings.rotation) * 0.5}deg)` }}
          >
            <blockquote className="text-2xl sm:text-[26px] leading-snug" style={{ fontFamily: "var(--sh-annotation)" }}>
              “{section.text}”
            </blockquote>
            {section.attribution && (
              <cite className="block mt-3 not-italic text-[13px] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-heading)" }}>
                — {section.attribution}
              </cite>
            )}
          </div>
        </Container>
      );

    case "image":
      if (!section.image) return null;
      return (
        <Container width={section.width === "text" ? "text" : "wide"}>
          <div className={section.width === "text" ? "" : "max-w-3xl mx-auto"} style={portraitConstraint(section.image)}>
            <PhotoCard
              image={section.image}
              group={[section.image]}
              settings={settings}
              sizes="(max-width: 820px) 100vw, 820px"
            />
          </div>
        </Container>
      );

    case "split":
      return (
        <Container width="wide">
          <div className="max-w-4xl mx-auto">
            <PhotoRow
              images={section.images}
              gapClass="gap-10 sm:gap-8"
              justifiedItemClass={(i) => (i === 1 ? "sm:mt-16" : "")}
              renderItem={(planned, opts) => (
                <PhotoCard
                  image={planned.image}
                  group={section.images}
                  settings={settings}
                  sizes={opts.sizes}
                  tapeVariant={planned.index}
                  layout={opts}
                />
              )}
            />
          </div>
        </Container>
      );

    case "row":
      return (
        <Container width="wide">
          <PhotoRow
            images={section.images}
            gapClass="gap-10 sm:gap-6"
            justifiedItemClass={(i) => (i === 1 ? "sm:-mt-8" : "sm:mt-4")}
            renderItem={(planned, opts) => (
              <PhotoCard
                image={planned.image}
                group={section.images}
                settings={settings}
                sizes={opts.sizes}
                tapeVariant={planned.index}
                layout={opts}
              />
            )}
          />
        </Container>
      );

    case "grid":
    case "contact-sheet": {
      const columns = section.type === "grid" ? section.columns : 3;
      const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
      return (
        <Container width="wide">
          <div className={`grid grid-cols-1 min-[480px]:grid-cols-2 ${colClass} gap-x-6 gap-y-12`}>
            {section.images.map((image, i) => (
              <PhotoCard
                key={image.id}
                image={image}
                group={section.images}
                settings={settings}
                sizes={`(max-width: 640px) 100vw, ${Math.round(100 / columns)}vw`}
                tapeVariant={i}
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
            <Container width="wide" key={image.id}>
              <div
                className={`max-w-2xl ${i % 2 === 0 ? "mr-auto sm:ml-12" : "ml-auto sm:mr-12"}`}
                style={{ ...portraitConstraint(image), marginInline: undefined }}
              >
                <PhotoCard image={image} group={section.images} settings={settings} sizes="(max-width: 720px) 100vw, 680px" tapeVariant={i} />
              </div>
            </Container>
          ))}
        </div>
      );

    case "spacer":
      return (
        <Container width="text">
          <SpacerBlock size={section.size} divider={section.divider} dividerClassName="!bg-[var(--sh-accent)] opacity-40" />
        </Container>
      );
  }
}

export function KeepsakeRenderer({ document, settings, title, author }: ThemeRenderProps) {
  const startsWithHero = document.sections[0]?.type === "hero";

  return (
    <article className="pb-24 overflow-x-clip">
      <header className="pt-12 pb-2 text-center">
        {!startsWithHero && (
          <Container width="text">
            <h1 className="text-4xl sm:text-5xl [text-wrap:balance]" style={{ fontFamily: "var(--sh-annotation)" }}>
              {title}
            </h1>
            {author && (
              <p className="mt-3 text-[13px] italic text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-heading)" }}>
                kept by {author.displayName}
              </p>
            )}
          </Container>
        )}
      </header>

      <div className="flex flex-col pt-8" style={{ gap: "var(--sh-gap)" }}>
        {document.sections.map((section, index) => (
          <Reveal key={section.id} disabled={index === 0}>
            <KeepsakeSection section={section} settings={settings} priority={index === 0} />
          </Reveal>
        ))}
      </div>

      {author && (
        <footer className="mt-24 text-center">
          <p className="text-[20px] text-[var(--sh-muted)]" style={{ fontFamily: "var(--sh-annotation)" }}>
            — {author.displayName}
          </p>
        </footer>
      )}
    </article>
  );
}
