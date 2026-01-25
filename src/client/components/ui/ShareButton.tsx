"use client";

import { Share, Check, Copy, Facebook } from "lucide-react";
import { Button } from "@/client/components/ui/Button";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/client/lib/utils";

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setOpen(false);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url,
                });
                setOpen(false);
            } catch (err) {
                console.log("Error sharing:", err);
            }
        } else {
            handleCopy();
        }
    };

    const shareToSocial = (platform: "facebook") => {
        const encodedUrl = encodeURIComponent(url);
        if (platform === "facebook") {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                onClick={() => setOpen(!open)}
            >
                <Share className="h-4 w-4" />
                <span className="sr-only">Chia sẻ</span>
            </Button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
                    <button
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        onClick={handleNativeShare}
                    >
                        <Share className="mr-2 h-4 w-4" />
                        {copied ? "Đã sao chép!" : "Chia sẻ ngay"}
                    </button>
                    <button
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        Sao chép liên kết
                    </button>
                    <div className="my-1 h-px bg-muted" />
                    <button
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        onClick={() => shareToSocial("facebook")}
                    >
                        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                        Facebook
                    </button>
                </div>
            )}
        </div>
    );
}
