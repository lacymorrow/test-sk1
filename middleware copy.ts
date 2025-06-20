import { getAuthStrategy } from "@/lib/auth/auth-strategy";
import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { isStackAuthEnabled } from "@/server/auth-providers";
import { getStackServerApp } from "@/server/stack-auth.config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * ShipKit Middleware with Conditional Authentication Support
 *
 * This middleware will conditionally apply authentication middleware based on the
 * active authentication strategy. Currently, it's a passthrough implementation
 * that will be enhanced when Clerk UI components are implemented.
 *
 * TODO: Implement Clerk middleware integration in Phase 5
 */

/**
 * Next.js Middleware for Authentication
 *
 * This middleware handles authentication routing for both Stack Auth and Auth.js.
 * It routes requests to the appropriate authentication provider based on configuration.
 *
 * When Stack Auth is enabled:
 * - Uses Stack Auth middleware for authentication state management
 * - Handles Stack Auth-specific routing and session validation
 *
 * When Auth.js is used:
 * - Uses Auth.js middleware for authentication state management
 * - Handles traditional OAuth and credential-based authentication
 */

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for static assets, API routes that don't need auth, and Next.js internals
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/static") ||
		pathname.includes(".") ||
		pathname === "/favicon.ico"
	) {
		return NextResponse.next();
	}

	try {
			// Check the active authentication strategy
	const authStrategy = getAuthStrategy();

	// TODO: Implement Clerk middleware when UI components are ready
	// For now, pass through all requests
	// Future implementation will handle:
	// - Clerk route protection when authStrategy === "clerk"
	// - Auth.js session validation when authStrategy === "authjs"
	// - Guest mode access when authStrategy === "guest"


		// Use Stack Auth middleware if enabled and available
		if (isStackAuthEnabled) {
			const stackApp = getStackServerApp();
			if (stackApp) {
				return await handleStackAuthMiddleware(request, stackApp);
			}
		}

		// Fall back to Auth.js middleware
		return await handleAuthJSMiddleware(request);
	} catch (error) {
		logger.error("Middleware error:", error);
		return NextResponse.next();
	}
}

/**
 * Handle Stack Auth middleware logic
 */
async function handleStackAuthMiddleware(request: NextRequest, stackApp: any) {
	const { pathname } = request.nextUrl;

	try {
		// Get the current user from Stack Auth
		const user = await stackApp.getUser();

		// Define protected routes that require authentication
		const protectedRoutes = ["/dashboard", "/profile", "/settings"];
		const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

		// Define auth routes that should redirect authenticated users
		const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth/sign-out"];
		const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

		// Redirect authenticated users away from auth pages
		if (user && isAuthRoute) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		// Redirect unauthenticated users to sign in for protected routes
		if (!user && isProtectedRoute) {
			const signInUrl = new URL("/auth/sign-in", request.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signInUrl);
		}

		return NextResponse.next();
	} catch (error) {
		logger.error("Stack Auth middleware error:", error);
		// On error, continue to allow the request through
		return NextResponse.next();
	}
}

/**
 * Handle Auth.js middleware logic
 */
async function handleAuthJSMiddleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	try {
		// Get the current session from Auth.js
		const session = await auth();

		// Define protected routes that require authentication
		const protectedRoutes = ["/dashboard", "/profile", "/settings"];
		const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

		// Define auth routes that should redirect authenticated users
		const authRoutes = ["/auth/sign-in", "/auth/sign-up"];
		const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

		// Redirect authenticated users away from auth pages
		if (session?.user && isAuthRoute) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		// Redirect unauthenticated users to sign in for protected routes
		if (!session?.user && isProtectedRoute) {
			const signInUrl = new URL("/auth/sign-in", request.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signInUrl);
		}

		return NextResponse.next();
	} catch (error) {
		logger.error("Auth.js middleware error:", error);
		// On error, continue to allow the request through
		return NextResponse.next();
	}
}

export const config = {
	/*
	 * Match all request paths except for the ones starting with:
	 * - api (API routes)
	 * - _next/static (static files)
	 * - _next/image (image optimization files)
	 * - favicon.ico (favicon file)
	 * - public folder
	 */
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes that don't need auth middleware)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|public).*)",

				// Skip Next.js internals and all static files, unless found in search params
		// "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};
