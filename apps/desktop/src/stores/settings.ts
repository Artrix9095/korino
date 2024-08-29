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

/**
 * Returns the default settings for the app, overriding the download path if
 * given.
 *
 * @param {string} [downloadPath] - The download path to use instead of the
 * default.
 * @returns {Settings} - The default settings, with the given download path.
 */
export const defaultSettings = (downloadPath?: string) =>
  ({
    theme: "dark",
    server: {
      hostname: settingsInfo.server.value!.hostname.defaultValue!,
      downloadPath: downloadPath ?? "", // WARNING: this is probably super slow
    },

    discordRpc: true,
  }) as Settings;

/**
 * Fetches the current settings from storage. If no settings are found,
 * it will initialize the settings with the default values and store
 * them in storage.
 *
 * @returns The current settings.
 */
export const getSettings = async () => {
  let settings: Settings | null = await settingsStore.get("settings");
  // Happens on first run
  if (!settings) {
    settings = defaultSettings();
    await setSettings(settings, false);
  }

  return settings;
};

/**
 * Sets the settings. If `fetchOld` is true, it will first fetch the current settings
 * and merge them with the provided settings. If `fetchOld` is false, it will simply
 * overwrite the current settings with the provided ones.
 * @param settings The settings to set.
 * @param fetchOld Whether to fetch the current settings or not. Defaults to true.
 */
export const setSettings = async (settings: Settings, fetchOld = true) =>
  await settingsStore.set("settings", {
    // Prevents recursion
    ...(fetchOld ? await getSettings() : {}),
    ...settings,
  });
