import { __esmMin } from "../chunks/rolldown-runtime.js";
import { $ZodObject, $ZodType, clone, init_parse, init_schemas as init_schemas$1, init_util, installLazyProp, normalizeParams, own, parse, parseAsync, safeParse, safeParseAsync } from "./zod-3.js";
import { $constructor, init_core } from "./zod-2.js";

// node_modules/zod/v4/mini/schemas.js
// @__NO_SIDE_EFFECTS__
function object(shape, params) {
	const def = {
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	};
	return new ZodMiniObject(def);
}
var ZodMiniType, ZodMiniObject;
function init_schemas() {
	return (init_schemas = __esmMin((() => {
		init_core(), init_schemas$1(), init_util();
		init_parse();
		ZodMiniType = /*@__PURE__*/ $constructor("ZodMiniType", (inst, def) => {
			if (!inst._zod) throw new Error("Uninitialized schema in ZodMiniType.");
			$ZodType.init(inst, def);
			inst.def = def;
			inst.type = def.type;
		}, {
			get with() {
				return this.check;
			},
			set with(value) {
				own(this, "with", value);
			},
			parse(data, params) {
				return parse(this, data, params, { callee: this.parse });
			},
			parseAsync(data, params) {
				return parseAsync(this, data, params, { callee: this.parseAsync });
			},
			safeParse(data, params) {
				return safeParse(this, data, params);
			},
			safeParseAsync(data, params) {
				return safeParseAsync(this, data, params);
			},
			check(...checks) {
				const def = this.def;
				return this.clone({
					...def,
					checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
						check: ch,
						def: { check: "custom" },
						onattach: []
					} } : ch)]
				}, { parent: true });
			},
			clone(_def, params) {
				return clone(this, _def, params);
			},
			brand() {
				return this;
			},
			register(reg, meta) {
				reg.add(this, meta);
				return this;
			},
			apply(fn, ...args) {
				return args.length === 0 ? fn(this) : fn(this, ...args);
			}
		});
		ZodMiniObject = /*@__PURE__*/ $constructor("ZodMiniObject", (inst, def) => {
			$ZodObject.init(inst, def);
			ZodMiniType.init(inst, def);
			installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
		});
	})))();
}

export { init_schemas, object };