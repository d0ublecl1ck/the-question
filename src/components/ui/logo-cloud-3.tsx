import * as React from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

type Logo = {
  alt: string;
  href?: string;
  node?: React.ReactNode;
  src?: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  const repeatedLogos = Array.from({ length: 12 }).flatMap(() => logos)

  return (
    <div {...props} className={cn("overflow-hidden py-6", className)}>
      <InfiniteSlider
        gap={60}
        reverse
        duration={800}
        durationOnHover={1200}
        className="min-w-full items-center"
      >
        {repeatedLogos.map((logo, index) => (
          <a
            key={`logo-${logo.alt}-${index}`}
            href={logo.href}
            target={logo.href ? "_blank" : undefined}
            rel={logo.href ? "noreferrer" : undefined}
            className="logo-cloud-item inline-flex items-center whitespace-nowrap"
            aria-label={logo.alt}
          >
            {logo.node ? (
              <span className="pointer-events-none flex h-10 items-center select-none sm:h-12 md:h-14">
                {logo.node}
              </span>
            ) : (
              <img
                alt={logo.alt}
                className="pointer-events-none h-10 w-auto select-none dark:brightness-0 dark:invert sm:h-12 md:h-14"
                height={logo.height || 56}
                loading="lazy"
                src={logo.src}
                width={logo.width || "auto"}
              />
            )}
          </a>
        ))}
      </InfiniteSlider>
    </div>
  );
}
