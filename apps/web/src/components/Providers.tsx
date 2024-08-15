"use client";

import { ApolloProvider, client } from "@korino/anilist";

import { TRPCReactProvider } from "~/trpc/react";

export const APIProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloProvider client={client}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </ApolloProvider>
  );
};
