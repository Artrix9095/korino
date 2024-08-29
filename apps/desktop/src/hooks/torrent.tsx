import { useQuery } from "@tanstack/react-query";
import { Command } from "@tauri-apps/plugin-shell";

import { createChild } from "@korino/logger";

const logger = createChild("Torrents");

export const useTorrents = (hostname?: string) =>
  useQuery({
    queryKey: ["torrents"],
    enabled: !!hostname,
    queryFn: () => fetch(`http://${hostname}/torrents`).then((r) => r.json()),
  });

export const useTorrent = (id: string, hostname?: string) =>
  useQuery({
    queryKey: ["torrents", id],
    enabled: !!hostname,
    queryFn: () =>
      fetch(`http://${hostname}/torrents/${id}`).then((r) => r.json()),
    // .then((r) => r.json()),
  });

export const useMutateTorrent = (
  url: string,
  hostname?: string,
  enabled = true,
) =>
  useQuery<{ id: number }>({
    queryKey: ["torrents"],
    enabled: !!hostname && enabled,

    queryFn: () =>
      fetch(`http://${hostname}/torrents`, {
        method: "POST",
        body: url,
      }).then(async (r) => {
        const json = await r.json();
        // Duplicate torrent
        if (r.status === 409) {
          logger.warn("Duplicate torrent");
          console.log(json);
          const match = json.human_readable.match(/id=(\d+)/);
          const id = match ? parseInt(match[1], 10) : undefined;
          return { id: id };
        }
        return r;
      }),
  });
export const serverCheck = (hostname?: string) =>
  fetch(`http://${hostname}/`)
    .then((r) => r.status === 200)
    .catch(() => false);

export const useTorrentStart = (hostname?: string, downloadPath?: string) =>
  useQuery({
    queryKey: ["torrent-start"],
    enabled: !!hostname && !!downloadPath,
    queryFn: async (): Promise<
      // We love typescript
      [Awaited<ReturnType<Command<string>["spawn"]>> | null, string]
    > => {
      if (hostname && (await serverCheck(hostname))) {
        logger.warn("Rqbit already running");
        return [null, hostname];
      }

      const rqbit = Command.sidecar("binaries/rqbit", [
        "--http-api-listen-addr",
        `${hostname}`,
        "server",
        "start",
        `${downloadPath}`,
      ]);

      rqbit.on("close", () => logger.warn("Closed"));

      rqbit.on("error", logger.error);

      rqbit.stdout.on("data", logger.info);
      rqbit.stderr.on("data", logger.error);
      logger.info("Starting Rqbit...");
      return [
        await rqbit.spawn().then((r) => {
          logger.info("Rqbit Initialized");
          return r;
        }),
        `${hostname}`,
      ];
    },
  });

export const useTorrentPlaylist = (id?: string, hostname?: string) =>
  useQuery({
    queryKey: ["stream", id],
    enabled: !!hostname && !!id,
    queryFn: () =>
      fetch(`http://${hostname}/torrents/${id}/playlist`).then((r) => r.text()),
  });
