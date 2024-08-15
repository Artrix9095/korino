
import {  HydrateClient } from "~/trpc/server";


// export const runtime = "edge"; For some reason this doesn't work on my machine.

export default function HomePage() {
  // You can await this here if you don't want to show Suspense fallback below
  

  return (
    <HydrateClient>
      
    </HydrateClient>
  );
}
