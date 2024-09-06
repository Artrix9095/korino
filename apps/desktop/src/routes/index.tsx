import { createFileRoute } from "@tanstack/react-router";

import "@vidstack/react/player/styles/base.css";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

import { DefaultPlayer, VideoLayout } from "@korino/media-player";

import { usePaths, useSettings } from "~/hooks/tauri";
import {
  useMutateTorrent,
  useTorrentPlaylist,
  useTorrentServer,
  useTorrentStart,
} from "~/hooks/torrent";

interface TorrentMedia {
  src: string;
  mimetype: string;
}

interface TorrentPlaylist {
  media: TorrentMedia[];
  title: string;
  description?: string;
}

const TORRENT_URL = "https://nyaa.si/download/1869762.torrent";

const TorrentPlayer = () => {
  const { data: settings } = useSettings();
  const { isSuccess: serverOn } = useTorrentServer(
    settings?.server.hostname,
    settings?.server.downloadPath,
  );

  const { data: playlist } = useQuery<TorrentPlaylist[]>({
    queryKey: ["playlist", TORRENT_URL],
    enabled: serverOn && !!settings,

    queryFn: () =>
      fetch(
        `korino://localhost/torrent?host=${settings?.server.hostname}&torrent=${TORRENT_URL}`,
      ).then((r) => r.json()),
    staleTime: Infinity,
  });
  return (
    <>
      <main>
        {playlist ? (
          <DefaultPlayer
          
            src={playlist.flatMap((p) =>
              p.media.map((m) => ({
                src: m.src,
                type: "video/webm",
              })),
            )}
          >
            <VideoLayout />
          </DefaultPlayer>
        ) : null}
      </main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <TorrentPlayer />,
});
