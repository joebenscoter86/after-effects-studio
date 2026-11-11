export interface AeDialog {
    /** AfterFX.exe process that owns the dialog. */
    pid: number;
    /**
     * Opaque dialog id — what `instance.dismiss_dialog` takes. On Windows the
     * window handle in decimal; on macOS `<pid>:<CG window number>`.
     */
    id: string;
    /** The dialog's message, whitespace-trimmed. Empty when it could not be read. */
    text: string;
    width: number;
    height: number;
    /** Main-window title of the owning process (names the project it has open). */
    window: string | null;
    /**
     * macOS only: whether Accessibility permission was available, i.e. whether
     * the text could be read and the dialog can be dismissed.
     */
    accessibility?: boolean;
    /** macOS only: when the owning process launched (ms since epoch). */
    startedAt?: number;
    /**
     * macOS only: the window's own name (CGWindowName; empty when the process
     * running this server may not read window names).
     */
    title?: string;
    /** macOS only: the CG window layer. */
    layer?: number;
    /**
     * Set when this is not a dialog but After Effects' own "Executing Script
     * ..." progress window — a script is still running. Its only action cancels
     * that script, so it is never offered for dismissal. "name": recognised by
     * its window name; "size": the name was unavailable, so recognised by the
     * measured shape (layer 8, 363 x 181, no readable text). See
     * scriptProgressMatch.
     */
    scriptProgress?: "name" | "size";
}
/**
 * After Effects' progress window while a script runs, as measured on After
 * Effects 2027 / macOS on 2026-11-10: CG layer 8, 363 x 181, named
 * "Executing Script ...". Idle, AE had one on-screen window (layer 0).
 */
export declare const SCRIPT_PROGRESS_NAME: RegExp;
export declare const SCRIPT_PROGRESS_SHAPE: {
    layer: number;
    width: number;
    height: number;
    tolerance: number;
};
/**
 * Is this scanned window the script progress window? By name when either the
 * window name or its text is readable; otherwise by shape, but only for a
 * window with no readable text at all (a real dialog of that size whose text
 * can be read is never taken for it).
 */
export declare function scriptProgressMatch(d: {
    text: string;
    width: number;
    height: number;
    title?: string;
    layer?: number;
}): "name" | "size" | null;
/** Split a scan into real dialogs and script progress windows. */
export declare function splitScriptProgress(windows: AeDialog[]): {
    dialogs: AeDialog[];
    scripts: AeDialog[];
};
/** The sentence a failure carries when only the script progress window was found. */
export declare function scriptRunningMessage(scripts: AeDialog[]): string;
export declare const SCRIPT_RUNNING_HINT: string;
export interface DismissResult {
    /** The id named a visible After Effects dialog and its cancel action was sent. */
    posted: boolean;
    /** The dialog was gone shortly afterwards. */
    closed: boolean;
    /** What the dialog said (null when it was not found). */
    text: string | null;
    /**
     * Why nothing was sent, when posted is false: no such dialog, no
     * Accessibility permission (macOS), or the window is After Effects' script
     * progress window, which is never closed.
     */
    reason?: "not_found" | "no_permission" | "script_progress";
}
/** Runs a script and resolves with its stdout. Injectable for tests. */
export type ScriptRunner = (script: string, env: Record<string, string>) => Promise<string>;
/** Runs a PowerShell script (Windows). */
export type PowerShellRunner = ScriptRunner;
export declare const DARWIN_SCRIPT: string;
/** Swap the PowerShell runner (tests). Returns a function restoring the previous one. */
export declare function setPowerShellRunner(next: PowerShellRunner): () => void;
/** Swap the osascript runner (tests). Returns a function restoring the previous one. */
export declare function setOsascriptRunner(next: ScriptRunner): () => void;
/** Whether this platform can scan for dialogs at all. */
export declare function dialogScanSupported(platform?: NodeJS.Platform): boolean;
/** Parse the scan's JSON output; anything unexpected yields no dialogs. */
export declare function parseDialogScan(raw: string): AeDialog[];
/**
 * Every window the scan takes for a modal, including After Effects' own
 * script progress window, which is marked (`scriptProgress`). Best-effort:
 * unsupported platform, no PowerShell, or a scan that fails all report none —
 * this only ever adds information to a failure, it must not cause one.
 */
export declare function scanAeWindows(platform?: NodeJS.Platform): Promise<AeDialog[]>;
/** The modal dialogs every running After Effects is showing (never the script progress window). */
export declare function scanAeDialogs(platform?: NodeJS.Platform): Promise<AeDialog[]>;
/**
 * Close a dialog by its cancel action, never a decision (see the header: a
 * save prompt is cancelled, not answered). The id must name a dialog the scan
 * would report right now — anything else, including a window that has since
 * closed or an id that was never an After Effects dialog, is refused inside
 * the script, so a stale or made-up id can never send keys elsewhere.
 */
export declare function dismissAeDialog(id: string, platform?: NodeJS.Platform): Promise<DismissResult>;
/** One line per dialog, for error messages. */
export declare function describeDialogs(dialogs: AeDialog[]): string;
/** The sentence a failure carries when dialogs were found. */
export declare function dialogBlockMessage(dialogs: AeDialog[]): string;
export declare const DIALOG_HINT: string;
export declare const ACCESSIBILITY_HINT: string;
/** DIALOG_HINT, plus the Accessibility note when any dialog was seen without it. */
export declare function dialogHint(dialogs: AeDialog[]): string;
//# sourceMappingURL=dialogs.d.ts.map