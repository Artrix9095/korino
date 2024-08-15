import type { DefaultOptions, NormalizedCacheObject } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "ignore",
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
};

const client = new ApolloClient<NormalizedCacheObject>({
  uri: "https://graphql.anilist.co",
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions,
});

export { client };
export { useQuery as useAnilist, ApolloProvider } from "@apollo/client";
