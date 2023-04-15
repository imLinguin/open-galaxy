import { ipcRenderer } from "electron";

declare global {
  interface Window {
    galaxyInitData: any;
    sendToClient: (message: string) => void;
    sendToOverlay: (message: string) => void;
    registerCallbackWithNative: (callback: () => any) => boolean;
  }
}

window.galaxyInitData = ipcRenderer.sendSync("galaxyInitData");

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
