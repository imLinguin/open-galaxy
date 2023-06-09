import axios from "axios";
import { GOGCredential } from "../types";
import { runGogdlCommand } from "../utils/gogdl";
import { session } from "electron";
import windows from "../windows";

const getCredentials = async (): Promise<GOGCredential | null> => {
  const { stdout, stderr, exitcode } = await runGogdlCommand(["auth"]);
  if (exitcode !== 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(stdout.trim());
    if (!parsed?.access_token) return null;
    session.defaultSession.webRequest.onBeforeSendHeaders(
      {
        urls: ["https://*.gog.com/*"],
      },
      (details, callback) => {
        details.requestHeaders[
          "Authorization"
        ] = `Bearer ${parsed.access_token}`;
        callback({ requestHeaders: details.requestHeaders });
      }
    );

    axios.defaults.headers.common.Authorization = `Bearer ${parsed.access_token}`;
    return parsed;
  } catch {
    console.error("Failed to parse credentials output");
    return null;
  }
};

const finishLogin = async (code: string): Promise<void> => {
  const loginWindow = windows.get("login");
  if (loginWindow)
    loginWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "AuthenticationStateChanged",
        Arguments: { authenticationState: "completed" },
      })
    );

  const { stdout, stderr, exitcode } = await runGogdlCommand([
    "auth",
    "--code",
    code,
  ]);
  if (exitcode === 0) {
    console.log("Login success");

    const parsed: GOGCredential = JSON.parse(stdout.trim());

    axios.defaults.headers.common.Authorization = `Bearer ${parsed.access_token}`;
  }
};

export default { getCredentials, finishLogin };
