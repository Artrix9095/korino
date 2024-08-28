import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const Home = () => {
  const [video, setVideo] = useState("");
  useEffect(() => {
    void invoke("init_presence").then(() => {
      return invoke("update_presence", {
        status: { state: "Korino", details: "Test" },
      }).then(() => {
        console.log("updated presence");
      });
    });

    void listen("rpc://ready", () => {
      console.log("rpc ready");
    });
    // void fetch("http://localhost:9012/torrents", {
    //   body: "https://nyaa.si/download/1863828.torrent",
    //   method: "POST",
    // })
    //   .then((r) => r.json())
    //   .then(() => setVideo("http://localhost:9012/torrents/1/playlist"));

    void fetch("http://localhost:9012/torrents/1/playlist")
      .then((r) => r.text())
      .then((t) => setVideo(t));
  }, []);

  return (
    <>
      <main>{video && <video src={video} controls />}</main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <Home />,
});
