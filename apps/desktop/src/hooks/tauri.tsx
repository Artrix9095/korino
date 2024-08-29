import { useQuery } from "@tanstack/react-query";
import {
  appCacheDir as _appCacheDir,
  appDataDir as _appDataDir,
  appLogDir as _appLogDir,
  homeDir as _homeDir,
  tempDir as _tempDir,
} from "@tauri-apps/api/path";

import type { Settings } from "~/stores/settings";
import { getSettings, setSettings } from "~/stores/settings";

export const usePaths = () =>
  useQuery({
    staleTime: Infinity,
    queryKey: ["paths"],
    queryFn: async () => {
      const [appCacheDir, appDataDir, tempDir, homeDir, appLogDir] =
        await Promise.all([
          _appCacheDir(),
          _appDataDir(),
          _tempDir(),
          _homeDir(),
          _appLogDir(),
        ]);
      return { appCacheDir, appDataDir, tempDir, homeDir, appLogDir };
    },
  });

export const useSetting = <T extends keyof Settings>(setting: T) =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings[T]> => (await getSettings())[setting],
  });

export const useSettings = () =>
  useQuery({
    staleTime: Infinity,
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings> => await getSettings(),
  });

export const useMutateSetting = <T extends keyof Settings>(
  setting: T,
  value: Settings[T],
) =>
  useQuery({
    queryKey: ["settings", setting],
    queryFn: async () => {
      const settings = await getSettings();
      settings[setting] = value;
      await setSettings(settings);
    },
  });

export const useMutateSettings = (settings: Settings) =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      await setSettings(settings);
    },
  });
