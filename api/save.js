// Vercel serverless function: saves profile edits from the site to GitHub.
//
// The site's Edit form posts here; this function writes the file to the repo
// with a GitHub token that lives only in Vercel's environment settings, so
// visitors never need a GitHub account or token.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   GITHUB_TOKEN   required. Fine-grained token, BadminTree repo only,
//                  Contents: Read and write.
//   EDIT_PASSCODE  optional. If set, editors must enter this passcode once.
//   GITHUB_REPO    optional, defaults to "Prayag-Mohanty/BadminTree".
//   GITHUB_BRANCH  optional, defaults to "main".

const crypto = require("crypto");

const REPO = process.env.GITHUB_REPO || "Prayag-Mohanty/BadminTree";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const ALLOWED_ORIGINS = ["https://badmin-tree.vercel.app", "https://prayag-mohanty.github.io"];

const LIMITS = {
  story: 20000, // characters
  photo: 1.5 * 1024 * 1024, // base64 characters (~1.1 MB image)
  gallery: 3.5 * 1024 * 1024, // base64 characters (~2.6 MB image); Vercel caps bodies at 4.5 MB
  nickname: 40, // characters per nickname
  nicknamesPerSave: 5,
  nicknamesPerPerson: 12, // added from the site, on top of data/team.js
};

const NICK_FILE = "data/nicknames.js";
const NICK_PREFIX = "window.EXTRA_NICKNAMES = ";
const NICK_HEADER =
  "// Nicknames added from the site's Edit form, by person id.\n" +
  "// The save function (api/save.js) appends to this file; the site merges\n" +
  "// these with the nicknames in data/team.js. You can also edit it by hand.\n";

// Appends nicknames to data/nicknames.js. Several people may save at once, so
// read-modify-write with the file's sha and retry if someone got there first.
async function addNicknames(id, names) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let sha;
    let map = {};
    const cur = await gh(`contents/${NICK_FILE}?ref=${BRANCH}`);
    if (cur.ok) {
      const file = await cur.json();
      sha = file.sha;
      const text = Buffer.from(file.content, "base64").toString("utf8");
      const i = text.indexOf(NICK_PREFIX);
      if (i >= 0) map = JSON.parse(text.slice(i + NICK_PREFIX.length).trim().replace(/;\s*$/, "") || "{}");
    }
    const have = map[id] || [];
    const seen = new Set(have.map((n) => n.toLowerCase()));
    const fresh = names.filter((n) => !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()));
    if (!fresh.length) return have;
    const next = [...have, ...fresh].slice(0, LIMITS.nicknamesPerPerson);
    map[id] = next;
    const body = NICK_HEADER + NICK_PREFIX + JSON.stringify(map, null, 2) + ";\n";
    const res = await gh(`contents/${NICK_FILE}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Add nicknames for ${id}`,
        content: Buffer.from(body, "utf8").toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.ok) return next;
    if (res.status !== 409 && res.status !== 422) {
      const err = new Error(`GitHub replied ${res.status}`);
      err.status = res.status;
      throw err;
    }
  }
  const err = new Error("conflict");
  err.status = 409;
  throw err;
}

const slug = (s) =>
  String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function gh(path, init = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "badmintree-save",
      ...(init.headers || {}),
    },
  });
}

// Only people already on the site (players and coaches) can be edited, so this
// endpoint can't be used to create arbitrary files. The ids are read from the
// live data file and cached for a few minutes.
let knownIds = null;
let knownAt = 0;
async function getKnownIds() {
  if (knownIds && Date.now() - knownAt < 5 * 60 * 1000) return knownIds;
  const res = await gh(`contents/data/team.js?ref=${BRANCH}`);
  if (!res.ok) throw new Error(`Couldn't read the team data (${res.status})`);
  const text = Buffer.from((await res.json()).content, "base64").toString("utf8");
  knownIds = new Set([...text.matchAll(/\bname:\s*"([^"]+)"/g)].map((m) => slug(m[1])));
  knownAt = Date.now();
  return knownIds;
}

async function putFile(path, contentB64, message) {
  let sha;
  const cur = await gh(`contents/${path}?ref=${BRANCH}`);
  if (cur.ok) sha = (await cur.json()).sha;
  const res = await gh(`contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: contentB64, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const err = new Error(`GitHub replied ${res.status}`);
    err.status = res.status;
    throw err;
  }
}

const sameSecret = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

const isB64 = (s) => typeof s === "string" && /^[A-Za-z0-9+/]+={0,2}$/.test(s);

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: "Editing isn't switched on yet. The site owner needs to add GITHUB_TOKEN in Vercel (Settings → Environment Variables, Production) and then redeploy." });
  }
  // GET tells the page whether a passcode is needed.
  if (req.method === "GET") return res.status(200).json({ ok: true, passcode: Boolean(process.env.EDIT_PASSCODE) });
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { id, kind, content, passcode } = body;

  if (process.env.EDIT_PASSCODE && !sameSecret(passcode || "", process.env.EDIT_PASSCODE)) {
    return res.status(401).json({ error: "That passcode isn't right.", passcode: true });
  }
  if (typeof id !== "string" || !/^[a-z0-9-]{1,80}$/.test(id)) return res.status(400).json({ error: "Unknown person." });

  try {
    if (!(await getKnownIds()).has(id)) return res.status(400).json({ error: "Unknown person." });

    if (kind === "story") {
      if (typeof content !== "string" || content.length > LIMITS.story) {
        return res.status(400).json({ error: `Lore can be up to ${LIMITS.story.toLocaleString("en")} characters.` });
      }
      const text = content.replace(/\r\n/g, "\n").trim();
      await putFile(`stories/${id}.md`, Buffer.from(text + "\n", "utf8").toString("base64"), `Update ${id}'s story`);
      return res.status(200).json({ ok: true });
    }

    if (kind === "photo" || kind === "gallery") {
      if (!isB64(content) || content.length > LIMITS[kind]) return res.status(400).json({ error: "That photo is too large or not an image." });
      const bytes = Buffer.from(content, "base64");
      if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return res.status(400).json({ error: "Photos must be JPEG." });
      if (kind === "photo") {
        await putFile(`photos/${id}.jpg`, content, `Update ${id}'s photo`);
      } else {
        const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
        const rand = crypto.randomBytes(3).toString("hex");
        await putFile(`gallery/${id}/${stamp}-${rand}.jpg`, content, `Add a photo of ${id}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (kind === "nicknames") {
      const names = Array.isArray(content)
        ? content.map((n) => String(n).replace(/\s+/g, " ").trim()).filter(Boolean)
        : [];
      if (!names.length) return res.status(400).json({ error: "Type a nickname first." });
      if (names.length > LIMITS.nicknamesPerSave) {
        return res.status(400).json({ error: `Add up to ${LIMITS.nicknamesPerSave} nicknames at a time.` });
      }
      if (names.some((n) => n.length > LIMITS.nickname)) {
        return res.status(400).json({ error: `Nicknames can be up to ${LIMITS.nickname} characters.` });
      }
      const nicknames = await addNicknames(id, names);
      return res.status(200).json({ ok: true, nicknames });
    }

    return res.status(400).json({ error: "Nothing to save." });
  } catch (err) {
    const conflict = err.status === 409 || err.status === 422;
    return res
      .status(conflict ? 409 : 502)
      .json({ error: conflict ? "Someone else saved this at the same moment. Press Save again." : "GitHub didn't accept the save. Try again in a minute." });
  }
};
