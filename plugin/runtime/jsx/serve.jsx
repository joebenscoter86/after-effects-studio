// mcp-aftereffects request server — turns one request-<id>.json into one
// response-<id>.json. Shared by the two ways a request reaches After Effects:
//
//   dispatcher.jsx  push — launched per call by `AfterFX.exe -r` / DoScript,
//                   finds the oldest request in the shared mailbox
//   agent.jsx       pull — resident in one AE instance, polls that instance's
//                   own mailbox (<runtime>/instances/<id>/) from a scheduled task
//
// Both hand `AE_MCP.serveRequest` a request File and the directory it lives
// in; the response is written next to it. The contract is the same on either
// path:
//
//   - the request is DELETED before it runs (consume-on-read), so no second
//     dispatcher run or tick can execute it again;
//   - the id comes from the FILENAME, not the JSON body, so even a corrupt or
//     unparseable request gets a correlated response instead of stranding the
//     caller for a full timeout;
//   - `code` is evaluated as a function body with `app`, `log`, `payload`
//     and `__mcp` in scope, inside an undo group unless the request said
//     `undoGroup: false`, with modal dialogs suppressed unless it said
//     `suppressDialogs: false`;
//   - with `rollback: true`, a grouped request whose code throws is undone
//     before the response is written, and the response says how that went
//     (see AE_MCP.rollBack);
//   - every failure mode writes a response. An exception escaping to AE's
//     modal error dialog would block scripting for the rest of the session.
//
// Keep this file ES3: var only, no arrow functions, no Array.prototype.map.

var AE_MCP = AE_MCP || {};

// --- Talking about exceptions safely ---------------------------------------
// `"failed: " + e` is not a safe way to report an error in ExtendScript. The
// engine cannot coerce an Error to a primitive, so the concatenation ITSELF
// throws ("Object of type Error found where a Number, Array, or Property is
// needed") — from inside the handler whose whole job was to report the
// original failure. The real error is lost, the replacement escapes, and AE
// raises a modal that blocks all scripting until a human clicks OK; every
// later call then fails as a timeout.
//
// So: nothing here interpolates an exception directly. helpers.jsx exposes the
// same formatter as AE.errText for generated code; this file keeps its own so
// it can report failures even if helpers.jsx did not load.
AE_MCP.describeError = function (e) {
    try {
        if (e === null || e === undefined) return "unknown error";
        if (typeof e === "string") return e;
        var msg = (e.message === undefined || e.message === null) ? "" : String(e.message);
        if (msg.length === 0) msg = "error";
        if (e.line !== undefined && e.line !== null) msg += " (line " + String(e.line) + ")";
        return msg;
    } catch (eFmt) {
        return "unformattable error";
    }
};

AE_MCP.errStack = function (e) {
    try {
        return (e && e.stack) ? String(e.stack) : null;
    } catch (eSt) {
        return null;
    }
};

// --- Undo, redo and rollback -----------------------------------------------
// Measured on After Effects 2027 (2026-11-10, side-session note
// undo-hazard-live-finding.md):
//   A  a call that changes nothing leaves NO undo step, so an undo issued
//      after it reverts whatever the user did before;
//   B  a change made inside the open group always records a step;
//   C  a script that throws leaves its partial change applied, as one step;
//   E  undo issued from inside the same request, after its group is closed,
//      reverts that request's changes and nothing earlier;
//   and once, late in a long session, an undo raised an After Effects error
//   box that blocked all scripting until a person clicked it.
//
// So a rollback (a) adds a marker folder INSIDE the still-open group, which
// makes the group certain to exist (B) and gives the undo something of its
// own to consume (A), (b) closes the group, (c) undoes once with dialogs
// suppressed and app.onError listening, and (d) checks: the marker gone
// means the whole group was reverted (a group is one step, so the request's
// changes went with it), and a signature of the project's items taken before
// the call must match again. It never retries. A marker is added only on the
// failure path, never on a call that succeeds, so the user's undo history is
// untouched by ordinary calls.

AE_MCP.UNDO_COMMAND_ID = 16;
AE_MCP.REDO_COMMAND_ID = 2035;
/** Items hashed into a signature; past this only the first ones and the count are compared. */
AE_MCP.SIGNATURE_ITEM_LIMIT = 1000;
AE_MCP.ROLLBACK_MARKER_PREFIX = "mcp-rollback-";

/** fsName of the open project file, or null (unsaved, or unreadable). */
AE_MCP.projectFile = function () {
    try {
        var f = app.project.file;
        return f ? String(f.fsName) : null;
    } catch (e) {
        return null;
    }
};

/**
 * A short signature of the project's items: count, and a hash of each item's
 * id, name and layer count (first SIGNATURE_ITEM_LIMIT items). It sees items
 * added, removed or renamed and layers added or removed; it does not see a
 * property value change. Null when the project cannot be read.
 */
AE_MCP.projectSignature = function () {
    try {
        var p = app.project;
        var n = p.numItems;
        var limit = AE_MCP.SIGNATURE_ITEM_LIMIT;
        var m = n < limit ? n : limit;
        var h = 7;
        for (var i = 1; i <= m; i++) {
            var it = p.item(i);
            var layers = "-";
            try { if (typeof it.numLayers === "number") layers = String(it.numLayers); } catch (eL) { /* not a comp */ }
            var s = String(it.id) + ":" + String(it.name) + ":" + layers + ";";
            for (var c = 0; c < s.length; c++) h = (h * 31 + s.charCodeAt(c)) % 2147483647;
        }
        return { numItems: n, hash: String(h), partial: n > limit, file: AE_MCP.projectFile() };
    } catch (eSig) {
        return null;
    }
};

/** True while an item with this id is still in the project. */
AE_MCP.itemExists = function (id) {
    try {
        if (typeof app.project.itemByID === "function") {
            var direct = app.project.itemByID(id);
            if (direct) return true;
        }
    } catch (eById) { /* older After Effects: fall back to a scan */ }
    try {
        var n = app.project.numItems;
        for (var i = 1; i <= n; i++) {
            if (app.project.item(i).id === id) return true;
        }
    } catch (eScan) { /* unreadable */ }
    return false;
};

/**
 * Run the Undo or Redo menu command once and report what happened: whether
 * it threw, and every error After Effects reported through app.onError while
 * it ran (with dialogs suppressed that is where an error box's text goes, if
 * anywhere — not yet confirmed live). The previous onError is restored.
 */
AE_MCP.runUndoCommand = function (commandId) {
    var out = { threw: null, aeErrors: [] };
    var prev = null;
    var hadPrev = false;
    try { prev = app.onError; hadPrev = true; } catch (eGet) { /* no onError */ }
    try {
        app.onError = function (text, severity) {
            try {
                out.aeErrors.push(String(text) + (severity ? " (" + String(severity) + ")" : ""));
            } catch (ePush) { /* ignore */ }
        };
    } catch (eSet) { /* cannot listen; report what we can */ }
    try {
        app.executeCommand(commandId);
    } catch (eCmd) {
        out.threw = AE_MCP.describeError(eCmd);
    }
    try { app.onError = hadPrev ? prev : null; } catch (eRestore) { /* ignore */ }
    return out;
};

/**
 * Undo or redo `count` times for project.undo / project.redo and
 * command.execute 16/2035. Stops at the first throw; reports AE's errors.
 */
AE_MCP.undoRedo = function (commandId, count) {
    var n = (typeof count === "number" && count > 0) ? Math.floor(count) : 1;
    var done = 0;
    var errors = [];
    var threw = null;
    for (var i = 0; i < n; i++) {
        var r = AE_MCP.runUndoCommand(commandId);
        for (var e = 0; e < r.aeErrors.length; e++) errors.push(r.aeErrors[e]);
        if (r.threw !== null) { threw = r.threw; break; }
        done++;
    }
    var what = (commandId === AE_MCP.REDO_COMMAND_ID) ? "redo" : "undo";
    var out = { ok: threw === null, requested: n, done: done, aeErrors: errors };
    if (threw !== null) out.error = what + " " + String(done + 1) + " of " + String(n) + " threw: " + threw;
    if (errors.length > 0) {
        out.warning = "After Effects reported " + String(errors.length) + " error(s) during " + what +
            " (dialogs were suppressed, so none was shown): " + errors.join(" | ") +
            " — inspect the project before relying on the result";
    }
    return out;
};

/** The marker that makes the open group certain to hold a step of this request's own. */
AE_MCP.addRollbackMarker = function (requestId) {
    try {
        var f = app.project.items.addFolder(AE_MCP.ROLLBACK_MARKER_PREFIX + requestId);
        return { id: f.id, name: String(f.name), error: null };
    } catch (e) {
        return { id: null, name: null, error: AE_MCP.describeError(e) };
    }
};

AE_MCP.KEPT_AS_ONE_STEP = "the call's changes up to the failure are still applied, as one undo step";

AE_MCP.sigSummary = function (sig) {
    return sig ? { numItems: sig.numItems, hash: sig.hash } : null;
};

/**
 * Revert the request whose group was just closed with `marker` inside it.
 * `sigBefore` is the signature taken before the request ran. Never retries
 * and never throws.
 */
AE_MCP.rollBack = function (marker, sigBefore, dialogsAlreadySuppressed) {
    var rb = {
        attempted: false,
        rolledBack: false,
        verified: "none",
        reason: null,
        left: null,
        aeErrors: [],
        before: AE_MCP.sigSummary(sigBefore),
        after: null
    };
    try {
        if (marker.error !== null) {
            rb.reason = "could not add the rollback marker inside the call's undo group (" + marker.error +
                "); without it an undo could revert the user's previous action instead, so none was issued";
            rb.left = AE_MCP.KEPT_AS_ONE_STEP;
            return rb;
        }
        if (sigBefore && AE_MCP.projectFile() !== sigBefore.file) {
            rb.reason = "the project was replaced or saved under another name during the call; undo would act on a different history, so none was issued";
            rb.left = "unknown: inspect the project that is open now";
            return rb;
        }
        var ownSuppress = false;
        if (!dialogsAlreadySuppressed) {
            try { app.beginSuppressDialogs(); ownSuppress = true; } catch (eSup) { /* run anyway */ }
        }
        rb.attempted = true;
        var u = AE_MCP.runUndoCommand(AE_MCP.UNDO_COMMAND_ID);
        if (ownSuppress) {
            try { app.endSuppressDialogs(false); } catch (eEndSup) { /* ignore */ }
        }
        rb.aeErrors = u.aeErrors;
        var after = AE_MCP.projectSignature();
        rb.after = AE_MCP.sigSummary(after);
        var markerGone = !AE_MCP.itemExists(marker.id);
        var same = (sigBefore && after) ? (sigBefore.numItems === after.numItems && sigBefore.hash === after.hash) : null;
        var markerNote = "the rollback marker folder '" + marker.name + "' (item id " + String(marker.id) + ")";
        if (u.threw !== null) {
            rb.reason = "the undo command threw: " + u.threw;
        } else if (!markerGone) {
            rb.reason = "the undo did not take effect: " + markerNote + " is still in the project";
        } else if (same === false) {
            rb.reason = "the undo ran, but the project's items do not match their state before the call";
        } else {
            rb.rolledBack = true;
        }
        if (markerGone && same === true) rb.verified = (sigBefore && sigBefore.partial) ? "partial" : "signature";
        else if (markerGone) rb.verified = "marker";
        if (!rb.rolledBack) {
            rb.left = markerGone
                ? "unknown: an undo ran; inspect the project before doing anything else"
                : AE_MCP.KEPT_AS_ONE_STEP + ", together with " + markerNote + "; inspect the project, then one project.undo would revert both";
        }
    } catch (eRb) {
        rb.reason = "rollback failed: " + AE_MCP.describeError(eRb);
        rb.left = "unknown: inspect the project before doing anything else";
    }
    return rb;
};

/** Fire-and-forget append to a log file; errors are swallowed so logging never breaks serving. */
AE_MCP.appendLog = function (logPath, msg) {
    try {
        var lf = new File(logPath);
        lf.encoding = "UTF-8";
        if (lf.open("a")) {
            lf.writeln("[" + new Date().toString() + "] " + msg);
            lf.close();
        }
    } catch (eLog) { /* ignore */ }
};

/**
 * Oldest pending request-*.json directly inside `dir`, or null. Oldest-first
 * keeps a backlog fair. Not recursive: the shared mailbox and every instance
 * mailbox under instances/<id>/ are separate queues.
 */
AE_MCP.oldestRequestIn = function (dir) {
    try {
        var folder = new Folder(dir);
        if (!folder.exists) return null;
        var files = folder.getFiles("request-*.json");
        if (!files || files.length === 0) return null;
        var best = null;
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (!(f instanceof File)) continue;
            if (best === null) { best = f; continue; }
            try {
                if (f.modified < best.modified) best = f;
            } catch (eCmp) { /* unstat-able; keep the incumbent */ }
        }
        return best;
    } catch (eScan) {
        return null;
    }
};

/**
 * Serve one request: consume it, run it, write its response.
 *
 * @param requestFile  File   the request-<id>.json to serve
 * @param mailboxDir   string directory holding it; the response goes next to it
 * @param logPath      string append-only log for this serving path
 */
AE_MCP.serveRequest = function (requestFile, mailboxDir, logPath) {
    var REQUEST_PREFIX = "request-";
    var REQUEST_SUFFIX = ".json";
    var describeError = AE_MCP.describeError;
    var errStack = AE_MCP.errStack;

    function appendLog(msg) {
        AE_MCP.appendLog(logPath, msg);
    }

    // --- Identify the request from its filename ------------------------
    // Filename is authoritative: a request whose JSON body we cannot parse
    // still gets a correlated response instead of stranding the caller.
    var requestName = String(requestFile.name);
    try { requestName = decodeURI(requestName); } catch (eDec) { /* keep raw */ }
    var requestId = requestName.substring(
        REQUEST_PREFIX.length,
        requestName.length - REQUEST_SUFFIX.length
    );

    var response = {
        id: requestId,
        ok: false,
        phase: "dispatch",
        result: null,
        error: null,
        // 1-based line in the COMPILED function body where execution threw
        // (ExtendScript Error.line). The body = the wrapped request code,
        // and new Function's synthesized header occupies line 1, so this is
        // NOT a line in what the caller wrote — the Node side owns the
        // arithmetic that maps it back (it knows the wrapper layout).
        line: null,
        stack: null,
        logs: [],
        // How a rollback of this request went (AE_MCP.rollBack), or null
        // when none was needed.
        rollback: null
    };

    var responsePath = mailboxDir + "/response-" + requestId + ".json";
    var tmpName = ".response-" + requestId + ".json.tmp";
    var tmpPath = mailboxDir + "/" + tmpName;

    /** Move the freshly written tmp file into place, replacing any stale answer. */
    function promoteTmp(tmp) {
        var dest = new File(responsePath);
        if (dest.exists) {
            try { dest.remove(); } catch (eRm) { /* ignore */ }
        }
        // File#rename takes a new name (not a path). tmp and dest share a
        // parent dir, so this is effectively atomic on NTFS — the poller
        // never sees a half-written response.
        tmp.rename("response-" + requestId + ".json");
    }

    /**
     * Strip `s` to the printable-ASCII characters that need no JSON escaping.
     * Only used by the fallback below, which has to build its JSON by hand
     * precisely because JSON.stringify is what just failed.
     */
    function jsonSafeAscii(s) {
        var t = String(s);
        var out = "";
        for (var i = 0; i < t.length; i++) {
            var c = t.charAt(i);
            var code = t.charCodeAt(i);
            out += (code >= 0x20 && code < 0x7f && c !== "\"" && c !== "\\") ? c : " ";
        }
        return out;
    }

    /**
     * Last resort when serializing the real response fails. Hand-builds a
     * minimal, provably well-formed error response so the caller learns
     * what happened immediately instead of waiting out its timeout —
     * which is the only thing it could do if we wrote nothing at all.
     */
    function writeFallbackResponse(why) {
        try {
            var phase = (response.phase === "execute") ? "execute" : "dispatch";
            var body = "{\"id\":\"" + jsonSafeAscii(requestId)
                + "\",\"ok\":false,\"phase\":\"" + phase
                + "\",\"result\":null,\"error\":\"" + jsonSafeAscii("could not write response: " + why)
                + "\",\"stack\":null,\"logs\":[]}";
            // Same verified write: a fallback that is itself cut off would
            // strand the caller just as the original would have.
            writeVerified(body);
        } catch (eFb) { /* nothing left to try; the caller will time out */ }
    }

    /**
     * Rewrite serialized JSON as pure ASCII: every character from 0x7f up
     * becomes a \uXXXX escape (in JSON output those only occur inside
     * strings, so the document means exactly the same thing).
     *
     * Two reasons, both about File.write. It cannot encode an unpaired
     * surrogate as UTF-8 — it stops there and leaves a cut-off file — and
     * After Effects produces such strings itself: "Create Shapes from Text"
     * names an emoji's vector group with half of its surrogate pair. And
     * with one byte per character, the size on disk can be checked against
     * the text (see writeVerified), which catches any other short write.
     */
    function asciiJson(text) {
        if (!/[^\x00-\x7e]/.test(text)) return text;
        var parts = [];
        var last = 0;
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (code < 0x7f) continue;
            var hex = code.toString(16);
            while (hex.length < 4) hex = "0" + hex;
            parts.push(text.substring(last, i));
            parts.push("\\u" + hex);
            last = i + 1;
        }
        parts.push(text.substring(last));
        return parts.join("");
    }

    /**
     * Write ASCII `text` to the tmp file and confirm all of it arrived.
     * Returns null on success, else why not. A file that is renamed into
     * place must be complete: the caller treats an unparseable response as
     * "still being written" and would poll it until its timeout.
     */
    function writeVerified(text) {
        var tmp = new File(tmpPath);
        tmp.encoding = "UTF-8";
        if (!tmp.open("w")) return "cannot open tmp response for write: " + tmp.error;
        var wrote = tmp.write(text);
        var writeError = tmp.error;
        tmp.close();
        var problem = null;
        if (!wrote) {
            problem = "write failed: " + writeError;
        } else if (tmp.length !== text.length) {
            problem = "short write: " + String(tmp.length) + " of " + String(text.length) + " bytes reached the disk";
        }
        if (problem !== null) {
            try { tmp.remove(); } catch (eRmTmp) { /* ignore */ }
            return problem;
        }
        promoteTmp(tmp);
        return null;
    }

    function writeResponse() {
        var why = null;
        try {
            why = writeVerified(asciiJson(JSON.stringify(response)));
        } catch (e) {
            why = describeError(e);
        }
        if (why !== null) {
            appendLog("FATAL: could not write response: " + why);
            writeFallbackResponse(why);
        }
    }

    // --- Read request (consume-on-read) --------------------------------
    var request = null;
    try {
        requestFile.encoding = "UTF-8";
        if (!requestFile.open("r")) {
            response.error = "cannot open " + requestName + ": " + requestFile.error;
            writeResponse();
            return;
        }
        var raw = requestFile.read();
        requestFile.close();
        // Consume so no other queued run can re-execute it. If the delete
        // fails we proceed anyway (degrades to the old behavior).
        try {
            if (!requestFile.remove()) appendLog("WARN: could not consume " + requestName);
        } catch (eRm2) {
            appendLog("WARN: consuming " + requestName + " threw: " + describeError(eRm2));
        }
        request = JSON.parse(raw);
    } catch (eReq) {
        response.error = "failed to read request: " + describeError(eReq);
        response.stack = errStack(eReq);
        writeResponse();
        return;
    }

    if (!request || typeof request.code !== "string") {
        response.error = "request missing `code` field";
        writeResponse();
        return;
    }
    if (request.id && String(request.id) !== requestId) {
        // Body and filename disagree — refuse rather than answer under an id
        // the caller is not polling for.
        response.error = "request id mismatch: filename says " + requestId + ", body says " + String(request.id);
        writeResponse();
        return;
    }

    // --- Execute user code, normally inside an undo group --------------
    // `undoGroup: false` marks a request that DRIVES the undo stack (Undo,
    // Redo) or crosses a project boundary (open, new). AE resolves Undo/Redo
    // against the group that is still open, so wrapping them reverts nothing
    // the caller asked for — such a request runs bare. A missing field means
    // the old contract: group it.
    var undoLabel = "mcp-aftereffects: " + (request.label || "action");
    var wantUndoGroup = (request.undoGroup !== false);
    // Dialog suppression is its OWN request field, not the undo-group
    // condition: project boundary requests run ungrouped yet are exactly the
    // calls most likely to pop a modal (missing footage/fonts on open), and
    // undo/redo now run suppressed too (an undo once raised an error box that
    // blocked all scripting). A missing field means the old contract:
    // suppress when grouping.
    var wantSuppress = (typeof request.suppressDialogs === "boolean") ? request.suppressDialogs : wantUndoGroup;
    // Roll back when the code throws (or asks to, see __mcp below). Only for
    // grouped requests, and only when the request says so explicitly: a
    // missing field is the old contract, where a failed call kept its changes.
    var wantRollback = wantUndoGroup && request.rollback === true;
    var sigBefore = wantRollback ? AE_MCP.projectSignature() : null;
    var undoOpen = false;
    var dialogsSuppressed = false;
    var ran = false;
    var threw = false;
    // `__mcp` is the code's handle on this request. requestRollback(why)
    // marks a request that RETURNED normally for rollback — batch.run with
    // stopOnError uses it to revert the whole batch while still returning
    // every child's result.
    var control = { rollbackRequested: null };
    var mcpHandle = {
        requestRollback: function (why) {
            control.rollbackRequested = (why === undefined || why === null) ? "requested by the code" : String(why);
        }
    };
    response.phase = "execute";
    try {
        if (wantSuppress) {
            // Suppress modal alerts for the duration of the request.
            // try/catch inside the executed code cannot stop everything:
            // project.open on an AEP with missing footage/fonts, or an
            // effect raising its own warning, pops a modal that blocks
            // every later `-r` launch until a human clicks OK. MUST be
            // undone in the finally below — left on, it would silently
            // eat dialogs for the user's whole session.
            try {
                app.beginSuppressDialogs();
                dialogsSuppressed = true;
            } catch (eSup) { /* unavailable — run with dialogs enabled */ }
        }

        if (wantUndoGroup) {
            app.beginUndoGroup(undoLabel);
            undoOpen = true;
        }

        // User code is a function body. Convention: `return <JSON-serializable>;`
        // `log(msg)` pushes breadcrumbs into response.logs; `payload` carries
        // bulk data that was NOT inlined into the source (see EvalRequest).
        // All parameters sit on new Function's header line, so the body's
        // line numbering is the same as before __mcp existed.
        var logs = response.logs;
        var fn = new Function(
            "app", "log", "payload", "__mcp",
            request.code
        );
        ran = true;
        var result = fn(
            app,
            function (msg) { logs.push(String(msg)); },
            (typeof request.payload === "undefined") ? null : request.payload,
            mcpHandle
        );

        response.result = (typeof result === "undefined") ? null : result;
        response.ok = true;
    } catch (eExec) {
        threw = true;
        response.ok = false;
        response.error = describeError(eExec);
        response.stack = errStack(eExec);
        try {
            if (eExec && eExec.line !== undefined && eExec.line !== null) response.line = Number(eExec.line);
        } catch (eLine) { /* line stays null */ }
    } finally {
        // A throw from new Function itself is a compile error: nothing ran,
        // so there is nothing to revert and no undo is issued.
        var needRollback = (threw && ran) || control.rollbackRequested !== null;
        var marker = null;
        if (undoOpen) {
            if (needRollback && wantRollback) marker = AE_MCP.addRollbackMarker(requestId);
            try { app.endUndoGroup(); } catch (eEnd) { /* ignore */ }
        }
        if (needRollback) {
            if (wantRollback && marker !== null) {
                response.rollback = AE_MCP.rollBack(marker, sigBefore, dialogsSuppressed);
            } else if (wantUndoGroup && request.rollback === false) {
                response.rollback = {
                    attempted: false, rolledBack: false, verified: "none",
                    reason: "rollback was turned off for this request",
                    left: AE_MCP.KEPT_AS_ONE_STEP, aeErrors: [], before: null, after: null
                };
            }
        } else if (threw && !ran && wantRollback) {
            response.rollback = {
                attempted: false, rolledBack: false, verified: "none",
                reason: "the code did not compile, so nothing ran and nothing needed reverting",
                left: null, aeErrors: [], before: null, after: null
            };
        }
        if (dialogsSuppressed) {
            // false: do NOT replay the suppressed alerts — that replay is
            // itself a modal, the exact thing being prevented. Whatever was
            // suppressed is already reported through response.error/logs.
            try { app.endSuppressDialogs(false); } catch (eEndSup) { /* ignore */ }
        }
    }

    writeResponse();
};
