// Browser stand-in for the Firebase compat SDK, served at /__/firebase/ during e2e tests.
(function () {
  // ?as=<email> starts signed in as that account; ?signedout starts at the login form.
  // The test password for the owner account is "test-pass".
  const q = new URLSearchParams(location.search);
  let user = q.has("signedout") ? null : { email: q.get("as") || "premganesh2655@gmail.com" }, authCbs = [];
  const es = new EventSource("/db/events"), subs = [];
  es.onmessage = e => { const cols = JSON.parse(e.data); subs.forEach(s => cols.includes(s.col) && s.refresh()); };
  function query(col, order, lim) {
    return {
      orderBy: (f, dir) => query(col, [f, dir], lim), limit: n => query(col, order, n),
      onSnapshot(cb) {
        const refresh = async () => {
          let rows = Object.entries(await (await fetch("/db/col/" + col)).json());
          if (order) rows.sort((a, b) => String(b[1][order[0]]).localeCompare(String(a[1][order[0]])));
          if (lim) rows = rows.slice(0, lim);
          cb({ forEach: fn => rows.forEach(([id, d]) => fn({ id, data: () => d })) });
        };
        subs.push({ col, refresh }); refresh();
        return () => {};
      },
    };
  }
  const fs = {
    collection: col => Object.assign(query(col), { doc: id => ({ col, id, set: (doc, opt) => fetch("/db/batch", { method: "POST", body: JSON.stringify([{ col, id, doc, merge: !!(opt && opt.merge) }]) }) }) }),
    batch() { const ops = []; return { set: (r, doc, opt) => ops.push({ col: r.col, id: r.id, doc, merge: !!(opt && opt.merge) }), commit: () => fetch("/db/batch", { method: "POST", body: JSON.stringify(ops) }) }; },
  };
  const auth = {
    onAuthStateChanged(cb) { authCbs.push(cb); setTimeout(() => cb(user), 0); },
    signOut() { user = null; authCbs.forEach(cb => cb(null)); return Promise.resolve(); },
    signInWithEmailAndPassword(email, pw) {
      if (email !== "premganesh2655@gmail.com" || pw !== "test-pass") return Promise.reject({ code: "auth/invalid-credential" });
      user = { email }; authCbs.forEach(cb => cb(user)); return Promise.resolve({ user });
    },
  };
  auth.GoogleAuthProvider = function () {};
  window.firebase = { apps: [{}], auth: Object.assign(() => auth, { GoogleAuthProvider: function () {} }), firestore: () => fs };
})();
