import { invoke } from "@tauri-apps/api/tauri";

export interface BalancesSettings {
  folder: string;
  peopleIds: string[];
}

export const getBalancesSettings = async (): Promise<BalancesSettings> => {
  return invoke("get_balances_settings");
};

export const setBalancesSettings = async (settings: BalancesSettings): Promise<void> => {
  await invoke("set_balances_settings", { payload: settings });
};

export const downloadBalances = async (): Promise<void> => {
  await invoke("download_balances");
};

export const listBalances = async (): Promise<string[]> => {
  return invoke("list_balances");
};