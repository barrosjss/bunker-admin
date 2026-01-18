"use client";

import { HTMLAttributes, forwardRef, useState } from "react";
import { cn, getInitials } from "@/lib/utils/formatting";
import Image from "next/image";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = "md", ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    };

    const imageSizes = {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
    };

    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : "?";

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium overflow-hidden",
          sizes[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          <Image
            src={src}
            alt={alt || name || "Avatar"}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
