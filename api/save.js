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
};

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

    return res.status(400).json({ error: "Nothing to save." });
  } catch (err) {
    const conflict = err.status === 409 || err.status === 422;
    return res
      .status(conflict ? 409 : 502)
      .json({ error: conflict ? "Someone else saved this at the same moment. Press Save again." : "GitHub didn't accept the save. Try again in a minute." });
  }
};
