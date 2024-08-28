import React, { StrictMode } from "react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "~/routeTree.gen";
import { TRPCProvider } from "~/trpc";

import "../node_modules/@korino/ui/styles/globals.css"; // Hack for now

import { Command } from "@tauri-apps/plugin-shell";

import { ApolloProvider, client } from "@korino/anilist";
import { createChild } from "@korino/logger";
import { ThemeProvider } from "@korino/ui/theme";

const logger = createChild("rqbit");

const rqbit = Command.sidecar("binaries/rqbit", [
  "--http-api-listen-addr",
  "127.0.0.1:9012",
  "server",
  "start",
  "~/.rqbit/store",
]);

rqbit.on("close", () => logger.warn("Closed"));

rqbit.on("error", logger.error);

rqbit.stdout.on("data", logger.info);
rqbit.stderr.on("data", logger.error);

void rqbit.spawn().then((e) => logger.info("Rqbit Initialized"));
// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  Wrap({ children }) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ApolloProvider client={client}>
          <TRPCProvider>{children}</TRPCProvider>
        </ApolloProvider>
      </ThemeProvider>
    );
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root not in body");

if (!rootElement.innerHTML) {
  logger.info("Hi");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
