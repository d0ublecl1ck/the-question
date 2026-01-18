import * as React from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
  href?: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  const repeatedLogos = Array.from({ length: 12 }).flatMap(() => logos)

  return (
    <div
      {...props}
      className={cn("overflow-hidden py-4", className)}
    >
      <InfiniteSlider gap={80} reverse duration={800} durationOnHover={1200}>
        {repeatedLogos.map((logo, index) => (
          <a
            key={`logo-${logo.alt}-${index}`}
            href={logo.href}
            target={logo.href ? "_blank" : undefined}
            rel={logo.href ? "noreferrer" : undefined}
            className="inline-flex items-center"
            aria-label={logo.alt}
          >
            <img
              alt={logo.alt}
              className="pointer-events-none h-4 select-none md:h-5 dark:brightness-0 dark:invert"
              height={logo.height || "auto"}
              loading="lazy"
              src={logo.src}
              width={logo.width || "auto"}
            />
          </a>
        ))}
      </InfiniteSlider>
    </div>
  );
}
