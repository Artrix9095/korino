import { createFileRoute } from "@tanstack/react-router";

import { usePaths, useSettings } from "~/hooks/tauri";
import {
  useMutateTorrent,
  useTorrentPlaylist,
  useTorrentStart,
} from "~/hooks/torrent";

const TORRENT_URL = "https://nyaa.si/download/1865232.torrent";

const TorrentPlayer = () => {
  const { data: settings } = useSettings();
  const { data: paths } = usePaths();
  const hostname = settings?.server.hostname;
  const downloadPath = settings?.server.downloadPath || paths?.appCacheDir;

  const { isSuccess } = useTorrentStart(hostname, downloadPath);
  console.log(hostname, downloadPath);
  const { data: torrent } = useMutateTorrent(TORRENT_URL, hostname, isSuccess);
  const torrentId = String(torrent?.id);

  const { data: videoUrl } = useTorrentPlaylist(
    torrent !== undefined ? torrentId : undefined,
    hostname,
  );
  return (
    <>
      <main>{videoUrl && <video src={videoUrl} controls />}</main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <TorrentPlayer />,
});
