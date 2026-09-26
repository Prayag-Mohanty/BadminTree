(function () {
  "use strict";

  const DATA = window.TEAM_DATA || { batches: {} };
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
    const nicknames = raw.nicknames || (raw.nickname ? [raw.nickname] : []);
    const p = { ...raw, id, year, nicknames, roles: raw.roles || [], interIIT: raw.interIIT || [] };
    players.push(p);
    byId.set(id, p);
  };
  for (const year of years) (DATA.batches[year] || []).forEach((raw) => addPlayer(raw, year));
  (DATA.yearUnknown || []).forEach((raw) => addPlayer(raw, null));
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
    return `<span class="avatar${big ? " lg" : ""}" style="background:${colorFor(id)}" aria-hidden="true">${esc(initials(p.name))}<img src="${esc(src)}" alt="" loading="lazy" data-id="${esc(id)}"${p.photo ? ' data-fixed="1"' : ""} onerror="__nextPhoto(this)"></span>`;
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
    ...(meets.length > 1 ? meets.map((m) => [String(m.year), `Inter IIT ${m.year}`]) : []),
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
  const storyLink = (id, exists) =>
    gh.repo
      ? exists
        ? `https://github.com/${gh.repo}/edit/${gh.branch || "main"}/stories/${id}.md`
        : `https://github.com/${gh.repo}/new/${gh.branch || "main"}/stories?filename=${id}.md`
      : "";

  async function loadStory(p) {
    const box = drawer.querySelector(".story");
    let text = null;
    try {
      const res = await fetch(`stories/${p.id}.md`, { cache: "no-cache" });
      if (res.ok) text = await res.text();
    } catch (_) {}
    if (openId !== p.id) return; // another card was opened meanwhile
    const link = storyLink(p.id, !!text);
    box.innerHTML = text
      ? `${md(text)}${link ? `<a class="story-edit" href="${link}" target="_blank" rel="noopener">Edit story</a>` : ""}`
      : `<p class="hint">Nobody has written ${esc(p.name.split(" ")[0])}'s story yet.</p>${link ? `<a class="story-write" href="${link}" target="_blank" rel="noopener">Write their story</a>` : ""}`;
  }

  function openPlayer(id) {
    const p = byId.get(id);
    if (!p) return;
    if (drawer.hidden) lastFocus = document.activeElement;
    openId = id;
    const mentor = p.mentor && byId.get(p.mentor);
    const mentees = menteesOf(p.id);
    const batchmates = players.filter((o) => o.year === p.year && o.id !== p.id);
    const wins = resultsOf(p.id).sort((a, b) => (b.ev.year || 0) - (a.ev.year || 0));

    drawer.innerHTML = `
      <button class="close" type="button" data-close>Close</button>
      ${avatar(p, true)}
      <h3 id="drawer-title">${esc(p.name)}</h3>
      ${p.nicknames.length ? `<p class="nick">aka ${p.nicknames.map((n) => `“${esc(n)}”`).join(", ")}</p>` : ""}
      <dl>
        <dt>Joined IITB</dt><dd>${p.year || "Not known yet"}</dd>
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
      <h4>Story</h4>
      <div class="story"><p class="hint">Loading…</p></div>
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
    const btn = e.target.closest("[data-open]");
    if (btn) openPlayer(btn.dataset.open);
  });
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  // Any [data-open] button outside the drawer (trophies, Inter IIT) opens that card.
  document.querySelector("main").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (btn && !drawer.contains(btn)) openPlayer(btn.dataset.open);
  });

  const person = (ref) => {
    const p = byId.get(ref);
    return p ? `<button class="who-link" type="button" data-open="${p.id}">${esc(p.name)}</button>` : `<span>${esc(ref)}</span>`;
  };
  const resultPeople = (r) => {
    const bits = [];
    if (r.whoList.length) bits.push(`${r.role ? `<span class="rrole">${esc(r.role)}</span> ` : ""}${r.whoList.map(person).join(" &amp; ")}`);
    if (r.members.length) bits.push(r.members.map(person).join(", "));
    if (r.note) bits.push(`<span class="rnote">${esc(r.note)}</span>`);
    return bits.length ? `<span class="nm">${bits.join("<br>")}</span>` : "";
  };

  // ---------- Inter IIT ----------
  function renderInterIIT() {
    const el = document.getElementById("interiit");
    if (!meets.length) {
      el.innerHTML = `<div class="empty-state">Add each meet to <code>interIITMeets</code> and each player's <code>interIIT</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = meets
      .map((m) => {
        const squadList = players.filter((p) => p.interIIT.some((t) => t.year === m.year));
        return `<article class="meet">
          <header><span class="meet-year">${esc(m.year)}</span><span class="meet-host">${esc(m.host || "")}</span>${m.result ? `<span class="meet-result">${esc(m.result)}</span>` : ""}</header>
          ${squadList.length ? "" : `<p class="hint">Squad not added yet. Add <code>{ year: ${esc(m.year)} }</code> to each player's <code>interIIT</code>.</p>`}
          <div class="meet-squad">${squadList
            .map((p) => {
              const t = p.interIIT.find((x) => x.year === m.year);
              return `<button type="button" class="squad-chip" data-open="${p.id}">${avatar(p)}<span>${esc(p.name)}${t.position ? `<small>${esc(t.position)}</small>` : ""}</span></button>`;
            })
            .join("")}</div>
        </article>`;
      })
      .join("");
  }

  // ---------- Trophy cabinet ----------
  function renderTrophies() {
    const el = document.getElementById("trophies");
    const events = [...(DATA.events || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
    if (!events.length) {
      el.innerHTML = `<div class="empty-state">Nothing here yet. Add tournaments and results to <code>events</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = `<div class="events">${events
      .map((ev) => {
        const rows = results.filter((r) => r.ev === ev);
        return `<article class="event">
          <h3>${esc(ev.name)} <span>${esc(eventYear(ev))}</span></h3>
          <ul>${rows
            .map((r) => `<li>${medal(r.place)}<span class="cat">${esc(r.category)}</span><span class="pl">${esc(placeLabel(r))}</span>${resultPeople(r)}</li>`)
            .join("")}</ul>
        </article>`;
      })
      .join("")}</div>`;
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
        (f) => `<div class="family-card">${avatar(f)}
          <div><strong>${esc(f.name)}</strong>
            <div class="role">${esc([f.role, f.years].filter(Boolean).join(" · "))}</div>
            ${f.note ? `<p>${esc(f.note)}</p>` : ""}
          </div></div>`
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
    themeBtn.textContent = isDark() ? "Light mode" : "Dark mode";
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
