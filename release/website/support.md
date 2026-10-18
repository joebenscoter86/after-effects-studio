# After Effects Studio support

For ordinary support with the v0.2.0 Git release, use [repository Issues](https://github.com/joebenscoter86/after-effects-studio/issues).

Before reporting a problem, run `node scripts/doctor.mjs` from the installed plugin folder and read the [connection recovery guide](../../plugin/docs/connection-recovery.md). Doctor checks local prerequisites but cannot prove AE permissions or a live connection. If a write timed out, inspect the current AE project before trying it again; the operation may have completed.

For a useful report, include the plugin version, macOS version, AE version, Node version, the requested action, the exact error text, and whether the current project was saved or unsaved. Include the smallest reproducible steps and what you observed in AE after the error. Do not post private project files, credentials, client artwork or personal paths in a public issue. Redact logs before sharing them. Public support does not require uploading your AE project.

Joe Benscoter triages reports for publisher JB Technology LLC through the `joebenscoter86` repository account. No response-time commitment is promised. For security or privacy incidents, use [GitHub private vulnerability reporting](https://github.com/joebenscoter86/after-effects-studio/security/advisories/new). Use that private route for correction or deletion requests concerning information you supplied; a maintainer can remove copies under their control, while GitHub's own retention follows its policies.
