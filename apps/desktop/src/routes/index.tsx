import { createFileRoute } from "@tanstack/react-router";

import "@vidstack/react/player/styles/base.css";

import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

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
  useEffect(() => {
    if (settings) {
      invoke("start_rqbit", {
        host: settings.server.hostname,
        out_dir: settings.server.downloadPath,
      });
      console.log("started", settings);
    }
  }, [settings]);

  return (
    <>
      <main>
        {/* {playlist && (
          <DefaultPlayer
            src={playlist.map((url) => ({
              src: url,
              type: "video/mpeg",
            }))}
            controls
          >
            <VideoLayout />
          </DefaultPlayer>
        )} */}
      </main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <TorrentPlayer />,
});
