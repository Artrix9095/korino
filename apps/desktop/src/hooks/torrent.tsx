import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
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

export const useTorrentServer = (hostname?: string, downloadPath?: string) =>
  useQuery({
    queryKey: ["server-start"],
    enabled: !!hostname,
    staleTime: Infinity,
    /**
     *
     * @returns {Promise<boolean>} true if server started, false if the server was already running
     */
    queryFn: (): Promise<boolean> =>
      invoke("start_rqbit", {
        host: hostname,
        out_dir: downloadPath,
      }),
  });

export const useTorrentPlaylist = (id?: string, hostname?: string) =>
  useQuery({
    queryKey: ["stream", id],
    enabled: !!hostname && !!id,
    queryFn: () =>
      fetch(`http://${hostname}/torrents/${id}/playlist`)
        .then((r) => r.text())
        .then((t) =>
          t
            .replace("#EXTM3U\n", "")
            .split("\n")
            .filter((l) => l.startsWith("http")),
        ),
  });
