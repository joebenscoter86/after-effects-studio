# Motion module authoring contract

Register a module only when its entry document and supporting files exist in the bundle. Use foundation, typography or paper-collage IDs for the approved modules. Keep a capability distinct from a visual style: the foundation applies throughout; capabilities describe tasks; styles describe appearance and material behavior.

For each modules.json entry provide id, kind (foundation/capability/style), title, summary, tags, whenToUse, whenNotToUse, entryDocument, requires, documents, compatibleWith, inputs, assetRequirements, fontRequirements, fallbacks, examples, reviewChecks, provenanceRefs and evidence. inputs contain name, required boolean, default string/null and constraints. Document and example references are manifest document IDs; dependencies and compatibility use module IDs; provenance uses stable source-map.sources IDs. No dangling references or dependency cycles.

Evidence contains technical (not-tested/passed/failed), visual (not-reviewed/accepted/revision-needed) and reports. Tested or reviewed states require report references: quality/reports/... repository paths or public HTTPS URLs. Describe scope and limitations in those reports. Sampled frame acceptance does not imply full-speed review, user approval or release authorization. Installed packages need not carry private repository reports; bundled example documentation must resolve.

Keep summaries concise for discovery. Put procedures and native scope in supporting documents. Run the package validator after updating the manifest; use its explicit repository mode when checking local report existence. Keep historical provenance and third-party notices intact.
