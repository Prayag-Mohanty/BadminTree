# IITB Badminton Team Tree

An interactive family tree of the IIT Bombay Badminton team: every player, batch by batch, with their roles, achievements, who brought them in, and the extended family of coaches, managers and friends who were part of the journey.

Made so the next fresher who asks "who was that?" gets an answer in one tap.

## What's on the page

Three tabs:

- **Team Tree**: a curving trunk with one knot per batch (the year they joined IIT Bombay), newest at the top. It grows from the roots on load and a shuttlecock drops down the trunk as you scroll. The tree shows first names; tap anyone for their full name, nicknames, Inter IIT years, results and story. A gold ring marks an Inter IIT player. Search by name or year, or filter to Inter IIT players (all, or one year). The coaches are listed below the tree.
- **Inter IIT**: each Inter IIT Sports Meet with its host, result and squad.
- **Trophy Cabinet**: every tournament, league and award, newest first, with team rosters.

Links: `…/#trophies` and `…/#inter-iit` open a tab; `…/#vidhi-kapuria` opens that player's card. There's a light/dark toggle at the top.

## Editing the data

Everything lives in [`data/team.js`](data/team.js); the field list is at the top of that file. A filled-in player looks like:

```js
{
  name: "Prayag Mohanty",
  nicknames: ["Sugardaddy"],
  program: "…",
  roles: ["Captain 2026-27"],
  interIIT: [{ year: 2025, position: "Men's team, 4th" }],
  mentor: "keshav-samdani",   // id = name in lowercase with dashes
}
```

- **New batch**: add a year under `batches`, e.g. `2027: [{ name: "New Fresher" }]`.
- **Inter IIT**: add the meet to `interIITMeets` (`{ year, host, result }`) and `{ year, position }` to each player who played.
- **Results**: add a tournament to `events`, with one line per result. Name people by id (or by plain name if they're not on the tree); team results can list a captain/manager (`role` + `who`) and `members`.
- **Short names**: the tree shows first names; set `shortName` if someone goes by something else.
- **Year unknown**: people in `yearUnknown` sit at the roots under a "?" until you move them into a batch.

## Stories

Each person's story is a text file: `stories/<id>.md` (e.g. `stories/vidhi-kapuria.md`). Blank lines start new paragraphs; `*italics*` and `**bold**` work.

The easiest way: open someone's card on the live site and click **Write their story** (or **Edit story**). It opens that exact file in GitHub's editor; write it, click **Commit changes**, and it's live in about a minute.

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
