import { lazy, Suspense } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";

import { initRPC } from "~/util/discordrpc";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );
const TanStackQueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import("@tanstack/react-query-devtools").then((res) => ({
          default: res.ReactQueryDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

export const Route = createRootRoute({
  component: () => {
    initRPC()
      .then(() => console.log("Init RPC"))
      .catch(console.error);
    return (
      <>
        <Outlet />
        <Suspense>
          <TanStackRouterDevtools />
          <TanStackQueryDevtools />
        </Suspense>
      </>
    );
  },
});
