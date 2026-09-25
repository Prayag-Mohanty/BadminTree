# IITB Badminton Team Tree

An interactive family tree of the IIT Bombay Badminton team: every player, batch by batch, with their roles, achievements, who brought them in, and the extended family of coaches, managers and friends who were part of the journey.

Made so the next fresher who asks "who was that?" gets an answer in one tap.

## What's on the page

- **The Tree**: a curving trunk with one knot per batch (the year they joined the team), newest at the top and roots at the bottom. It grows from the roots when the page loads, and a shuttlecock drops down the trunk as you scroll. Tap anyone to open their card.
- **Search**: by name, nickname or year.
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

### Editing straight on GitHub (no setup)

1. Open [`data/team.js`](data/team.js) on GitHub and click the pencil icon (**Edit this file**).
2. Make the change, e.g. add `nickname: "Shini"` inside `{ name: "Aditya Shinigami" }`.
3. Click **Commit changes**. With GitHub Pages switched on, the site updates in about a minute.

Keep the commas and quotes intact: each field is `key: "value",` and each person is one `{ ... },`.

## Adding photos

Photos are picked up automatically by file name. No code change needed.

1. Crop the photo roughly square (a face shot works best; it's shown in a circle).
2. Name it after the person's id: their name in lowercase with dashes, e.g. `vidhi-kapuria.jpg`, `prayag-mohanty.png`, `bhavadharini.jpg`. `.jpg`, `.jpeg`, `.png` and `.webp` all work.
3. On GitHub, open the [`photos/`](photos) folder, click **Add file → Upload files**, drop the images in and commit.

Anyone without a photo gets their initials instead. To use a different file name, set `photo: "photos/whatever.jpg"` on that person. Keep photos under ~300 KB so the page stays fast.

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
