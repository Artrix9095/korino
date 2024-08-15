import { Auth } from "@auth/core";
import { eventHandler, toWebRequest } from "h3";

import { AnilistProvider } from "@korino/auth";

const authId = process.env.AUTH_ANILIST_ID;
const authSecret = process.env.AUTH_ANILIST_SECRET;

if (!authId || !authSecret) {
  throw new Error("Missing AniList credentials");
}

export default eventHandler(async (event) =>
  Auth(toWebRequest(event), {
    basePath: "/r",
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [AnilistProvider(authId, authSecret)],
  }),
);
