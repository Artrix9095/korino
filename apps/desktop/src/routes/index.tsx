import { createFileRoute } from "@tanstack/react-router";

import "@vidstack/react/player/styles/base.css";

import { DefaultPlayer, VideoLayout } from "@korino/media-player";

import { usePaths, useSettings } from "~/hooks/tauri";
import {
  useMutateTorrent,
  useTorrentPlaylist,
  useTorrentStart,
} from "~/hooks/torrent";

const TORRENT_URL = "https://nyaa.si/download/1866381.torrent";

const TorrentPlayer = () => {
  const { data: settings } = useSettings();
  const { data: paths } = usePaths();
  const hostname = settings?.server.hostname;
  const downloadPath = settings?.server.downloadPath || paths?.appCacheDir;

  const { isSuccess } = useTorrentStart(hostname, downloadPath);
  console.log(hostname, downloadPath);
  const { data: torrent } = useMutateTorrent(TORRENT_URL, hostname, isSuccess);
  const torrentId: number | null = torrent?.id ?? null;

  const { data: playlist } = useTorrentPlaylist(
    torrentId ? torrentId.toString() : undefined,
    hostname,
  );

  return (
    <>
      <main>
        {playlist && (
          <DefaultPlayer
            src={playlist.map((url) => ({
              src: url,
              type: "video/mpeg",
            }))}
            controls
          >
            <VideoLayout />
          </DefaultPlayer>
        )}
      </main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <TorrentPlayer />,
});
