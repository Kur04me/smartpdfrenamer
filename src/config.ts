import fs from "fs";
import path from "path";
import { defaultConfig } from "./default";
import merge from "deepmerge";

const settingFileName = "config.json";
const settingFilePath = path.join(__dirname, "..", settingFileName);

const loadedConfig = (() => {
  if (fs.existsSync(settingFilePath)) {
    try {
      const config = JSON.parse(fs.readFileSync(settingFilePath, "utf-8"));
      return merge(defaultConfig, config); // deepmergeのdefaultで配列は連結されます
    } catch (error) {
      console.error("設定ファイルの読み込みに失敗しました:", error);
      return defaultConfig;
    }
  }
  return defaultConfig;
})();

export const config = loadedConfig;