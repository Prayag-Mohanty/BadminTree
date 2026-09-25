# IITB Badminton Team Tree

An interactive family tree of the IIT Bombay Badminton team: every player, batch by batch, with their roles, achievements, who brought them in, and the extended family of coaches, managers and friends who were part of the journey.

Made so the next fresher who asks "who was that?" gets an answer in one tap.

## What's on the page

- **The Tree**: a trunk with one ring per batch (the year they joined the team). Newest batch at the top, roots at the bottom. Tap anyone to open their card.
- **Search & filters**: by name, nickname, year, or current squad vs. alumni.
- **Lineage**: set a player's `mentor` and hovering them lights up their senior and juniors. Their card shows "Brought in by" and "Passed the racquet to".
- **Trophy cabinet**: team and individual results collected from the data, newest first.
- **Extended family**: people who weren't on the roster but were part of the story.
- **Deep links**: `…/index.html#vidhi-kapuria` opens that player's card directly, handy for sharing in the group.

## Editing the data

Everything lives in [`data/team.js`](data/team.js). The field list is documented at the top of that file. A fully filled player looks like:

```js
{
  name: "Prayag Mohanty",
  nickname: "…",
  squad: "Men's",
  program: "B.Tech, …",
  hostel: "H…",
  roles: ["Captain 2026-27"],
  achievements: [{ year: 2025, title: "Inter IIT: Men's team …" }],
  mentor: "keshav-samdani",          // id = name in lowercase with dashes
  instagram: "handle",
  photo: "photos/prayag-mohanty.jpg", // drop the image into photos/
  note: "One line a fresher should know about them.",
}
```

A new batch is a new key under `batches`:

```js
batches: {
  2027: [{ name: "New Fresher" }],
  …
}
```

**Alumni vs. current** is worked out automatically: a batch counts as alumni once `graduationYears` (default 4) academic years have passed since they joined. Set `status: "alumni"` or `status: "current"` on anyone who doesn't fit (dual degree, PG, left early).

## Running it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Publishing on GitHub Pages

The repo includes `.github/workflows/pages.yml`. To switch it on:

1. Go to **Settings → Pages** in this repo.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main`. The site will be live at `https://<username>.github.io/IITB-Badminton-Team-Tree/`.

After that, any teammate with access can update the tree by editing `data/team.js` right on GitHub, and the site redeploys on its own.
