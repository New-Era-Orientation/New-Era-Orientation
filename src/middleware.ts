import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    // For now, allow all requests
    // Auth middleware will be enabled after Auth.js is fully configured
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/study/:path*",
        "/exam/:path*",
        "/simulation/:path*",
        "/profile/:path*",
        "/settings/:path*",
    ],
};
