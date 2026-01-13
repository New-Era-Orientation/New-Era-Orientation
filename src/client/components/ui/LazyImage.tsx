"use client";

import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/client/lib/utils";

interface LazyImageProps extends Omit<ImageProps, "onLoad"> {
    fallback?: string;
    blurDataURL?: string;
}

export function LazyImage({
    src,
    alt,
    className,
    fallback = "/images/placeholder.png",
    blurDataURL,
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Skeleton while loading */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            
            <Image
                ref={imgRef}
                src={error ? fallback : src}
                alt={alt}
                className={cn(
                    "transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => setError(true)}
                placeholder={blurDataURL ? "blur" : "empty"}
                blurDataURL={blurDataURL}
                loading="lazy"
                {...props}
            />
        </div>
    );
}

// Native img with intersection observer
interface NativeLazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    placeholderSrc?: string;
    threshold?: number;
}

export function NativeLazyImage({
    src,
    alt,
    className,
    placeholderSrc,
    threshold = 0.1,
    ...props
}: NativeLazyImageProps) {
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin: "50px" }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {!isLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
                ref={imgRef}
                src={isInView ? src : placeholderSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                alt={alt}
                className={cn(
                    "transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
                {...props}
            />
        </div>
    );
}

// Optimized avatar component
export function Avatar({
    src,
    alt,
    fallback,
    size = "md",
    className,
}: {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}) {
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
    };

    const getFallbackText = () => {
        if (fallback) return fallback;
        if (alt) {
            return alt
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return "?";
    };

    if (!src || error) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-primary-foreground font-semibold",
                    sizeClasses[size],
                    className
                )}
                aria-label={alt}
            >
                {getFallbackText()}
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt || "Avatar"}
            width={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 40 : 32}
            height={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 40 : 32}
            className={cn("rounded-full object-cover", sizeClasses[size], className)}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
}

// Skeleton loader for images
export function ImageSkeleton({ 
    className,
    aspectRatio = "square",
}: { 
    className?: string;
    aspectRatio?: "square" | "video" | "portrait" | "wide";
}) {
    const aspectClasses = {
        square: "aspect-square",
        video: "aspect-video",
        portrait: "aspect-[3/4]",
        wide: "aspect-[21/9]",
    };

    return (
        <div
            className={cn(
                "bg-muted animate-pulse rounded-lg",
                aspectClasses[aspectRatio],
                className
            )}
        />
    );
}
