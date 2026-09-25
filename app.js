(function () {
  "use strict";

  const DATA = window.TEAM_DATA || { batches: {} };
  const GRAD_YEARS = DATA.graduationYears || 4;

  // Academic year starts in July: Sep 2026 -> 2026, Mar 2026 -> 2025.
  const now = new Date();
  const ACADEMIC_YEAR = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  // Stable colour per person, picked from court-ish hues.
  const HUES = [158, 172, 196, 24, 32, 142, 210, 8];
  const colorFor = (id) => {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `hsl(${HUES[h % HUES.length]} 42% 38%)`;
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
      const graduated = year + GRAD_YEARS <= ACADEMIC_YEAR;
      const p = {
        ...raw,
        id,
        year,
        roles: raw.roles || [],
        achievements: raw.achievements || [],
        status: raw.status || (graduated ? "alumni" : "current"),
      };
      players.push(p);
      byId.set(id, p);
    }
  }
  const menteesOf = (id) => players.filter((p) => p.mentor === id);

  // ---------- Rendering helpers ----------
  const avatar = (p, big) => {
    const cls = "avatar" + (big ? " lg" : "");
    if (p.photo) return `<img class="${cls}" src="${esc(p.photo)}" alt="">`;
    return `<span class="${cls}" style="background:${colorFor(p.id || slug(p.name))}" aria-hidden="true">${esc(initials(p.name))}</span>`;
  };
  const pill = (status) => `<span class="pill ${status}">${status === "alumni" ? "Alumni" : "Current"}</span>`;

  // ---------- Stats ----------
  const alumniCount = players.filter((p) => p.status === "alumni").length;
  document.getElementById("stats").innerHTML = [
    `<span><b>${players.length}</b> players</span>`,
    `<span><b>${years.length}</b> batches</span>`,
    `<span><b>${alumniCount}</b> alumni</span>`,
    `<span><b>${players.length - alumniCount}</b> on the current squad</span>`,
    (DATA.family || []).length ? `<span><b>${DATA.family.length}</b> in the extended family</span>` : "",
  ].join("");

  // ---------- Tree ----------
  const tree = document.getElementById("tree");
  const state = { q: "", status: "all" };

  function renderTree() {
    const q = state.q.trim().toLowerCase();
    const match = (p) =>
      (state.status === "all" || p.status === state.status) &&
      (!q || [p.name, p.nickname, p.program, p.hostel, p.year, ...p.roles].join(" ").toLowerCase().includes(q));

    let shown = 0;
    let html = `<div class="tree-cap">Newest leaves</div>`;
    for (const year of years) {
      const batch = players.filter((p) => p.year === year);
      const visible = batch.filter(match);
      if (!visible.length) continue;
      shown += visible.length;
      const status = year + GRAD_YEARS <= ACADEMIC_YEAR ? "Alumni batch" : "Joined " + year;
      html += `
        <section class="batch" aria-label="Batch of ${year}">
          <div class="batch-badge"><span class="yr">'${String(year).slice(2)}</span><span class="ct">${batch.length}</span></div>
          <div class="leaves">
            <div class="batch-meta">${year} · ${esc(status)}</div>
            ${visible
              .map(
                (p) => `
              <button class="leaf" type="button" data-id="${p.id}">
                ${avatar(p)}
                <span class="name">${esc(p.name)}<span class="tag">${esc(p.nickname || p.roles[0] || (p.status === "alumni" ? "Alumni" : "Current squad"))}</span></span>
              </button>`
              )
              .join("")}
          </div>
        </section>`;
    }
    html += `<div class="tree-cap">Roots · ${years[years.length - 1] || ""}</div>`;
    tree.innerHTML = shown ? html : `<p class="no-results">Nobody matches “${esc(state.q)}”. Try a first name or a year.</p>`;
  }

  document.getElementById("search").addEventListener("input", (e) => {
    state.q = e.target.value;
    renderTree();
  });
  document.querySelectorAll("[data-status]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.status = btn.dataset.status;
      document.querySelectorAll("[data-status]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderTree();
    })
  );

  // Hovering a leaf lights up its mentor and mentees.
  tree.addEventListener("mouseover", (e) => {
    const leaf = e.target.closest(".leaf");
    tree.querySelectorAll(".leaf.lineage").forEach((l) => l.classList.remove("lineage"));
    if (!leaf) return;
    const p = byId.get(leaf.dataset.id);
    const related = [p.mentor, ...menteesOf(p.id).map((m) => m.id)].filter(Boolean);
    related.forEach((id) => tree.querySelector(`.leaf[data-id="${id}"]`)?.classList.add("lineage"));
  });
  tree.addEventListener("mouseleave", () =>
    tree.querySelectorAll(".leaf.lineage").forEach((l) => l.classList.remove("lineage"))
  );
  tree.addEventListener("click", (e) => {
    const leaf = e.target.closest(".leaf");
    if (leaf) openPlayer(leaf.dataset.id);
  });

  // ---------- Player drawer ----------
  const drawer = document.getElementById("drawer");
  const scrim = document.getElementById("scrim");
  let lastFocus = null;

  const personChips = (list) =>
    `<div class="people">${list.map((p) => `<button type="button" data-open="${p.id}">${esc(p.name)} · '${String(p.year).slice(2)}</button>`).join("")}</div>`;

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
      ${pill(p.status)}
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <dl>
        <dt>Joined team</dt><dd>${p.year}</dd>
        ${p.squad ? `<dt>Squad</dt><dd>${esc(p.squad)}</dd>` : ""}
        ${p.program ? `<dt>Program</dt><dd>${esc(p.program)}</dd>` : ""}
        ${p.hostel ? `<dt>Hostel</dt><dd>${esc(p.hostel)}</dd>` : ""}
        ${p.roles.length ? `<dt>Roles</dt><dd>${p.roles.map(esc).join("<br>")}</dd>` : ""}
        ${p.instagram ? `<dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(p.instagram)}/" target="_blank" rel="noopener">@${esc(p.instagram)}</a></dd>` : ""}
      </dl>

      <h4>Achievements</h4>
      ${
        p.achievements.length
          ? `<ul>${[...p.achievements].sort((a, b) => (b.year || 0) - (a.year || 0)).map((a) => `<li>${a.year ? `<b>${esc(a.year)}</b> · ` : ""}${esc(a.title || a)}</li>`).join("")}</ul>`
          : `<p class="hint">None logged yet. Add them under <code>achievements</code> in <code>data/team.js</code>.</p>`
      }

      ${mentor || mentees.length ? `<h4>Lineage</h4>` : ""}
      ${mentor ? `<p class="hint">Brought in by</p>${personChips([mentor])}` : ""}
      ${mentees.length ? `<p class="hint">Passed the racquet to</p>${personChips(mentees)}` : ""}

      ${batchmates.length ? `<h4>Batchmates · ${p.year}</h4>${personChips(batchmates)}` : ""}
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
      el.innerHTML = `<div class="empty-state">The cabinet is empty for now. Add team results to <code>teamAchievements</code> and individual ones to each player's <code>achievements</code> in <code>data/team.js</code>, and they'll line up here by year.</div>`;
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
      el.innerHTML = `<div class="empty-state">Coaches, managers, the friends who kept score and the seniors who never officially made the roster but made the team what it is. Add them to <code>family</code> in <code>data/team.js</code>.</div>`;
      return;
    }
    el.innerHTML = `<div class="family-grid">${fam
      .map(
        (f) => `<div class="family-card">${avatar({ ...f, id: slug(f.name) })}
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

  // Deep link: index.html#vidhi-kapuria opens that player.
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && byId.has(hash)) openPlayer(hash);
})();
