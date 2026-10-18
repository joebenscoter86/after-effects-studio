function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function fail(id, field, reason) { throw new Error(`Module ${id}: ${field}: ${reason}`); }
function string(value, id, field) {
    if (typeof value !== 'string' || !value.trim())
        fail(id, field, 'expected nonempty string');
}
function strings(value, id, field) {
    if (!Array.isArray(value))
        fail(id, field, 'expected string array');
    value.forEach(v => string(v, id, field));
}
/** Only portable repository report paths or public HTTPS references are allowed. */
export function isReportReference(value) {
    if (value.startsWith('https://')) {
        try {
            const u = new URL(value);
            return !u.username && !u.password && u.hostname.includes('.') && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname);
        }
        catch {
            return false;
        }
    }
    return /^quality\/reports\/[a-zA-Z0-9._/-]+$/.test(value) && !value.split('/').some(p => !p || p === '.' || p === '..');
}
export function validateCatalog(raw, refs) {
    if (!object(raw) || raw.schemaVersion !== 1)
        fail('<catalog>', 'schemaVersion', 'expected 1');
    if (!Array.isArray(raw.modules))
        fail('<catalog>', 'modules', 'expected array');
    const ids = new Set();
    for (const item of raw.modules) {
        if (!object(item))
            fail('<unknown>', 'module', 'expected object');
        const id = typeof item.id === 'string' ? item.id : '<unknown>';
        for (const field of ['id', 'title', 'summary', 'entryDocument'])
            string(item[field], id, field);
        if (!/^[a-z][a-z0-9-]*$/.test(id))
            fail(id, 'id', 'expected lowercase hyphenated ID');
        if (ids.has(id))
            fail(id, 'id', 'duplicate ID');
        ids.add(id);
        if (typeof item.kind !== 'string' || !['foundation', 'capability', 'style'].includes(String(item.kind)))
            fail(id, 'kind', 'unknown enum');
        for (const field of ['tags', 'whenToUse', 'whenNotToUse', 'requires', 'documents', 'compatibleWith', 'assetRequirements', 'fontRequirements', 'fallbacks', 'examples', 'reviewChecks', 'provenanceRefs'])
            strings(item[field], id, field);
        if (!Array.isArray(item.inputs))
            fail(id, 'inputs', 'expected array');
        for (const input of item.inputs) {
            if (!object(input))
                fail(id, 'inputs', 'expected object');
            string(input.name, id, 'inputs.name');
            string(input.constraints, id, 'inputs.constraints');
            if (typeof input.required !== 'boolean')
                fail(id, 'inputs.required', 'expected boolean');
            if (input.default !== null && typeof input.default !== 'string')
                fail(id, 'inputs.default', 'expected string or null');
        }
        const e = item.evidence;
        if (!object(e))
            fail(id, 'evidence', 'expected object');
        if (typeof e.technical !== 'string' || !['not-tested', 'passed', 'failed'].includes(String(e.technical)))
            fail(id, 'evidence.technical', 'unknown enum');
        if (typeof e.visual !== 'string' || !['not-reviewed', 'accepted', 'revision-needed'].includes(String(e.visual)))
            fail(id, 'evidence.visual', 'unknown enum');
        strings(e.reports, id, 'evidence.reports');
        if ((e.technical !== 'not-tested' || e.visual !== 'not-reviewed') && !e.reports.length)
            fail(id, 'evidence.reports', 'tested or reviewed status requires evidence');
        for (const report of e.reports)
            if (!isReportReference(report))
                fail(id, 'evidence.reports', 'expected repository report path or public HTTPS URL');
    }
    const catalog = raw;
    for (const m of catalog.modules) {
        const check = (field, values, valid) => { for (const value of values)
            if (!valid.has(value))
                fail(m.id, field, `missing reference ${value}`); };
        check('entryDocument', [m.entryDocument], refs.documentIds);
        check('documents', m.documents, refs.documentIds);
        check('examples', m.examples, refs.documentIds);
        check('requires', m.requires, ids);
        check('compatibleWith', m.compatibleWith, ids);
        check('provenanceRefs', m.provenanceRefs, refs.provenanceIds);
    }
    const byId = new Map(catalog.modules.map(m => [m.id, m]));
    const visiting = new Set(), visited = new Set();
    function visit(id) {
        if (visiting.has(id))
            fail(id, 'requires', 'dependency cycle');
        if (visited.has(id))
            return;
        visiting.add(id);
        for (const dep of byId.get(id).requires)
            visit(dep);
        visiting.delete(id);
        visited.add(id);
    }
    for (const id of ids)
        visit(id);
    return catalog;
}
export function findModules(catalog, query) {
    const q = query?.trim().toLowerCase();
    return catalog.modules.filter(m => !q || [m.id, m.title, m.summary, ...m.tags].some(v => v.toLowerCase().includes(q)));
}
//# sourceMappingURL=library-modules.js.map