// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/settings(.*)",
  // "/navigation(.*)",
  "/payment(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)/", "/(api|trpc)(.*)"],
};
