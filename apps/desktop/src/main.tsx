import React, { StrictMode } from "react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "~/routeTree.gen";
import { TRPCProvider } from "~/trpc";

import "../node_modules/@korino/ui/styles/globals.css"; // Hack for now

import { ApolloProvider, client } from "@korino/anilist";
import { ThemeProvider } from "@korino/ui/theme";

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
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
