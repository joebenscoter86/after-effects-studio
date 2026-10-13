// Abstract transport for executing ExtendScript (JSX) inside a running AE
// instance. The initial implementation uses file-based IPC + a per-platform
// dispatcher launch (`AfterFX.exe -r` on Windows, `osascript`/DoScript on
// macOS) per call (see FileIpcTransport). A future SocketTransport can slot
// in here without changing any tool code — the tool layer depends only on
// this interface.
export {};
//# sourceMappingURL=AeTransport.js.map