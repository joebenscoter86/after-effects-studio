// A stand-in for the slice of After Effects that serve.jsx's undo handling
// touches: project items, undo groups, the undo/redo menu commands, dialog
// suppression and app.onError. It loads the REAL serve.jsx and serves a
// request through it, so the rollback logic under test is the code that ships.
//
// What the model assumes (each line is something only a live run confirms):
//   - every project change made while a group is open joins that group, and
//     endUndoGroup turns a non-empty group into ONE undo step; an empty group
//     leaves no step (measured: probe A, 2026-11-10);
//   - a change made with no group open is a step of its own;
//   - adding a folder and removing it again inside a group records a step
//     (measured: probe B) — the fake records each change, so add+remove
//     inside one group is one step holding two changes;
//   - app.executeCommand(16) reverts exactly the top step, 2035 replays the
//     last reverted one (measured for undo: probes C and E);
//   - app.onError(text, severity) is how a script hears about an error After
//     Effects reports while dialogs are suppressed — NOT measured; the knobs
//     below let a test make undo report through it, throw, or do nothing.

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SERVE_PATH = fileURLToPath(new URL("../../jsx/serve.jsx", import.meta.url));
const JSON2_PATH = fileURLToPath(new URL("../../jsx/json2.jsx", import.meta.url));

export const MAILBOX = "/mailbox";

/** ExtendScript's JSON (json2.jsx), not Node's. */
function extendScriptJson(): { parse: (t: string) => unknown; stringify: (v: unknown) => string } {
  const src = readFileSync(JSON2_PATH, "utf8");
  const load = new Function("JSON", `${src}\nreturn JSON;`) as (
    j: undefined,
  ) => ReturnType<typeof extendScriptJson>;
  return load(undefined);
}

/** In-memory disk shared by every FakeFile of one FakeAe. */
type Disk = Map<string, string>;

function fileClass(disk: Disk) {
  return class FakeFile {
    encoding = "";
    error = "";
    private mode: string | null = null;
    constructor(public fsName: string) {}
    get name(): string {
      return path.posix.basename(this.fsName);
    }
    get exists(): boolean {
      return disk.has(this.fsName);
    }
    get modified(): Date {
      return new Date(0);
    }
    get length(): number {
      return Buffer.byteLength(disk.get(this.fsName) ?? "", "utf8");
    }
    open(mode: string): boolean {
      if (mode === "r" && !disk.has(this.fsName)) return false;
      this.mode = mode;
      if (mode === "w") disk.set(this.fsName, "");
      if (mode === "a" && !disk.has(this.fsName)) disk.set(this.fsName, "");
      return true;
    }
    read(): string {
      return disk.get(this.fsName) ?? "";
    }
    write(text: string): boolean {
      if (this.mode !== "w" && this.mode !== "a") return false;
      disk.set(this.fsName, (disk.get(this.fsName) ?? "") + text);
      return true;
    }
    writeln(text: string): boolean {
      return this.write(`${text}\n`);
    }
    close(): boolean {
      this.mode = null;
      return true;
    }
    remove(): boolean {
      return disk.delete(this.fsName);
    }
    rename(newName: string): boolean {
      const dest = path.posix.join(path.posix.dirname(this.fsName), newName);
      const content = disk.get(this.fsName);
      if (content === undefined) return false;
      disk.delete(this.fsName);
      disk.set(dest, content);
      this.fsName = dest;
      return true;
    }
  };
}

interface Change {
  label: string;
  revert(): void;
  replay(): void;
}

export interface FakeItem {
  id: number;
  name: string;
  typeName: string;
  numLayers?: number;
  remove(): void;
}

export type UndoBehaviour =
  /** Revert the top step, as measured. */
  | "normal"
  /** Throw from executeCommand, reverting nothing. */
  | "throw"
  /** Revert the top step, then report an error through app.onError (the modal box, suppressed). */
  | "revert-and-report"
  /** Report an error through app.onError and revert nothing. */
  | "report-only"
  /** Return normally and revert nothing (the suppression scope swallowing undo). */
  | "noop";

export interface ServeOptions {
  undoGroup?: boolean;
  suppressDialogs?: boolean;
  rollback?: boolean;
  label?: string;
}

export interface ServedResponse {
  id: string;
  ok: boolean;
  phase: string;
  result: unknown;
  error: string | null;
  line: number | null;
  logs: string[];
  rollback?: {
    attempted: boolean;
    rolledBack: boolean;
    verified: string;
    reason: string | null;
    left: string | null;
    aeErrors: string[];
    before?: { numItems: number; hash: string } | null;
    after?: { numItems: number; hash: string } | null;
  } | null;
}

export class FakeAe {
  readonly disk: Disk = new Map();
  items: FakeItem[] = [];
  private nextId = 1;
  /** Closed undo steps, oldest first. */
  readonly undoStack: Change[][] = [];
  readonly redoStack: Change[][] = [];
  private openGroup: Change[] | null = null;
  private groupDepth = 0;
  suppressed = 0;
  undoBehaviour: UndoBehaviour = "normal";
  /** Every executeCommand call, with whether dialogs were suppressed at the time. */
  readonly commands: Array<{ id: number; suppressed: boolean }> = [];
  /** Errors that would have reached the user as a modal (reported while NOT suppressed). */
  readonly modals: string[] = [];
  /** When true, addFolder throws (a project that cannot take the rollback marker). */
  refuseFolders = false;

  /** The global `app` the JSX sees. */
  readonly app: Record<string, unknown>;

  constructor() {
    const ae = this;
    const project = {
      get numItems() {
        return ae.items.length;
      },
      file: null as null | { fsName: string },
      activeItem: null as unknown,
      item(i: number) {
        const it = ae.items[i - 1];
        if (!it) throw new Error(`item index ${i} out of range`);
        return it;
      },
      itemByID(id: number) {
        return ae.items.find((it) => it.id === id) ?? null;
      },
      items: {
        addFolder(name: string) {
          if (ae.refuseFolders) throw new Error("cannot add a folder now");
          return ae.addItem(name, "Folder");
        },
        addComp(name: string) {
          return ae.addItem(name, "Composition", 0);
        },
      },
    };
    this.app = {
      project,
      onError: null as unknown,
      beginUndoGroup() {
        ae.groupDepth++;
        if (ae.groupDepth === 1) ae.openGroup = [];
      },
      endUndoGroup() {
        if (ae.groupDepth === 0) return;
        ae.groupDepth--;
        if (ae.groupDepth === 0) {
          const g = ae.openGroup;
          ae.openGroup = null;
          if (g && g.length > 0) ae.pushStep(g);
        }
      },
      beginSuppressDialogs() {
        ae.suppressed++;
      },
      endSuppressDialogs() {
        if (ae.suppressed > 0) ae.suppressed--;
      },
      executeCommand(id: number) {
        ae.commands.push({ id, suppressed: ae.suppressed > 0 });
        if (id === 16) ae.undo();
        else if (id === 2035) ae.redo();
      },
    };
  }

  /** The `project` object, for test setup. */
  get project(): { file: null | { fsName: string } } {
    return this.app.project as { file: null | { fsName: string } };
  }

  addItem(name: string, typeName: string, numLayers?: number): FakeItem {
    const ae = this;
    const item: FakeItem = {
      id: this.nextId++,
      name,
      typeName,
      ...(numLayers === undefined ? {} : { numLayers }),
      remove() {
        const at = ae.items.indexOf(item);
        if (at === -1) throw new Error("already removed");
        ae.items.splice(at, 1);
        ae.record({
          label: `remove ${name}`,
          revert: () => ae.items.splice(Math.min(at, ae.items.length), 0, item),
          replay: () => ae.items.splice(ae.items.indexOf(item), 1),
        });
      },
    };
    if (numLayers !== undefined) {
      const comp = item as FakeItem & { layers?: unknown[]; layer?: (i: number) => unknown };
      comp.layers = [];
      comp.layer = (i: number) => {
        const l = comp.layers?.[i - 1];
        if (!l) throw new Error(`layer index ${i} out of range`);
        return l;
      };
    }
    this.items.push(item);
    this.record({
      label: `add ${name}`,
      revert: () => this.items.splice(this.items.indexOf(item), 1),
      replay: () => this.items.push(item),
    });
    return item;
  }

  /** A change the user made before the request: its own undo step. */
  userStep(name: string): FakeItem {
    (this.app.beginUndoGroup as () => void)();
    const item = this.addItem(name, "Composition", 0);
    (this.app.endUndoGroup as () => void)();
    return item;
  }

  /** Make `item` the active comp (what the timeline shows). */
  setActive(item: FakeItem): void {
    (this.app.project as { activeItem: unknown }).activeItem = item;
  }

  /** The user adds a layer named `name` to `comp`, as its own undo step. */
  userLayerStep(comp: FakeItem, name: string): void {
    const c = comp as FakeItem & { layers: Array<{ name: string }> };
    const layers = c.layers;
    const layer = { name, inPoint: 0, outPoint: 1, enabled: true };
    (this.app.beginUndoGroup as () => void)();
    layers.push(layer);
    c.numLayers = layers.length;
    this.record({
      label: `add layer ${name}`,
      revert: () => {
        layers.splice(layers.indexOf(layer), 1);
        c.numLayers = layers.length;
      },
      replay: () => {
        layers.push(layer);
        c.numLayers = layers.length;
      },
    });
    (this.app.endUndoGroup as () => void)();
  }

  /** The user renames layer `index` of `comp`, as its own undo step (no item-level change). */
  userRenameLayerStep(comp: FakeItem, index: number, name: string): void {
    const layer = (comp as FakeItem & { layers: Array<{ name: string }> }).layers[index - 1];
    const old = layer.name;
    (this.app.beginUndoGroup as () => void)();
    layer.name = name;
    this.record({ label: `rename ${old}`, revert: () => (layer.name = old), replay: () => (layer.name = name) });
    (this.app.endUndoGroup as () => void)();
  }

  names(): string[] {
    return this.items.map((it) => it.name);
  }

  private record(change: Change): void {
    if (this.openGroup) this.openGroup.push(change);
    else this.pushStep([change]);
  }

  private pushStep(step: Change[]): void {
    this.undoStack.push(step);
    this.redoStack.length = 0;
  }

  private report(text: string): void {
    const handler = this.app.onError;
    if (this.suppressed > 0 && typeof handler === "function") {
      (handler as (t: string, s: string) => void)(text, "PROBLEM");
    } else if (this.suppressed === 0) {
      this.modals.push(text);
    }
  }

  private undo(): void {
    switch (this.undoBehaviour) {
      case "throw":
        throw new Error("After Effects error: can not undo now");
      case "noop":
        return;
      case "report-only":
        this.report("After Effects error: undo failed");
        return;
      default: {
        const step = this.undoStack.pop();
        if (step) {
          for (let i = step.length - 1; i >= 0; i--) step[i].revert();
          this.redoStack.push(step);
        }
        if (this.undoBehaviour === "revert-and-report") this.report("After Effects error: internal verification failure");
      }
    }
  }

  private redo(): void {
    const step = this.redoStack.pop();
    if (!step) return;
    for (const change of step) change.replay();
    this.undoStack.push(step);
  }

  /** Serve one request through the real serve.jsx. */
  serve(id: string, code: string, options: ServeOptions = {}): ServedResponse {
    const requestPath = `${MAILBOX}/request-${id}.json`;
    this.disk.set(
      requestPath,
      JSON.stringify({
        id,
        label: options.label ?? "test",
        code,
        payload: null,
        undoGroup: options.undoGroup ?? true,
        suppressDialogs: options.suppressDialogs ?? true,
        ...(options.rollback === undefined ? {} : { rollback: options.rollback }),
      }),
    );
    const src = readFileSync(SERVE_PATH, "utf8");
    const FakeFile = fileClass(this.disk);
    // AE is the helpers.jsx namespace; serve.jsx keeps its own formatter, and
    // batch code only needs AE.errText from it.
    const AE = { errText: (e: unknown) => (e instanceof Error ? e.message : String(e)) };
    const load = new Function("File", "Folder", "app", "JSON", "AE", `${src}\nreturn AE_MCP;`) as (
      ...args: unknown[]
    ) => { serveRequest(f: unknown, dir: string, log: string): void };
    const AE_MCP = load(FakeFile, undefined, this.app, extendScriptJson(), AE);
    // Code compiled by serve.jsx's `new Function` sees only globals, as in
    // ExtendScript, where AE and AE_MCP are globals of the script engine.
    const g = globalThis as Record<string, unknown>;
    const saved = { AE: g.AE, AE_MCP: g.AE_MCP };
    g.AE = AE;
    g.AE_MCP = AE_MCP;
    try {
      AE_MCP.serveRequest(new FakeFile(requestPath), MAILBOX, `${MAILBOX}/dispatcher.log`);
    } finally {
      g.AE = saved.AE;
      g.AE_MCP = saved.AE_MCP;
    }
    const raw = this.disk.get(`${MAILBOX}/response-${id}.json`);
    if (raw === undefined) throw new Error("serve.jsx wrote no response");
    return JSON.parse(raw) as ServedResponse;
  }
}
