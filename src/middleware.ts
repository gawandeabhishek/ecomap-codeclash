// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/navigation(.*)"]);

const isProtectedRoute = createRouteMatcher(["/settings(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;

  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Exclude files with a dot (e.g., favicon.ico)
    "/((?!.+.[w]+$|_next).*)/",
    // Exclude API routes
    "/(api|trpc)(.*)",
  ],
};
