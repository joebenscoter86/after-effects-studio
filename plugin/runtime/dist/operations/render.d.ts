/**
 * Said by every operation that changes the render queue (stage 7). serve.jsx
 * enforces it; this tells the caller before they find out by a refusal.
 */
export declare const RENDER_QUEUE_UNDO_WARNING = " After this, undo and rollback are refused for the rest of the After Effects session unless acceptRenderQueueRisk: true: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save the project before undoing anything afterwards; project.open / project.new clear the block.";
/** Said on every render.preview answer and on a list that used a temporary item. */
export declare const QUEUE_CHANGE_NOTE = "the project is left modified (unsaved): a render-queue item was added and removed. Nothing in the comps changed; save or revert as you normally would";
export declare const PARK_QUEUE_FN = "\n    function _parkQueue(rq) {\n        var _parked = [];\n        for (var _pi = 1; _pi <= rq.numItems; _pi++) {\n            var _ex = rq.item(_pi);\n            var _was = false;\n            try { _was = _ex.render; } catch (eR) {}\n            _parked.push(_was);\n            if (_was) { try { _ex.render = false; } catch (eP) {} }\n        }\n        return _parked;\n    }\n    function _unparkQueue(rq, _parked) {\n        for (var _ui = 0; _ui < _parked.length && _ui < rq.numItems; _ui++) {\n            if (_parked[_ui]) { try { rq.item(_ui + 1).render = true; } catch (eU) {} }\n        }\n    }\n";
//# sourceMappingURL=render.d.ts.map