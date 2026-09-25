(function () {
  "use strict";

  const DATA = window.TEAM_DATA || { batches: {} };
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const short = (y) => "'" + String(y).slice(2);

  const AVATAR_COLORS = ["#d7263d", "#1f4fd6", "#13214d", "#b8860b", "#8a1c2c", "#2f6fe0"];
  const colorFor = (id) => {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };

  // ---------- Normalise data ----------
  const players = [];
  const byId = new Map();
  const years = Object.keys(DATA.batches || {}).map(Number).sort((a, b) => b - a);
  for (const year of years) {
    for (const raw of DATA.batches[year] || []) {
      if (!raw || !raw.name) continue;
      let id = raw.id || slug(raw.name);
      if (byId.has(id)) id = `${id}-${year}`;
      const p = { ...raw, id, year, roles: raw.roles || [], achievements: raw.achievements || [] };
      players.push(p);
      byId.set(id, p);
    }
  }
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
    return `<span class="avatar${big ? " lg" : ""}" style="background:${colorFor(id)}" aria-hidden="true">${esc(initials(p.name))}<img src="${esc(src)}" alt="" loading="lazy" data-id="${esc(id)}"${p.photo ? ' data-fixed="1"' : ""} onerror="__nextPhoto(this)"></span>`;
  };

  // ---------- Stats ----------
  document.getElementById("stats").innerHTML = [
    `<span><b>${players.length}</b> players</span>`,
    `<span><b>${years.length}</b> batches</span>`,
    years.length ? `<span>since <b>${years[years.length - 1]}</b></span>` : "",
  ].join("");

  // ---------- Tree ----------
  const tree = document.getElementById("tree");
  let query = "";
  let firstRender = true;

  function renderTree() {
    const q = query.trim().toLowerCase();
    const match = (p) => !q || [p.name, p.nickname, p.program, p.hostel, p.year, ...p.roles].join(" ").toLowerCase().includes(q);

    let html = `<svg class="tree-svg" aria-hidden="true"></svg>`;
    let shown = 0;
    let i = 0;
    for (const year of years) {
      const visible = players.filter((p) => p.year === year && match(p));
      if (!visible.length) continue;
      shown += visible.length;
      html += `
        <section class="batch ${i++ % 2 ? "blue" : "red"}" data-year="${year}" aria-label="Joined ${year}">
          <div class="batch-badge" title="Joined ${year}">${short(year)}</div>
          <div class="leaves">
            ${visible
              .map(
                (p) => `<button class="leaf" type="button" data-id="${p.id}">${avatar(p)}<span class="name">${esc(p.name)}${p.nickname ? `<span class="nick">${esc(p.nickname)}</span>` : ""}</span></button>`
              )
              .join("")}
          </div>
        </section>`;
    }
    if (!shown) html += `<p class="no-results">Nobody matches “${esc(query)}”.</p>`;
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
    const angle = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI - 90;
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

  const personChips = (list) =>
    `<div class="people">${list.map((p) => `<button type="button" data-open="${p.id}">${esc(p.name)} · ${short(p.year)}</button>`).join("")}</div>`;

  function openPlayer(id) {
    const p = byId.get(id);
    if (!p) return;
    if (drawer.hidden) lastFocus = document.activeElement;
    const mentor = p.mentor && byId.get(p.mentor);
    const mentees = menteesOf(p.id);
    const batchmates = players.filter((o) => o.year === p.year && o.id !== p.id);

    drawer.innerHTML = `
      <button class="close" type="button" data-close>Close</button>
      ${avatar(p, true)}
      <h3 id="drawer-title">${esc(p.name)}</h3>
      ${p.nickname ? `<p class="nick">“${esc(p.nickname)}”</p>` : ""}
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <dl>
        <dt>Joined</dt><dd>${p.year}</dd>
        ${p.squad ? `<dt>Squad</dt><dd>${esc(p.squad)}</dd>` : ""}
        ${p.program ? `<dt>Program</dt><dd>${esc(p.program)}</dd>` : ""}
        ${p.hostel ? `<dt>Hostel</dt><dd>${esc(p.hostel)}</dd>` : ""}
        ${p.roles.length ? `<dt>Roles</dt><dd>${p.roles.map(esc).join("<br>")}</dd>` : ""}
        ${p.instagram ? `<dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(p.instagram)}/" target="_blank" rel="noopener">@${esc(p.instagram)}</a></dd>` : ""}
      </dl>
      ${
        p.achievements.length
          ? `<h4>Achievements</h4><ul>${[...p.achievements]
              .sort((a, b) => (b.year || 0) - (a.year || 0))
              .map((a) => `<li>${a.year ? `<b>${esc(a.year)}</b> · ` : ""}${esc(a.title || a)}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${mentor ? `<h4>Brought in by</h4>${personChips([mentor])}` : ""}
      ${mentees.length ? `<h4>Passed the racquet to</h4>${personChips(mentees)}` : ""}
      ${batchmates.length ? `<h4>Batchmates</h4>${personChips(batchmates)}` : ""}
    `;
    drawer.hidden = false;
    scrim.hidden = false;
    drawer.scrollTop = 0;
    drawer.querySelector("[data-close]").focus();
    try { history.replaceState(null, "", "#" + p.id); } catch (_) {}
  }

  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    scrim.hidden = true;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
    lastFocus?.focus?.();
  }

  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeDrawer();
    const btn = e.target.closest("[data-open]");
    if (btn) openPlayer(btn.dataset.open);
  });
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  // ---------- Trophy cabinet ----------
  function renderTrophies() {
    const rows = [
      ...(DATA.teamAchievements || []).map((a) => ({ year: a.year, title: a.title, who: null })),
      ...players.flatMap((p) => p.achievements.map((a) => ({ year: a.year, title: a.title || a, who: p }))),
    ].sort((a, b) => (b.year || 0) - (a.year || 0));

    const el = document.getElementById("trophies");
    if (!rows.length) {
      el.innerHTML = `<div class="empty-state">Nothing here yet. Team results go in <code>teamAchievements</code> and individual ones in each player's <code>achievements</code>, both in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = `<ul class="trophies">${rows
      .map(
        (r) => `<li><span class="y">${esc(r.year || "")}</span><span>${esc(r.title)}
          <br><span class="who">${r.who ? `<button class="who-link" type="button" data-open="${r.who.id}">${esc(r.who.name)}</button>` : "Team"}</span></span></li>`
      )
      .join("")}</ul>`;
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (btn) openPlayer(btn.dataset.open);
    });
  }

  // ---------- Extended family ----------
  function renderFamily() {
    const el = document.getElementById("family");
    const fam = DATA.family || [];
    if (!fam.length) {
      el.innerHTML = `<div class="empty-state">Coaches, managers, the friends who kept score. Add them to <code>family</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = `<div class="family-grid">${fam
      .map(
        (f) => `<div class="family-card">${avatar(f)}
          <div><strong>${esc(f.name)}</strong>
            <div class="role">${esc([f.role, f.years].filter(Boolean).join(" · "))}</div>
            ${f.note ? `<p>${esc(f.note)}</p>` : ""}
            ${f.instagram ? `<p><a href="https://www.instagram.com/${esc(f.instagram)}/" target="_blank" rel="noopener">@${esc(f.instagram)}</a></p>` : ""}
          </div></div>`
      )
      .join("")}</div>`;
  }

  renderTree();
  renderTrophies();
  renderFamily();

  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && byId.has(hash)) openPlayer(hash);
})();
