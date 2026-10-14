// Firestore-shaped client for the e2e stand-in database (used by the MCP server when PREMOS_TEST_DB is set).
export function httpDb(base) {
  const post = ops => fetch(`${base}/db/batch`, { method: "POST", body: JSON.stringify(ops) });
  const getCol = async col => (await fetch(`${base}/db/col/${encodeURIComponent(col)}`)).json();
  const ref = (col, id) => ({
    col, id,
    set: (doc, opt) => post([{ col, id, doc, merge: !!opt?.merge }]),
    get: async () => { const all = await getCol(col); return { exists: id in all, data: () => all[id] }; },
  });
  return {
    collection: col => ({
      doc: id => ref(col, id),
      get: async () => { const all = await getCol(col); return { forEach: fn => Object.entries(all).forEach(([id, d]) => fn({ id, data: () => d })) }; },
    }),
    batch: () => { const ops = []; return { set: (r, doc, opt) => ops.push({ col: r.col, id: r.id, doc, merge: !!opt?.merge }), commit: () => post(ops) }; },
  };
}
