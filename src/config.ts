import { Config } from "./types/index";
import fs from "fs";
import path from "path";
import { defaultConfig } from "./default";
import merge from "deepmerge";

const settingFileName = "config.json";
const settingFilePath = path.join(__dirname, "..", settingFileName);

// 設定ファイルが存在する場合は読み込み、存在しない場合はデフォルト設定を使用
const loadedConfig: Config = (() => {
  if (fs.existsSync(settingFilePath)) {
    try {
      const config = JSON.parse(fs.readFileSync(settingFilePath, "utf-8"));
      return merge(defaultConfig, config) as Config; // deepmergeのdefaultで配列は連結されます
    } catch (error) {
      console.error("設定ファイルの読み込みに失敗しました:", error);
      return defaultConfig;
    }
  }
  return defaultConfig;
})();
const config = loadedConfig;
export default config;
