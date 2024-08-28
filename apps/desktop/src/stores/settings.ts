import { Store } from "@tauri-apps/plugin-store";
import { z } from "zod";

export const settingsStore = new Store("settings");

export interface Settings {
  theme: "light" | "dark";
  server: {
    port: number;
  };
}
type Validator = (value: any) => boolean;
export type SettingsInfo<T> = {
  [K in keyof T]: {
    name: K;
    description: string;
    value?: T[K] extends Record<string, any> ? SettingsInfo<T[K]> : T[K];
    defaultValue?: T[K];

    validator?: Validator;
  };
};

const settingsInfo: SettingsInfo<Settings> = {
  theme: {
    name: "theme",
    description: "Theme",
  },
  server: {
    name: "server",
    description: "Server settings",
    value: {
      port: {
        name: "port",
        description: "Port",
        defaultValue: 9012,
        validator: (value: any) =>
          z.number().min(0).max(65535).safeParse(value).success,
      },
    },
  },
};

export const defaultSettings = (): Settings => ({
  theme: "dark",
  server: {
    port: settingsInfo.server.value?.port.defaultValue || 9012,
  },
});

export const getSettings = () => settingsStore.get("settings");

export const setSettings = (settings: Settings) =>
  settingsStore.set("settings", { ...defaultSettings(), ...settings });
