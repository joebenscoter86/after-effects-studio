// Menu command operations — execute AE menu commands by ID.
// Reference: https://hyperbrew.co/blog/2025-after-effects-command-ids/

import { registerOp, jsxVal } from "../registry.js";

/** Menu command IDs for Undo and Redo — the two that drive the undo stack. */
export const UNDO_COMMAND_ID = 16;
export const REDO_COMMAND_ID = 2035;

/** True when this menu command is Undo or Redo (see Operation.undoGroup). */
export function isUndoRedoCommandId(id: unknown): boolean {
  return id === UNDO_COMMAND_ID || id === REDO_COMMAND_ID;
}

registerOp({
  name: "command.execute",
  category: "command",
  description:
    "Execute an AE menu command by its numeric ID. Use command.list to discover common IDs. " +
    "Undo (16) and Redo (2035) run outside this call's undo group, so they revert/replay the PREVIOUS call; " +
    "like project.undo / project.redo they run with dialogs suppressed, report any error After Effects raised, and are " +
    "refused after a scripted render-queue change in the session unless acceptRenderQueueRisk: true.",
  params: [
    { name: "id", type: "number", description: "Menu command ID", required: true },
    {
      name: "acceptRenderQueueRisk",
      type: "boolean",
      description:
        "Default false. After a scripted render-queue change in this After Effects session, Undo/Redo (16/2035) are refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
      required: false,
    },
  ],
  // Undo/Redo must not be executed inside an open undo group — AE applies them
  // to that group and the requested step survives. Everything else groups
  // normally, so one Ctrl+Z still reverts one call. Dialog suppression is on
  // for every command, Undo/Redo included (see project.undo).
  undoGroup: (args) => !isUndoRedoCommandId(args.id),
  toJsx(args) {
    if (isUndoRedoCommandId(args.id)) {
      return `
            var _c = AE_MCP.undoRedo(${jsxVal(args.id)}, 1, ${jsxVal(args.acceptRenderQueueRisk === true)});
            _c.commandId = ${jsxVal(args.id)};
            return _c;
        `;
    }
    return `
            app.executeCommand(${jsxVal(args.id)});
            return { ok: true, commandId: ${jsxVal(args.id)} };
        `;
  },
});

registerOp({
  name: "command.find",
  category: "command",
  readOnly: true,
  description:
    "Find a menu command ID by name (AE's app.findMenuCommandId). Note: not reliable across languages.",
  params: [
    { name: "name", type: "string", description: "Menu command name (English)", required: true },
  ],
  toJsx(args) {
    return `
            var _id = app.findMenuCommandId(${jsxVal(args.name)});
            if (!_id || _id === 0) return { ok: false, error: "command not found: " + ${jsxVal(args.name)} };
            return { ok: true, name: ${jsxVal(args.name)}, commandId: _id };
        `;
  },
});

registerOp({
  name: "command.list",
  category: "command",
  readOnly: true,
  description: "Return a curated list of commonly-used menu command IDs.",
  params: [],
  toJsx() {
    return `
            return { ok: true, commands: [
                { id: 16, name: "Undo" },
                { id: 2004, name: "New Composition" },
                { id: 2005, name: "New Folder" },
                { id: 2019, name: "New Solid" },
                { id: 2025, name: "New Adjustment Layer" },
                { id: 2028, name: "New Null Object" },
                { id: 2030, name: "New Camera" },
                { id: 2031, name: "New Light" },
                { id: 2035, name: "Redo" },
                { id: 2040, name: "Deselect All" },
                { id: 2055, name: "Purge Image Caches" },
                { id: 2071, name: "Pre-compose" },
                { id: 2072, name: "Move All Attributes" },
                { id: 2078, name: "Trim Comp to Work Area" },
                { id: 2156, name: "Fit to Comp" },
                { id: 2157, name: "Fit to Comp Width" },
                { id: 2158, name: "Fit to Comp Height" },
                { id: 2243, name: "Convert Audio to Keyframes" },
                { id: 2349, name: "Convert to Bezier Path" },
                { id: 2371, name: "Time-Reverse Keyframes" },
                { id: 2450, name: "Fit to Screen" },
                { id: 2501, name: "Snap to Grid" },
                { id: 2691, name: "Render Queue" },
                { id: 2732, name: "Convert Expression to Keyframes" },
                { id: 3101, name: "Purge All Memory & Disk Cache" },
                { id: 10312, name: "Align Layers to Composition" }
            ] };
        `;
  },
});
