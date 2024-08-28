import { Store } from "@tauri-apps/plugin-store";
import { z } from "zod";

export const settingsStore = new Store("settings");

export interface Settings {
  theme: "light" | "dark";
  server: {
    port: number;
  };
  discordRpc: boolean;
}
type Validator<T> = (value: any) => T;
export type SettingsInfo<T> = {
  [K in keyof T]: {
    name: string;
    description?: string;
    value?: T[K] extends Record<string, any> ? SettingsInfo<T[K]> : T[K];
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
      port: {
        name: "port",
        description: "Port",
        defaultValue: 9012,
        validator: (v) => z.number().min(0).max(65535).parse(v),
      },
    },
  },
};

export const defaultSettings = (): Settings => ({
  theme: "dark",
  server: {
    port: settingsInfo.server.value?.port.defaultValue || 9012,
  },
  discordRpc: true,
});

export const getSettings = () =>
  settingsStore.get("settings") as Promise<Settings>;

export const setSettings = (settings: Settings) =>
  settingsStore.set("settings", { ...defaultSettings(), ...settings });
