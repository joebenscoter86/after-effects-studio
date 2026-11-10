import { promises as fs } from "node:fs";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function readFileSettled(filePath, timeoutMs = 15e3, stableMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;
  let lastChange = Date.now();
  for (; ; ) {
    let size = -1;
    try {
      size = (await fs.stat(filePath)).size;
    } catch {
    }
    if (size >= 0) {
      if (size !== lastSize) {
        lastSize = size;
        lastChange = Date.now();
      } else if (size > 0 && Date.now() - lastChange >= stableMs) {
        return fs.readFile(filePath);
      }
    }
    if (Date.now() > deadline) {
      throw new Error(
        `file did not settle within ${timeoutMs}ms (saveFrameToPng writes asynchronously): ${filePath}`
      );
    }
    await sleep(60);
  }
}
export {
  readFileSettled
};
