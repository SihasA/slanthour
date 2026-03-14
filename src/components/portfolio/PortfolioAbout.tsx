interface PortfolioAboutProps {
  displayName: string;
  bio: string | null;
  emailPublic: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  accentColor: string;
  headingFamily: string;
  bodyFamily: string;
  ruleColor: string;
  mutedColor: string;
}

export function PortfolioAbout({
  displayName,
  bio,
  emailPublic,
  instagramHandle,
  websiteUrl,
  accentColor,
  headingFamily,
  bodyFamily,
  ruleColor,
  mutedColor,
}: PortfolioAboutProps) {
  const hasContact = emailPublic || instagramHandle || websiteUrl;

  if (!bio && !hasContact) return null;

  return (
    <section
      className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start"
      style={{ borderTop: `1px solid ${ruleColor}` }}
    >
      {/* About text */}
      <div>
        <p
          className="text-[9px] uppercase mb-6"
          style={{
            letterSpacing: "0.35em",
            color: accentColor,
            fontFamily: bodyFamily,
          }}
        >
          About
        </p>
        <h2
          className="text-[36px] font-light italic leading-[1.2] mb-5"
          style={{ fontFamily: headingFamily }}
        >
          {displayName}
        </h2>
        {bio && (
          <p
            className="text-[17px] leading-[1.8]"
            style={{ fontFamily: headingFamily, color: mutedColor }}
          >
            {bio}
          </p>
        )}
      </div>

      {/* Contact links */}
      {hasContact && (
        <div>
          <p
            className="text-[9px] uppercase mb-6"
            style={{
              letterSpacing: "0.35em",
              color: accentColor,
              fontFamily: bodyFamily,
            }}
          >
            Contact
          </p>
          <div className="flex flex-col">
            {emailPublic && (
              <ContactLink
                href={`mailto:${emailPublic}`}
                label="Email"
                value={emailPublic}
                accentColor={accentColor}
                headingFamily={headingFamily}
                ruleColor={ruleColor}
                mutedColor={mutedColor}
              />
            )}
            {instagramHandle && (
              <ContactLink
                href={`https://instagram.com/${instagramHandle}`}
                label="Instagram"
                value={`@${instagramHandle}`}
                accentColor={accentColor}
                headingFamily={headingFamily}
                ruleColor={ruleColor}
                mutedColor={mutedColor}
              />
            )}
            {websiteUrl && (
              <ContactLink
                href={
                  websiteUrl.startsWith("http")
                    ? websiteUrl
                    : `https://${websiteUrl}`
                }
                label="Website"
                value={websiteUrl.replace(/^https?:\/\//, "")}
                accentColor={accentColor}
                headingFamily={headingFamily}
                ruleColor={ruleColor}
                mutedColor={mutedColor}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ContactLink({
  href,
  label,
  value,
  accentColor,
  headingFamily,
  ruleColor,
  mutedColor,
}: {
  href: string;
  label: string;
  value: string;
  accentColor: string;
  headingFamily: string;
  ruleColor: string;
  mutedColor: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 py-4 transition-[gap] duration-200 hover:gap-6"
      style={{
        borderTop: `1px solid ${ruleColor}`,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        className="text-[9px] uppercase min-w-[80px]"
        style={{
          letterSpacing: "0.25em",
          color: mutedColor,
        }}
      >
        {label}
      </span>
      <span
        className="text-[18px] italic"
        style={{ fontFamily: headingFamily }}
      >
        {value}
      </span>
      <span
        className="ml-auto text-[16px] group-hover:translate-x-1 transition-transform duration-200"
        style={{ color: accentColor }}
      >
        &rarr;
      </span>
    </a>
  );
}
