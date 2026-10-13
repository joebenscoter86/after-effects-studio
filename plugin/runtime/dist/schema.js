// TypeScript types for the AE project export JSON schema produced by
// `ae_project_export_json` and consumed by `ae_project_import_json`. Keeping
// these in a single file lets both the Node-side validator and any future
// agent-side code share the shape without drift.
//
// Schema version: 2
//
// Versioning policy: breaking schema changes bump SCHEMA_VERSION. The import
// loader will refuse documents with a schemaVersion higher than the runtime
// version it understands; lower versions are read best-effort.
export const SCHEMA_VERSION = 2;
//# sourceMappingURL=schema.js.map