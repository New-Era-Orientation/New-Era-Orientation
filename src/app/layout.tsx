import type { Metadata, Viewport } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/client/contexts/ThemeContext";
import { SessionProvider } from "@/client/contexts/SessionProvider";
import { UserProvider } from "@/client/contexts/UserContext";
import { PWARegistration } from "@/client/components/pwa/PWARegistration";
import { MobileBottomNav } from "@/client/components/layout/MobileBottomNav";

const openSans = Open_Sans({
    subsets: ["latin", "vietnamese"],
    variable: "--font-sans",
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const poppins = Poppins({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
        { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
    ],
};

export const metadata: Metadata = {
    title: {
        default: "NEO Edu - Nền tảng học tập thông minh",
        template: "%s | NEO Edu",
    },
    description: "Hệ thống học tập và luyện thi trực tuyến thông minh với AI",
    keywords: ["học tập", "luyện thi", "trắc nghiệm", "AI", "giáo dục"],
    authors: [{ name: "NEO Edu Team" }],
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "NEO-EDU",
    },
    openGraph: {
        type: "website",
        locale: "vi_VN",
        siteName: "NEO Edu",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </head>
            <body className={`${openSans.variable} ${poppins.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
                <SessionProvider>
                    <ThemeProvider>
                        <UserProvider>
                            <div className="pb-16 md:pb-0">
                                {children}
                            </div>
                            <MobileBottomNav />
                            <PWARegistration />
                        </UserProvider>
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
