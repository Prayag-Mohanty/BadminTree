(function () {
  "use strict";

  const DATA = window.TEAM_DATA || { batches: {} };
  // Nickname lists edited from the site (data/nicknames.js). Anyone listed
  // there uses that list instead of the nicknames in data/team.js.
  const NICKNAMES = window.NICKNAMES || {};
  const nicknamesFor = (id, base) => (Array.isArray(NICKNAMES[id]) ? NICKNAMES[id] : base);
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const short = (y) => (y ? "'" + String(y).slice(2) : "?");

  const AVATAR_COLORS = ["#d7263d", "#1f4fd6", "#3b5199", "#b8860b", "#8a1c2c", "#2f6fe0"];
  const colorFor = (id) => {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };

  // ---------- Normalise data ----------
  const players = [];
  const byId = new Map();
  const years = Object.keys(DATA.batches || {}).map(Number).sort((a, b) => b - a);
  const addPlayer = (raw, year) => {
    if (!raw || !raw.name) return;
    let id = raw.id || slug(raw.name);
    if (byId.has(id)) id = `${id}-${year}`;
    const nicknames = nicknamesFor(id, raw.nicknames || (raw.nickname ? [raw.nickname] : []));
    const p = { ...raw, id, year, nicknames, roles: raw.roles || [], interIIT: raw.interIIT || [] };
    players.push(p);
    byId.set(id, p);
  };
  for (const year of years) (DATA.batches[year] || []).forEach((raw) => addPlayer(raw, year));
  (DATA.yearUnknown || []).forEach((raw) => addPlayer(raw, null));

  // Secretary / convenor terms become roles on each person's card, newest first.
  const leadership = [...(DATA.leadership || [])].sort((a, b) => String(b.year).localeCompare(String(a.year)));
  const leadRoles = new Map();
  leadership.forEach((l) => {
    (l.secretary || []).forEach((id) => leadRoles.set(id, [...(leadRoles.get(id) || []), `Institute Badminton Secretary ${l.year}`]));
    (l.convenors || []).forEach((id) => leadRoles.set(id, [...(leadRoles.get(id) || []), `Badminton Convenor ${l.year}`]));
  });
  players.forEach((p) => (p.roles = [...(leadRoles.get(p.id) || []), ...p.roles]));
  // Coaches get cards too (but no place on the tree).
  (DATA.family || []).forEach((f) => {
    const id = f.id || slug(f.name);
    if (!byId.has(id)) byId.set(id, { ...f, id, coach: true, year: null, nicknames: nicknamesFor(id, f.nicknames || []), roles: [f.role].filter(Boolean), interIIT: [] });
  });
  const batchKeys = [...years, ...((DATA.yearUnknown || []).length ? [null] : [])];

  const meets = [...(DATA.interIITMeets || [])].sort((a, b) => b.year - a.year);
  const meetFor = (year) => meets.find((m) => m.year === year) || { year };
  const PLACE = { 1: "Winner", 2: "Runner-up", 3: "Third", 4: "Fourth", award: "Award" };
  // Every result, with the player resolved where the name matches someone on the tree.
  const eventYear = (ev) => ev.yearLabel || ev.year || "";
  const results = (DATA.events || []).flatMap((ev) =>
    (ev.results || []).map((r) => ({
      ...r,
      ev,
      whoList: [].concat(r.who || []), // a name, or a pair for doubles / co-leads
      members: r.members || [],
    }))
  );
  const resultsOf = (id) => results.filter((r) => r.whoList.includes(id) || r.members.includes(id));
  const placeLabel = (r) => r.label || PLACE[r.place] || String(r.place || "");
  const menteesOf = (id) => players.filter((p) => p.mentor === id);

  // ---------- Avatars ----------
  // Photos load automatically from photos/<id>.jpg (or .jpeg/.png/.webp).
  // A `photo` field in the data overrides that. No photo -> initials.
  const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp"];
  window.__nextPhoto = function (img) {
    const i = Number(img.dataset.i || 0) + 1;
    if (img.dataset.fixed || i >= PHOTO_EXTS.length) return img.remove();
    img.dataset.i = i;
    img.src = `photos/${img.dataset.id}.${PHOTO_EXTS[i]}`;
  };
  const avatar = (p, big) => {
    const id = p.id || slug(p.name);
    const src = p.photo || `photos/${id}.${PHOTO_EXTS[0]}`;
    return `<span class="avatar${big ? " lg" : ""}" data-avatar="${esc(id)}" style="background:${colorFor(id)}" aria-hidden="true">${esc(initials(p.name))}<img src="${esc(src)}" alt="" loading="lazy" data-id="${esc(id)}"${p.photo ? ' data-fixed="1"' : ""} onerror="__nextPhoto(this)"></span>`;
  };

  // ---------- Stats ----------
  document.getElementById("stats").innerHTML = [
    `<span><b>${players.length}</b> players</span>`,
    `<span><b>${years.length}</b> batches</span>`,
    `<span><b>${players.filter((p) => p.interIIT.length).length}</b> Inter IIT players</span>`,
    years.length ? `<span>since <b>${years[years.length - 1]}</b></span>` : "",
  ].join("");

  // ---------- Tree ----------
  const tree = document.getElementById("tree");
  let query = "";
  let squad = "all"; // "all", "interiit" or a meet year
  let firstRender = true;

  function renderTree() {
    const q = query.trim().toLowerCase();
    const inSquad = (p) =>
      squad === "all" || (squad === "interiit" ? p.interIIT.length > 0 : p.interIIT.some((t) => String(t.year) === squad));
    const match = (p) =>
      inSquad(p) && (!q || [p.name, ...p.nicknames, p.program, p.hostel, p.year, ...p.roles].join(" ").toLowerCase().includes(q));

    let html = `<svg class="tree-svg" aria-hidden="true"></svg>`;
    let shown = 0;
    let i = 0;
    for (const year of batchKeys) {
      const visible = players.filter((p) => p.year === year && match(p));
      if (!visible.length) continue;
      shown += visible.length;
      html += `
        <section class="batch ${i++ % 2 ? "blue" : "red"}" aria-label="${year ? "Joined IIT Bombay in " + year : "Joining year not known"}">
          <div class="batch-badge" title="${year ? "Joined IIT Bombay in " + year : "Joining year not known yet"}">${year ? short(year) : "?"}</div>
          <div class="leaves">
            ${visible
              .map(
                (p) => `<button class="leaf${p.interIIT.length ? " iit" : ""}" type="button" data-id="${p.id}">${avatar(p)}<span class="name">${esc(p.shortName || p.name.split(" ")[0])}${p.nicknames.length ? `<span class="nick">${esc(p.nicknames.join(" · "))}</span>` : ""}</span></button>`
              )
              .join("")}
          </div>
        </section>`;
    }
    if (!shown) html += `<p class="no-results">Nobody matches that.</p>`;
    tree.innerHTML = html;
    tree.classList.toggle("grow", firstRender && !reduceMotion);
    drawTree(firstRender && !reduceMotion);
    if (firstRender) setTimeout(() => tree.classList.remove("grow"), 4000);
    firstRender = false;
  }

  // Draws the trunk, roots and branches as SVG behind the HTML leaves.
  let trunkPath = null;
  function drawTree(animate) {
    const svg = tree.querySelector(".tree-svg");
    if (!svg) return;
    const box = tree.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = "";
    trunkPath = null;

    const batches = [...tree.querySelectorAll(".batch")];
    if (!batches.length) return;
    // Layout position relative to the tree, ignoring the pop-in transforms.
    const rel = (el) => {
      let x = 0, y = 0, n = el;
      while (n && n !== tree) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    };
    const narrow = box.width < 720;
    const sway = narrow ? 10 : 46;

    // Trunk: from the roots (bottom) up through every batch badge to the crown.
    const nodes = batches
      .map((b) => {
        const r = rel(b.querySelector(".batch-badge"));
        return { el: b, x: r.x + r.w / 2, y: r.y + r.h / 2 };
      })
      .reverse();
    const base = { x: nodes[0].x, y: box.height - 20 };
    const top = { x: nodes[nodes.length - 1].x, y: 6 };
    const pts = [base, ...nodes, top];
    let d = `M${base.x},${base.y}`;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      const dy = b.y - a.y;
      const s = k % 2 ? 1 : -1;
      d += ` C${a.x + s * sway},${a.y + dy / 3} ${b.x - s * sway},${b.y - dy / 3} ${b.x},${b.y}`;
    }

    const H = box.height;
    const TRUNK_TIME = 1.5;
    const reach = (y) => TRUNK_TIME * (1 - y / H); // when the growing trunk reaches height y

    const add = (tag, attrs, parent = svg) => {
      const el = document.createElementNS(SVGNS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      parent.appendChild(el);
      return el;
    };

    // Roots
    const spread = narrow ? [-22, 26, 40] : [-70, -34, 38, 76];
    spread.forEach((dx, n) =>
      add("path", {
        class: "root",
        pathLength: 1,
        d: `M${base.x},${base.y - 10} C${base.x + dx * 0.2},${base.y + 6} ${base.x + dx * 0.7},${base.y + 4} ${base.x + dx},${base.y + 18 + (n % 2) * 8}`,
        style: `--d:${0.05 * n}s;--dur:0.5s`,
      })
    );

    // Branches (drawn before the trunk so the trunk sits on top of them)
    const branchLayer = add("g", {});
    batches.forEach((b) => {
      const node = nodes.find((n) => n.el === b);
      const color = b.classList.contains("blue") ? "blue" : "red";
      const start = reach(node.y);
      b.querySelector(".batch-badge").style.setProperty("--d", `${start}s`);
      // One branch per row of leaves, reaching the card nearest the trunk.
      const rows = new Map();
      [...b.querySelectorAll(".leaf")].forEach((leaf) => {
        const r = rel(leaf);
        const key = Math.round(r.y / 8);
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push({ leaf, r });
      });
      [...rows.values()].forEach((row, j) => {
        const onRight = row[0].r.x > node.x;
        const near = row.reduce((a, c) => (Math.abs(c.r.x + c.r.w / 2 - node.x) < Math.abs(a.r.x + a.r.w / 2 - node.x) ? c : a));
        const ax = onRight ? near.r.x + 22 : near.r.x + near.r.w - 22;
        const ay = near.r.y + near.r.h / 2;
        let path;
        if (narrow && ay > node.y + 30) {
          // A stem runs down beside the leaves and curls into each row.
          const sx = near.r.x - 12;
          path = `M${node.x},${node.y} C${node.x + 20},${node.y} ${sx},${node.y + 4} ${sx},${node.y + 18} L${sx},${ay - 12} Q${sx},${ay} ${sx + 12},${ay} L${ax},${ay}`;
        } else {
          const dx = ax - node.x;
          const lift = Math.min(36, Math.abs(ay - node.y) * 0.3 + 12);
          path = `M${node.x},${node.y} C${node.x + dx * 0.45},${node.y - lift} ${ax - dx * 0.35},${ay} ${ax},${ay}`;
        }
        add("path", {
          class: `branch ${color}`,
          pathLength: 1,
          "data-ids": row.map((c) => c.leaf.dataset.id).join(" "),
          d: path,
          style: `--d:${start + 0.1 + j * 0.08}s;--dur:0.55s`,
        }, branchLayer);
        row.forEach((c, k) => c.leaf.style.setProperty("--d", `${start + 0.4 + j * 0.08 + k * 0.06}s`));
      });
    });

    trunkPath = add("path", { class: "trunk", pathLength: 1, d, style: `--d:0s;--dur:${TRUNK_TIME}s` });
    add("path", { class: "trunk-line", d, style: `--d:${TRUNK_TIME}s` });

    // The shuttle that drops down the trunk as you scroll.
    const g = add("g", { class: "shuttle" });
    add("path", { class: "skirt", d: "M-9,-24 L9,-24 L4.5,-4 L-4.5,-4 Z" }, g);
    add("line", { class: "rib", x1: -3, y1: -24, x2: -1.5, y2: -4 }, g);
    add("line", { class: "rib", x1: 3, y1: -24, x2: 1.5, y2: -4 }, g);
    add("circle", { class: "cork", cx: 0, cy: 0, r: 6 }, g);
    shuttle = g;
    placeShuttle();

    if (!animate) tree.classList.remove("grow");
  }

  // ---------- Shuttle follows scroll ----------
  let shuttle = null;
  function placeShuttle() {
    if (!shuttle || !trunkPath) return;
    const r = tree.getBoundingClientRect();
    const focus = window.innerHeight * 0.45;
    const t = Math.min(1, Math.max(0, (focus - r.top) / r.height)); // 0 at top of tree, 1 at bottom
    const len = trunkPath.getTotalLength();
    const at = len * (1 - t);
    const p = trunkPath.getPointAtLength(at);
    const q = trunkPath.getPointAtLength(Math.max(0, at - 2));
    const angle = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI + 90;
    shuttle.setAttribute("transform", `translate(${p.x},${p.y}) rotate(${angle.toFixed(1)})`);
  }
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        placeShuttle();
        ticking = false;
      });
    },
    { passive: true }
  );

  // Redraw when the layout changes (resize, fonts arriving, photos loading).
  let redrawQueued = false;
  const redraw = () => {
    if (redrawQueued) return;
    redrawQueued = true;
    requestAnimationFrame(() => {
      redrawQueued = false;
      drawTree(tree.classList.contains("grow"));
    });
  };
  let lastWidth = 0;
  new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    if (Math.abs(w - lastWidth) > 1) {
      lastWidth = w;
      redraw();
    }
  }).observe(tree);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

  const chips = document.getElementById("chips");
  chips.innerHTML = [
    ["all", "Everyone"],
    ["interiit", "Inter IIT players"],
    // One button per Inter IIT year, but only for years with a squad on the tree.
    ...meets
      .filter((m) => players.some((p) => p.interIIT.some((t) => t.year === m.year)))
      .map((m) => [String(m.year), `Inter IIT ${m.year}`]),
  ]
    .map(([v, label]) => `<button class="chip" type="button" data-squad="${v}" aria-pressed="${v === squad}">${esc(label)}</button>`)
    .join("");
  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-squad]");
    if (!btn) return;
    squad = btn.dataset.squad;
    chips.querySelectorAll("[data-squad]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderTree();
  });

  document.getElementById("search").addEventListener("input", (e) => {
    query = e.target.value;
    renderTree();
  });

  // Hover: light up the player's branch, their mentor and their mentees.
  const clearHot = () => {
    tree.querySelectorAll(".lineage").forEach((l) => l.classList.remove("lineage"));
    tree.querySelectorAll(".branch.hot").forEach((b) => b.classList.remove("hot"));
  };
  tree.addEventListener("mouseover", (e) => {
    const leaf = e.target.closest(".leaf");
    clearHot();
    if (!leaf) return;
    const p = byId.get(leaf.dataset.id);
    tree.querySelector(`.branch[data-ids~="${p.id}"]`)?.classList.add("hot");
    [p.mentor, ...menteesOf(p.id).map((m) => m.id)]
      .filter(Boolean)
      .forEach((id) => tree.querySelector(`.leaf[data-id="${id}"]`)?.classList.add("lineage"));
  });
  tree.addEventListener("mouseleave", clearHot);
  tree.addEventListener("click", (e) => {
    const leaf = e.target.closest(".leaf");
    if (leaf) openPlayer(leaf.dataset.id);
  });

  // ---------- Player drawer ----------
  const drawer = document.getElementById("drawer");
  const scrim = document.getElementById("scrim");
  let lastFocus = null;
  let openId = null;
  let currentTab = "tree";

  const personChips = (list) =>
    `<div class="people">${list.map((p) => `<button type="button" data-open="${p.id}">${esc(p.name)}${p.year ? " · " + short(p.year) : ""}</button>`).join("")}</div>`;

  const medal = (place) => `<span class="medal m${esc(place)}" aria-hidden="true"></span>`;

  // Tiny markdown: paragraphs, **bold**, *italic*.
  const md = (text) =>
    text
      .trim()
      .split(/\n\s*\n/)
      .map((para) => `<p>${esc(para).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/\n/g, "<br>")}</p>`)
      .join("");

  const gh = DATA.github || {};
  let currentStory = null; // story text of the open card, as loaded

  // Shown when someone's lore hasn't been written. Each person always gets the same line.
  const NO_LORE = [
    (n) => `${n} has some interesting canon lore. We just haven't written it yet. You can, if you want.`,
    (n) => `${n}'s lore exists. It just hasn't made it onto the page yet. Care to do the honours?`,
    (n) => `Legend says ${n} has lore. Nobody has written it down yet. Could be you.`,
    (n) => `${n}'s lore is still unwritten. If you know the tales, this is your cue.`,
    (n) => `The canon lore of ${n} lives somewhere in the team chat. Help get it on here.`,
    (n) => `${n}'s lore is loading… forever, unless someone writes it. That someone could be you.`,
  ];
  // Shown under lore that's already written, inviting more.
  const MORE_LORE = [
    (n) => `Know a ${n} story that isn't here? The lore can always grow.`,
    (n) => `There's surely more to ${n} than this. Add a chapter.`,
    (n) => `Got a match, a moment or a legend about ${n}? Add it to the lore.`,
    (n) => `${n}'s lore is canon, but not complete. Your turn.`,
  ];

  // Lines rotate in tree order, so neighbours on the tree read differently.
  const loreOrder = [...byId.keys()];
  const noLoreLine = (p, first) => NO_LORE[Math.max(0, loreOrder.indexOf(p.id)) % NO_LORE.length](first);
  const moreLoreLine = (p, first) => MORE_LORE[Math.max(0, loreOrder.indexOf(p.id)) % MORE_LORE.length](first);

  function renderStory(p, text) {
    const box = drawer.querySelector(".story");
    if (!box) return;
    const first = esc(p.name.split(" ")[0]);
    box.innerHTML = text
      ? `${md(text)}${
          EDIT_API
            ? `<p class="hint lore-more">${moreLoreLine(p, first)}</p><button type="button" class="story-write" data-edit>Add to ${first}'s lore</button>`
            : ""
        }`
      : `<p class="hint">${noLoreLine(p, first)}</p>${EDIT_API ? `<button type="button" class="story-write" data-edit>Write ${first}'s lore</button>` : ""}`;
  }

  async function loadStory(p) {
    let text = null;
    try {
      const res = await fetch(`stories/${p.id}.md`, { cache: "no-cache" });
      if (res.ok) text = await res.text();
    } catch (_) {}
    if (openId !== p.id) return; // another card was opened meanwhile
    currentStory = text;
    renderStory(p, text);
  }

  // ---------- Editing on the site ----------
  // Edits go to a small save function (api/save.js, hosted on Vercel) that
  // writes to the GitHub repo with its own token. Visitors need no account.
  // On the Vercel site it's same-origin; elsewhere set `editApi` in data/team.js.
  const BRANCH = gh.branch || "main";
  const onGithubPages = /\.github\.io$/.test(location.hostname);
  const EDIT_API = gh.editApi || (onGithubPages || location.protocol === "file:" ? "" : "api/save");
  const PASS_KEY = "badmintree-passcode";
  const getPass = () => { try { return localStorage.getItem(PASS_KEY) || ""; } catch (_) { return ""; } };
  const setPass = (t) => { try { t ? localStorage.setItem(PASS_KEY, t) : localStorage.removeItem(PASS_KEY); } catch (_) {} };
  let needsPasscode = null; // unknown until the save function tells us

  async function checkEditApi() {
    if (!EDIT_API || needsPasscode !== null) return;
    try {
      const r = await fetch(EDIT_API, { cache: "no-store" });
      if (r.ok) needsPasscode = !!(await r.json()).passcode;
    } catch (_) {}
  }

  async function saveToSite(payload) {
    let res;
    try {
      res = await fetch(EDIT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, passcode: getPass() }),
      });
    } catch (_) {
      throw new Error("Couldn't reach the site. Check your connection and press Save again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(data.error || "The save didn't go through. Try again in a minute.");
      e.passcode = !!data.passcode;
      throw e;
    }
    return data;
  }

  // Public read-only GitHub API, used to list gallery photos.
  const ghFetch = (path) => fetch(`https://api.github.com/repos/${gh.repo}/${path}`, { headers: { Accept: "application/vnd.github+json" } });

  // Reads an image file, optionally crops it square, shrinks it and re-encodes as JPEG.
  async function toJpeg(file, { square = false, max = 1600, quality = 0.84 } = {}) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error(`"${file.name}" isn't an image this browser can open. Try a JPG or PNG.`));
        i.src = url;
      });
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (square) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
      const scale = Math.min(1, max / Math.max(sw, sh));
      const c = document.createElement("canvas");
      c.width = Math.round(sw * scale);
      c.height = Math.round(sh * scale);
      c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/jpeg", quality);
      return { dataUrl, b64: dataUrl.split(",")[1] };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const nickRow = (n) =>
    `<div class="ed-nick-row"><input type="text" maxlength="40" autocomplete="off" aria-label="Nickname" value="${esc(n)}" placeholder="e.g. Net Ninja"><button type="button" class="ed-nick-rm" aria-label="Remove nickname">✕</button></div>`;
  const nickLine = (p) => (p.nicknames.length ? `aka ${p.nicknames.map((n) => `“${esc(n)}”`).join(", ")}` : "");
  // Refresh a person's nicknames on the open card and on the tree.
  function showNicknames(p) {
    const el = drawer.querySelector(".nick");
    if (el) { el.innerHTML = nickLine(p); el.hidden = !p.nicknames.length; }
    const leafName = tree.querySelector(`.leaf[data-id="${p.id}"] .name`);
    if (leafName) {
      let tag = leafName.querySelector(".nick");
      if (!tag) { tag = document.createElement("span"); tag.className = "nick"; leafName.appendChild(tag); }
      tag.textContent = p.nicknames.join(" · ");
      tag.hidden = !p.nicknames.length;
    }
  }

  async function openEditor(p) {
    const slot = drawer.querySelector(".editor-slot");
    if (!slot || !EDIT_API) return;
    await checkEditApi();
    const first = esc(p.name.split(" ")[0]);
    const askPass = needsPasscode && !getPass();
    slot.innerHTML = `<form class="editor" novalidate>
      <h4>Edit ${first}'s profile</h4>
      ${
        askPass
          ? `<label class="ed-label" for="ed-pass">Team passcode</label>
             <input id="ed-pass" type="password" autocomplete="off" spellcheck="false">
             <p class="ed-help">Ask in the team group. You only need to enter it once on this device.</p>`
          : ""
      }
      <span class="ed-label" id="ed-nick-label">Nicknames</span>
      <div class="ed-nicks" role="group" aria-labelledby="ed-nick-label">${p.nicknames.map(nickRow).join("")}</div>
      <button type="button" class="ed-nick-add">+ Add a nickname</button>
      <p class="ed-help">Edit any nickname in place, or press ✕ to remove it.</p>
      <label class="ed-label" for="ed-photo">Profile photo</label>
      <div class="ed-photo-row">${avatar(p)}<input id="ed-photo" type="file" accept="image/*"></div>
      <p class="ed-help">Cropped to a square from the centre, so a face in the middle works best.</p>
      <label class="ed-label" for="ed-story">Lore</label>
      <textarea id="ed-story" rows="9" placeholder="Who are they on court and off it? The matches, the moments, the legends the team still talks about.">${esc(currentStory || "")}</textarea>
      <p class="ed-help">Leave a blank line between paragraphs. *italics* and **bold** work.</p>
      <label class="ed-label" for="ed-gallery">Add photos to ${first}'s gallery</label>
      <input id="ed-gallery" type="file" accept="image/*" multiple>
      <div class="ed-actions">
        <button type="submit" class="ed-save">Save</button>
        <button type="button" class="ed-cancel">Cancel</button>
      </div>
      <p class="ed-status" role="status"></p>
    </form>`;
    const form = slot.querySelector("form");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    const nickList = form.querySelector(".ed-nicks");
    form.querySelector(".ed-nick-add").addEventListener("click", () => {
      if (nickList.children.length >= 12) return;
      nickList.insertAdjacentHTML("beforeend", nickRow(""));
      nickList.lastElementChild.querySelector("input").focus();
    });
    nickList.addEventListener("click", (e) => {
      const rm = e.target.closest(".ed-nick-rm");
      if (rm) rm.closest(".ed-nick-row").remove();
    });
    form.querySelector(".ed-cancel").addEventListener("click", () => (slot.innerHTML = ""));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = form.querySelector(".ed-status");
      const passInput = form.querySelector("#ed-pass");
      if (passInput) {
        const t = passInput.value.trim();
        if (!t) { status.textContent = "Enter the team passcode first."; passInput.focus(); return; }
        setPass(t);
      }
      const photo = form.querySelector("#ed-photo").files[0];
      const extras = [...form.querySelector("#ed-gallery").files];
      const story = form.querySelector("#ed-story").value.replace(/\r\n/g, "\n").trim();
      const storyChanged = story !== (currentStory || "").trim();
      const seenNick = new Set();
      const nicks = [...form.querySelectorAll(".ed-nick-row input")]
        .map((i) => i.value.replace(/\s+/g, " ").trim())
        .filter((n) => n && !seenNick.has(n.toLowerCase()) && seenNick.add(n.toLowerCase()));
      const nicksChanged = nicks.join("\n") !== p.nicknames.join("\n");
      if (nicks.some((n) => n.length > 40)) { status.textContent = "Nicknames can be up to 40 characters."; return; }
      if (!photo && !extras.length && !storyChanged && !nicksChanged) { status.textContent = "Nothing has changed yet."; return; }

      const saveBtn = form.querySelector(".ed-save");
      saveBtn.disabled = true;
      const done = [];
      try {
        if (nicksChanged) {
          status.textContent = "Saving nicknames…";
          const r = await saveToSite({ id: p.id, kind: "nicknames", content: nicks });
          p.nicknames = r.nicknames || nicks;
          NICKNAMES[p.id] = p.nicknames;
          showNicknames(p);
          done.push("nicknames");
        }
        if (storyChanged) {
          status.textContent = "Saving lore…";
          await saveToSite({ id: p.id, kind: "story", content: story });
          currentStory = story;
          renderStory(p, story);
          done.push("lore");
        }
        if (photo) {
          status.textContent = "Saving profile photo…";
          const img = await toJpeg(photo, { square: true, max: 480, quality: 0.88 });
          await saveToSite({ id: p.id, kind: "photo", content: img.b64 });
          p.photo = img.dataUrl; // show it right away, everywhere on the page
          document.querySelectorAll(`[data-avatar="${p.id}"]`).forEach((a) => {
            a.querySelector("img")?.remove();
            const i = document.createElement("img");
            i.alt = "";
            i.src = img.dataUrl;
            a.appendChild(i);
          });
          done.push("profile photo");
        }
        for (let k = 0; k < extras.length; k++) {
          status.textContent = `Adding photo ${k + 1} of ${extras.length}…`;
          const img = await toJpeg(extras[k], { max: 1600 });
          await saveToSite({ id: p.id, kind: "gallery", content: img.b64 });
          addToGallery([img.dataUrl], true);
        }
        if (extras.length) done.push(extras.length === 1 ? "1 gallery photo" : `${extras.length} gallery photos`);
        slot.innerHTML = `<p class="ed-done">Saved the ${done.join(" and ").replace(/ and (?=.* and )/g, ", ")}. Everyone will see it on the live site in about a minute.</p>`;
      } catch (err) {
        if (err.passcode) { setPass(""); needsPasscode = true; }
        status.textContent = (done.length ? `Saved the ${done.join(", ")}, but the rest failed. ` : "") + err.message;
        saveBtn.disabled = false;
        if (err.passcode && !form.querySelector("#ed-pass")) openEditor(p);
      }
    });
  }

  // ---------- Photo gallery ----------
  function addToGallery(urls, prepend) {
    const wrap = drawer.querySelector(".gallery-wrap");
    if (!wrap || !urls.length) return;
    const grid = wrap.querySelector(".gallery");
    const html = urls.map((u) => `<button type="button" class="thumb" data-full="${esc(u)}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join("");
    grid.insertAdjacentHTML(prepend ? "afterbegin" : "beforeend", html);
    wrap.hidden = false;
  }

  async function loadGallery(p) {
    if (!gh.repo) return;
    let urls = [];
    try {
      const res = await ghFetch(`contents/gallery/${p.id}?ref=${BRANCH}`);
      if (res.ok) {
        urls = (await res.json())
          .filter((f) => f.type === "file" && /\.(jpe?g|png|webp|gif)$/i.test(f.name))
          .sort((a, b) => b.name.localeCompare(a.name)) // newest first
          .map((f) => f.download_url);
      }
    } catch (_) {}
    if (openId !== p.id) return;
    addToGallery(urls, false);
  }

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `<img alt=""><button type="button" class="close">Close</button>`;
  document.body.appendChild(lightbox);
  lightbox.addEventListener("click", () => (lightbox.hidden = true));

  function openPlayer(id) {
    const p = byId.get(id);
    if (!p) return;
    if (drawer.hidden) lastFocus = document.activeElement;
    openId = id;
    const mentor = p.mentor && byId.get(p.mentor);
    const mentees = menteesOf(p.id);
    const batchmates = p.coach ? [] : players.filter((o) => o.year === p.year && o.id !== p.id);
    const wins = resultsOf(p.id).sort((a, b) => (b.ev.year || 0) - (a.ev.year || 0));

    currentStory = null;
    drawer.innerHTML = `
      <div class="drawer-actions">
        ${EDIT_API ? `<button class="edit-btn" type="button" data-edit>Edit</button>` : ""}
        <button class="close" type="button" data-close>Close</button>
      </div>
      ${avatar(p, true)}
      <h3 id="drawer-title">${esc(p.name)}</h3>
      <p class="nick"${p.nicknames.length ? "" : " hidden"}>${nickLine(p)}</p>
      <div class="editor-slot"></div>
      <dl>
        ${p.coach ? "" : `<dt>Joined IITB</dt><dd>${p.year || "Not known yet"}</dd>`}
        ${p.program ? `<dt>Program</dt><dd>${esc(p.program)}</dd>` : ""}
        ${p.hostel ? `<dt>Hostel</dt><dd>${esc(p.hostel)}</dd>` : ""}
        ${p.roles.length ? `<dt>Roles</dt><dd>${p.roles.map(esc).join("<br>")}</dd>` : ""}
        ${p.instagram ? `<dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(p.instagram)}/" target="_blank" rel="noopener">@${esc(p.instagram)}</a></dd>` : ""}
      </dl>
      ${
        p.interIIT.length
          ? `<h4>Inter IIT</h4><ul class="iit-list">${[...p.interIIT]
              .sort((a, b) => b.year - a.year)
              .map((t) => {
                const m = meetFor(t.year);
                return `<li><b>${esc(t.year)}</b>${m.host ? ` · ${esc(m.host)}` : ""}${t.position ? ` · ${esc(t.position)}` : ""}</li>`;
              })
              .join("")}</ul>`
          : ""
      }
      ${
        wins.length
          ? `<h4>Results</h4><ul class="wins">${wins
              .map((r) => {
                const part = r.whoList.includes(p.id) ? r.role : "";
                const what = [placeLabel(r), r.category].filter(Boolean).map(esc);
                return `<li>${medal(r.place)}<span>${what.length > 1 ? `<b>${what[0]}</b>, ${what[1]}` : `<b>${what[0]}</b>`}${part ? ` <span class="ev">(${esc(part)})</span>` : ""}<br><span class="ev">${esc(r.ev.name)} ${esc(eventYear(r.ev))}</span></span></li>`;
              })
              .join("")}</ul>`
          : ""
      }
      <h4>Lore</h4>
      <div class="story"><p class="hint">Loading…</p></div>
      <div class="gallery-wrap" hidden><h4>Photos</h4><div class="gallery"></div></div>
      ${mentor ? `<h4>Brought in by</h4>${personChips([mentor])}` : ""}
      ${mentees.length ? `<h4>Passed the racquet to</h4>${personChips(mentees)}` : ""}
      ${batchmates.length ? `<h4>${p.year ? "Batchmates" : "Also waiting for a year"}</h4>${personChips(batchmates)}` : ""}
    `;
    drawer.hidden = false;
    scrim.hidden = false;
    drawer.scrollTop = 0;
    drawer.querySelector("[data-close]").focus();
    try { history.replaceState(null, "", "#" + p.id); } catch (_) {}
    loadStory(p);
    loadGallery(p);
  }

  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    scrim.hidden = true;
    openId = null;
    try { history.replaceState(null, "", "#" + currentTab); } catch (_) {}
    lastFocus?.focus?.();
  }

  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeDrawer();
    if (e.target.closest("[data-edit]")) return openEditor(byId.get(openId));
    const thumb = e.target.closest(".thumb");
    if (thumb) {
      lightbox.querySelector("img").src = thumb.dataset.full;
      lightbox.hidden = false;
      return;
    }
    const btn = e.target.closest("[data-open]");
    if (btn) openPlayer(btn.dataset.open);
  });
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!lightbox.hidden) lightbox.hidden = true;
    else closeDrawer();
  });
  // Any [data-open] button outside the drawer (trophies, Inter IIT) opens that card.
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (btn && !drawer.contains(btn) && !tree.contains(btn)) openPlayer(btn.dataset.open);
  });

  const person = (ref) => {
    const p = byId.get(ref);
    return p ? `<button class="who-link" type="button" data-open="${p.id}">${esc(p.name)}</button>` : `<span>${esc(ref)}</span>`;
  };
  // ---------- Inter IIT ----------
  function renderInterIIT() {
    const el = document.getElementById("iit-list");
    if (!meets.length) {
      el.innerHTML = `<div class="empty-state">Add each meet to <code>interIITMeets</code> and each player's <code>interIIT</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = meets
      .map((m) => {
        const squadList = players.filter((p) => p.interIIT.some((t) => t.year === m.year));
        return `<article class="meet">
          <header><span class="meet-year">${esc(m.year)}</span><span class="meet-host">${esc([m.host, m.edition ? m.edition + " Inter IIT Sports Meet" : ""].filter(Boolean).join(" · "))}</span>${m.result ? `<span class="meet-result">${esc(m.result)}</span>` : ""}</header>
          ${
            squadList.length
              ? `<div class="meet-squad">${squadList
                  .map((p) => {
                    const t = p.interIIT.find((x) => x.year === m.year);
                    return `<button type="button" class="squad-chip" data-open="${p.id}">${avatar(p)}<span>${esc(p.name)}${t.position ? `<small>${esc(t.position)}</small>` : ""}</span></button>`;
                  })
                  .join("")}</div>`
              : ""
          }
        </article>`;
      })
      .join("");
  }

  // ---------- Trophy cabinet ----------
  // One dropdown per tournament, split into inter-college and on-campus.
  // Inside, year buttons switch between editions; each category is one line.
  const MEDAL_WORD = { 1: "Gold", 2: "Silver", 3: "Bronze" };
  function editionHTML(ev) {
    const rows = results.filter((r) => r.ev === ev);
    const groups = new Map();
    rows.forEach((r) => {
      if (!groups.has(r.category)) groups.set(r.category, []);
      groups.get(r.category).push(r);
    });
    return `<ul class="podium">${[...groups.entries()]
      .map(([cat, rs]) => {
        const entries = rs
          .sort((a, b) => (typeof a.place === "number" ? a.place : 9) - (typeof b.place === "number" ? b.place : 9))
          .map((r) => {
            const who = [];
            if (r.whoList.length) who.push(`${r.role ? `<span class="rrole">${esc(r.role)}</span> ` : ""}${r.whoList.map(person).join(" &amp; ")}`);
            if (r.members.length) who.push(r.members.map(person).join(", "));
            if (r.note) who.push(`<span class="rnote">${esc(r.note)}</span>`);
            return `<span class="entry">${medal(r.place)}<span class="pl">${esc(placeLabel(r))}</span>${who.length ? `<span class="nm">${who.join(" · ")}</span>` : ""}</span>`;
          })
          .join("");
        return `<li><span class="cat">${esc(cat)}</span><span class="entries">${entries}</span></li>`;
      })
      .join("")}</ul>`;
  }

  function renderTrophies() {
    const el = document.getElementById("trophy-list");
    const events = [...(DATA.events || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
    if (!events.length) {
      el.innerHTML = `<div class="empty-state">Nothing here yet. Add tournaments and results to <code>events</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    const series = new Map();
    events.forEach((ev) => {
      if (!series.has(ev.name)) series.set(ev.name, []);
      series.get(ev.name).push(ev);
    });
    const block = (title, list) =>
      list.length
        ? `<h3 class="cab-group">${title}</h3>${list
            .map(([name, eds], i) => {
              const years = eds.map(eventYear);
              const span = years.length > 1 ? `${years[years.length - 1]} – ${years[0]}` : years[0];
              // Best badminton finish; `overall` rows (e.g. the institute's overall sports title) don't count.
              const best = Math.min(...results.filter((r) => eds.includes(r.ev) && typeof r.place === "number" && !r.overall).map((r) => r.place));
              const golds = results.filter((r) => eds.includes(r.ev) && r.place === 1).length;
              const badge =
                eds[0].scope === "inter-college" && isFinite(best)
                  ? `<span class="s-badge m${best}">Best: ${esc(MEDAL_WORD[best] || PLACE[best])}</span>`
                  : `<span class="s-badge">${golds} title${golds === 1 ? "" : "s"}</span>`;
              return `<details class="series"${i === 0 ? " open" : ""}>
                <summary>
                  <span class="s-name">${esc(name)}</span>
                  <span class="s-meta">${eds.length} edition${eds.length === 1 ? "" : "s"} · ${esc(span)}</span>
                  ${badge}
                  <span class="chev" aria-hidden="true"></span>
                </summary>
                <div class="s-body">
                  ${
                    eds.length > 1
                      ? `<div class="yr-pills" role="group" aria-label="${esc(name)} editions">${eds
                          .map((ev, k) => `<button type="button" class="yr" data-series="${esc(name)}" data-k="${k}" aria-pressed="${k === 0}">${esc(eventYear(ev))}</button>`)
                          .join("")}</div>`
                      : ""
                  }
                  <div class="edition">${editionHTML(eds[0])}</div>
                </div>
              </details>`;
            })
            .join("")}`
        : "";
    const all = [...series.entries()];
    el.innerHTML = `<div class="cabinet">
      ${block("Inter-college", all.filter(([, eds]) => eds[0].scope === "inter-college"))}
      ${block("On campus", all.filter(([, eds]) => eds[0].scope !== "inter-college"))}
    </div>`;
    el.addEventListener("click", (e) => {
      const btn = e.target.closest(".yr");
      if (!btn) return;
      const eds = series.get(btn.dataset.series);
      const body = btn.closest(".s-body");
      body.querySelectorAll(".yr").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      body.querySelector(".edition").innerHTML = editionHTML(eds[Number(btn.dataset.k)]);
    });
  }

  // ---------- Club leadership ----------
  function renderLeadership() {
    const el = document.getElementById("leadership");
    if (!leadership.length) {
      el.closest("section").hidden = true;
      return;
    }
    const chip = (id) => {
      const p = byId.get(id);
      return p
        ? `<button type="button" class="squad-chip" data-open="${p.id}">${avatar(p)}<span>${esc(p.name)}</span></button>`
        : `<span class="squad-chip plain">${esc(id)}</span>`;
    };
    el.innerHTML = `<ol class="terms">${leadership
      .map(
        (l, i) => `<li class="term${i === 0 ? " now" : ""}">
          <span class="term-year">${esc(l.year)}</span>
          <div class="term-row"><span class="term-role">Secretary</span><div class="term-people">${(l.secretary || []).map(chip).join("")}</div></div>
          <div class="term-row"><span class="term-role">Convenors</span><div class="term-people">${(l.convenors || []).map(chip).join("")}</div></div>
        </li>`
      )
      .join("")}</ol>`;
  }

  // ---------- Extended family ----------
  function renderFamily() {
    const el = document.getElementById("family");
    const fam = DATA.family || [];
    if (!fam.length) {
      el.innerHTML = `<div class="empty-state">Add coaches to <code>family</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = `<div class="family-grid">${fam
      .map(
        (f) => `<button type="button" class="family-card" data-open="${esc(f.id || slug(f.name))}">${avatar(f)}
          <span><strong>${esc(f.name)}</strong>
            <span class="role">${esc([f.role, f.years].filter(Boolean).join(" · "))}</span>
            ${f.note ? `<span class="fnote">${esc(f.note)}</span>` : ""}
          </span></button>`
      )
      .join("")}</div>`;
  }

  // ---------- Light / dark toggle ----------
  // Follows the device until someone picks; the choice is remembered on this browser.
  const themeBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches);
  const syncThemeBtn = () => {
    const dark = isDark();
    themeBtn.setAttribute("aria-checked", String(dark));
    themeBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  };
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") root.dataset.theme = saved;
  } catch (_) {}
  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
    syncThemeBtn();
  });
  systemDark.addEventListener?.("change", syncThemeBtn);
  syncThemeBtn();

  renderLeadership();
  renderInterIIT();
  renderTrophies();
  renderFamily();

  // ---------- Tabs ----------
  // #tree, #inter-iit, #trophies; a player id (#vidhi-kapuria) opens the tree with their card.
  const TABS = ["tree", "inter-iit", "trophies"];
  let treeShown = false;
  function showTab(name) {
    if (!TABS.includes(name)) name = "tree";
    currentTab = name;
    document.querySelectorAll("[data-panel]").forEach((el) => (el.hidden = el.dataset.panel !== name));
    document.querySelectorAll("[data-tab]").forEach((el) => el.setAttribute("aria-selected", String(el.dataset.tab === name)));
    document.getElementById("tree-tools").hidden = name !== "tree";
    if (name === "tree") {
      if (!treeShown) renderTree();
      else redraw();
      treeShown = true;
    }
  }
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      showTab(btn.dataset.tab);
      try { history.replaceState(null, "", "#" + btn.dataset.tab); } catch (_) {}
    })
  );

  const hash = decodeURIComponent(location.hash.slice(1));
  if (byId.has(hash)) {
    showTab("tree");
    openPlayer(hash);
  } else {
    showTab(hash);
  }
})();
