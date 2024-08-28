/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { appCacheDir, join } from "@tauri-apps/api/path";
import { Store } from "@tauri-apps/plugin-store";
import { z } from "zod";

export const settingsStore = new Store("settings");

export interface Settings {
  theme: "light" | "dark";
  server: {
    hostname: string;
    downloadPath?: string;
  };
  discordRpc: boolean;
}
type Validator<T> = (value: unknown) => T;
export type SettingsInfo<T> = {
  [K in keyof T]: {
    name: string;
    description?: string;
    value?: T[K] extends Record<string, unknown> ? SettingsInfo<T[K]> : T[K];
    defaultValue?: T[K];

    validator?: Validator<T[K]>;
  };
};

const settingsInfo: SettingsInfo<Settings> = {
  theme: {
    name: "Theme",
    description: "Theme",
  },
  discordRpc: {
    name: "Discord Rich Presence",
    description: "Discord RPC",
    defaultValue: true,
    validator: (v) => z.boolean().parse(v),
  },
  server: {
    name: "Server Settings",
    description: "Server settings",
    value: {
      hostname: {
        name: "Hostname",
        description: "The hostname for the rqbit (torrent) server to run",
        defaultValue: "127.0.0.1:9012",
        validator: (v) => z.string().ip().parse(v),
      },
      downloadPath: {
        name: "Download Path",
        description: "The path to download torrents to",
        // TODO: add path regex
      },
    },
  },
};

export const defaultSettings = async () =>
  ({
    theme: "dark",
    server: {
      hostname: settingsInfo.server.value!.hostname.defaultValue!,
      downloadPath: await join(await appCacheDir(), "torrents"), // WARNING: this is probably super slow
    },

    discordRpc: true,
  }) as Settings;

export const getSettings = () =>
  settingsStore.get("settings") as Promise<Settings>;

export const setSettings = async (settings: Settings) =>
  await settingsStore.set("settings", {
    ...(await defaultSettings()),
    ...settings,
  });
