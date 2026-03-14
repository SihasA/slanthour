interface PortfolioBannerProps {
  bannerUrl: string;
  title: string;
  subtitle: string | null;
}

export function PortfolioBanner({
  bannerUrl,
  title,
  subtitle,
}: PortfolioBannerProps) {
  return (
    <section
      data-banner
      className="portfolio-banner"
      style={{
        position: "relative",
        width: "100%",
        height: "70vh",
        minHeight: 400,
        maxHeight: 700,
        overflow: "hidden",
        background: "#1a1917",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 40%",
          display: "block",
        }}
        draggable={false}
      />

      {/* Gradient overlay — exact legacy gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Text */}
      <div
        className="portfolio-banner-text"
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
          right: 48,
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(48px, 8vw, 88px)",
            fontWeight: 300,
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: 16,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 420,
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
