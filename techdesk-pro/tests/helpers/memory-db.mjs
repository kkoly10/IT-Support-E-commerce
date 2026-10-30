import { isDeepStrictEqual } from 'node:util'

// A small stateful PostgREST boundary double. Assertions below cover the
// authorization and recovery outcomes, including persisted state after failure.
export function database(seed = {}) {
  const tables = Object.fromEntries(['profiles', 'organizations', 'organization_contacts', 'assessment_submissions'].map((name) => [name, structuredClone(seed[name] || [])]))
  const writes = []
  const failures = []
  const updateHooks = []
  return {
    tables, writes,
    beforeNextUpdate(fn) { updateHooks.push(fn) },
    failNext(table, action) { failures.push({ table, action }) },
    from(table) {
      let action = 'select', values, options = {}, single = false, result
      const filters = []
      const query = {
        select() { return query },
        eq(key, value) { filters.push((row) => key === 'discovery_profile' && typeof value === 'string' ? isDeepStrictEqual(row[key], JSON.parse(value)) : row[key] === value); return query },
        is(key, value) { filters.push((row) => (row[key] ?? null) === value); return query },
        upsert(payload, opts) { action = 'upsert'; values = payload; options = opts; return query },
        update(payload) { action = 'update'; values = payload; return query },
        maybeSingle() { single = true; return query },
        single() { single = true; return query },
        then(resolve, reject) {
          if (!result) {
            const failure = failures.findIndex((entry) => entry.table === table && entry.action === action)
            if (failure !== -1) {
              failures.splice(failure, 1)
              result = { data: null, error: { code: 'TEST_FAILURE' } }
            } else {
              if (action === 'update' && updateHooks.length) updateHooks.shift()(tables)
              let matches = tables[table].filter((row) => filters.every((filter) => filter(row)))
              if (action === 'upsert') {
                writes.push({ table, action, values: structuredClone(values) })
                const existing = tables[table].find((row) => row.id === values.id)
                if (!existing) {
                  if (table === 'organization_contacts' && values.is_primary_contact && tables[table].some((row) => row.organization_id === values.organization_id && row.is_primary_contact)) {
                    result = { data: null, error: { code: '23505' } }
                  } else {
                    const inserted = structuredClone(values)
                    tables[table].push(inserted)
                    matches = [inserted]
                  }
                } else {
                  if (!options.ignoreDuplicates) Object.assign(existing, structuredClone(values))
                  matches = [existing]
                }
              } else if (action === 'update') {
                writes.push({ table, action, values: structuredClone(values) })
                for (const row of matches) Object.assign(row, structuredClone(values))
              }
              result ||= { data: structuredClone(single ? matches[0] || null : matches), error: null }
            }
          }
          return Promise.resolve(result).then(resolve, reject)
        },
      }
      return query
    },
  }
}

