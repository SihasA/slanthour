interface PortfolioBannerProps {
  bannerUrl: string;
  title: string;
  subtitle: string | null;
  headingFamily: string;
}

export function PortfolioBanner({
  bannerUrl,
  title,
  subtitle,
  headingFamily,
}: PortfolioBannerProps) {
  return (
    <section data-banner className="relative h-[70vh] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-10 md:pb-14">
        <h1
          className="font-light italic leading-[0.95] tracking-tight mb-3"
          style={{
            fontFamily: headingFamily,
            fontSize: "clamp(48px, 8vw, 88px)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[17px] italic opacity-70 leading-relaxed max-w-[500px]"
            style={{ fontFamily: headingFamily }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
