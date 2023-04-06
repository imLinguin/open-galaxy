import { ipcRenderer } from "electron";

declare global {
  interface Window {
    loginInitData: any;
    sendToClient: (message: string) => void;
    sendToOverlay: (message: string) => void;
    registerCallbackWithNative: (callback: () => any) => boolean;
  }
}

window.loginInitData = {
  os: "windows",
  loggingLevel: 8,
  loginType: "login",
  clientId: "46899977096215655",
  campaignParamsForLogin: "",
  brandedGame: null,
  endpoints: {
    Gog: "https://embed.gog.com",
    Chat: "https://chat.gog.com",
    Auth: "https://auth.gog.com",
  },
  settingsData: { lanuageCode: "en-US" },
};

window.sendToClient = (message: string) => {
  ipcRenderer.send("sendToClient", message);
};

window.sendToOverlay = (message: string) => {
  console.log("overlay", message);
};

window.registerCallbackWithNative = (callback: (message: string) => any) => {
  ipcRenderer.on("callback", (_, data) => {
    callback(data);
  });
  return true;
};
