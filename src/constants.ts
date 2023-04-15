import { app } from "electron";
import path from "node:path";

export const GOGDL_PATH = path.join(
  __dirname,
  "..",
  "bin",
  process.platform,
  "gogdl"
);
export const CONFIG_PATH = app.getPath("userData");
export const AUTH_CONFIG_PATH = path.join(app.getPath("userData"), "auth.json");

export const LANGUAGES = [
  "en-US",
  "de-DE",
  "fr-FR",
  "ru-RU",
  "pl-PL",
  "zh-Hans",
  "es-ES",
  "es-MX",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "pt-BR",
  "pt-PT",
  "zh-Hant",
];

export const FETCH_URIS = {
  news: "https://api.gog.com/news",
  scoreboards: "https://gameplay.gog.com/users/{{userId}}/period/{{period}}/scoreboards"
}
