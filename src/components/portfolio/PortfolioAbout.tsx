interface PortfolioAboutProps {
  displayName: string;
  bio: string | null;
  emailPublic: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  accentColor: string;
}

export function PortfolioAbout({
  displayName,
  bio,
  emailPublic,
  instagramHandle,
  websiteUrl,
  accentColor,
}: PortfolioAboutProps) {
  const hasContact = emailPublic || instagramHandle || websiteUrl;

  if (!bio && !hasContact) return null;

  return (
    <section className="px-6 md:px-12 py-16 md:py-24">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {/* About text */}
        <div>
          <h2 className="font-heading text-[36px] font-light italic mb-6">
            About
          </h2>
          {bio && (
            <p className="font-heading text-[17px] italic opacity-70 leading-[1.8]">
              {bio}
            </p>
          )}
        </div>

        {/* Contact links */}
        {hasContact && (
          <div className="flex flex-col gap-5 md:mt-14">
            {emailPublic && (
              <ContactLink
                href={`mailto:${emailPublic}`}
                label="Email"
                value={emailPublic}
                accentColor={accentColor}
              />
            )}
            {instagramHandle && (
              <ContactLink
                href={`https://instagram.com/${instagramHandle}`}
                label="Instagram"
                value={`@${instagramHandle}`}
                accentColor={accentColor}
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
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactLink({
  href,
  label,
  value,
  accentColor,
}: {
  href: string;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between py-3 border-t transition-colors"
      style={{ borderColor: "currentColor", opacity: 0.15 }}
    >
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-1"
          style={{ color: accentColor }}
        >
          {label}
        </p>
        <p className="font-heading text-[15px] italic opacity-80 group-hover:opacity-100 transition-opacity">
          {value}
        </p>
      </div>
      <span className="opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all">
        &rarr;
      </span>
    </a>
  );
}
