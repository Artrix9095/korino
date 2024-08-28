import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { getSettings } from "~/stores/settings";

export const updateRPC = async (status: unknown) => {
  const settings = await getSettings();
  if (settings.discordRpc) await invoke("update_presence", { status });
};

export const initRPC = async () => {
  await invoke("init_presence");
};

export const initRPCSync = (): Promise<boolean> =>
  // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
  new Promise(async (res) => {
    const settings = await getSettings();
    if (settings.discordRpc) {
      await listen("rpc://ready", () => res(true));
      await initRPC();
    } else res(false);
  });
