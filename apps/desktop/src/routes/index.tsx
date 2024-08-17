import { Suspense, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { AuthShowcase } from "~/components/auth-showcase";
import { CreatePostForm, PostCardSkeleton, PostList } from "~/components/posts";

const Home = () => {
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
  }, []);

  void invoke("start_torrent", {
    url: "https://nyaa.si/download/1860772.torrent",
    server_port: 1337,
  });
  void listen("torrent://start", console.log);
  return (
    <>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-primary">T3</span> Turbo
          </h1>
          <AuthShowcase />

          <CreatePostForm />
          <div className="w-full max-w-2xl overflow-y-scroll">
            <Suspense
              fallback={
                <div className="flex w-full flex-col gap-4">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </div>
              }
            >
              <PostList />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: () => <Home />,
});
