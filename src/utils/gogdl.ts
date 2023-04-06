import { spawn } from "node:child_process";
import { AUTH_CONFIG_PATH, GOGDL_PATH } from "../constants";

export const runGogdlCommand = async (
  parts: string[]
): Promise<{ stdout: string; stderr: string; exitcode: number }> => {
  const handler = spawn(GOGDL_PATH, [
    "--auth-config-path",
    AUTH_CONFIG_PATH,
    ...parts,
  ]);
  handler.stdout.setEncoding("utf-8");
  handler.stderr.setEncoding("utf-8");

  return new Promise((resolve) => {
    let stdout: string = "";
    let stderr: string = "";

    handler.stdout.addListener("data", (chunk) => (stdout += chunk));
    handler.stderr.addListener("data", (chunk) => (stderr += chunk));

    handler.addListener("close", (exitcode) => {
      resolve({ stdout, stderr, exitcode });
    });
  });
};
