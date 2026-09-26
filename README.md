# BadminTree

The tree of the IIT Bombay Badminton team: every player batch by batch, with their nicknames, Inter IIT years, results and lore, plus the club's leadership, coaches and trophy cabinet.

Made so the next fresher who asks "who was that?" gets an answer in one tap.

**Live site:** https://badmin-tree.vercel.app/ (also mirrored at https://prayag-mohanty.github.io/BadminTree/)

## What's on the site

Three tabs:

- **Team Tree**: a curving trunk with one knot per batch (the year they joined IIT Bombay), newest at the top. It grows from the roots on load and a shuttlecock drops down the trunk as you scroll. The tree shows first names; tap anyone for their full name, nicknames, roles, Inter IIT years, results and lore. A gold ring marks an Inter IIT player. Search by name or year, or filter to Inter IIT players (all, or one year). Club Leadership (secretary and convenors by year) and the coaches sit below the tree.
- **Inter IIT**: each Inter IIT Sports Meet with its host, result and squad, including captains.
- **Trophy Cabinet**: one dropdown per tournament, split into inter-college and on-campus. Year buttons switch between editions; each category shows its podium.

Links: `…/#inter-iit` and `…/#trophies` open a tab; `…/#vidhi-kapuria` opens that player's card. There's a light/dark toggle at the top.

## How the repo is laid out

| Path | What it holds |
| --- | --- |
| `data/team.js` | All the content: players, Inter IIT meets, results, leadership, coaches |
| `stories/<id>.md` | Each person's lore (one file per person) |
| `photos/<id>.jpg` | One profile photo per person (picked up automatically) |
| `gallery/<id>/` | Extra photos of that person, shown on their card |
| `assets/` | Logos as single-colour SVGs, recoloured by the theme |
| `index.html`, `styles.css`, `app.js` | The site itself; no build step |

A person's **id** is their full name in lowercase with dashes: "Vidhi Kapuria" is `vidhi-kapuria`.

## Editing the data

Everything lives in [`data/team.js`](data/team.js); the full field list is at the top of that file. A filled-in player looks like:

```js
{
  name: "Radhika Bansal",
  nicknames: ["Chhoti Si"],
  interIIT: [{ year: 2024, position: "Women's team captain" }],
  mentor: "…",   // id of the senior who brought them in
}
```

- **New batch**: add a year under `batches`, e.g. `2027: [{ name: "New Fresher" }]`.
- **Joining year unknown**: put the person in `yearUnknown`; they sit under a "?" at the roots until you move them into a batch.
- **Inter IIT**: add the meet to `interIITMeets` (`{ year, host, result }`) and `{ year, position }` to each player who played.
- **Results**: add a tournament to `events`, one line per result. Name people by id (or by plain name if they're not on the tree). Team results can list a captain or manager (`role` + `who`) and `members`; doubles pairs go in `who` as a list. Record placings only (1, 2, 3, 4), not scorelines. Mark events against other colleges with `scope: "inter-college"`.
- **Leadership**: add each year to `leadership` (secretary and convenors). The roles show on each person's card automatically.
- **Coaches**: add them to `family`. They get cards (with Edit) but no place on the tree.
- **Short names**: the tree shows first names; set `shortName` if someone goes by something else.

### Editing straight on GitHub (no setup)

1. Open [`data/team.js`](data/team.js) on GitHub and click the pencil icon (**Edit this file**).
2. Make the change, e.g. add `nicknames: ["Shini"]` inside `{ name: "Aditya Shinganmakki" }`.
3. Click **Commit changes**. The site redeploys in about a minute.

Keep the commas and quotes intact: each field is `key: "value",` and each person is one `{ ... },`.

## Editing from the site

Every card (players and coaches) has an **Edit** button: rewrite their lore, replace the profile photo, or add photos to the person's gallery. Anyone can edit; no GitHub account needed. **Save** writes the change to this repo and the site updates in about a minute.

Saving goes through a small function, [`api/save.js`](api/save.js), which runs on Vercel and holds the only GitHub token. It only accepts edits to people already on the site, and only lore and JPEG photos. Every edit is a normal commit, so anything unwanted can be reverted from the repo's history.

### One-time setup (site owner)

1. Import this repo on [Vercel](https://vercel.com/new) (Framework preset: **Other**) and deploy.
2. [Create a fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new): **Only select repositories → BadminTree**, **Contents: Read and write**.
3. In Vercel → Project → **Settings → Environment Variables**, add:
   - `GITHUB_TOKEN`: the token from step 2 (required).
   - `EDIT_PASSCODE`: optional. If set, editors enter this passcode once per device (share it in the team group). Leave it out to let anyone edit.
4. Redeploy (Deployments → ⋯ → Redeploy) so the variables take effect.

`editApi` in `data/team.js` points at `https://badmin-tree.vercel.app/api/save`, so the Edit button works on both the Vercel site and the GitHub Pages copy.

What gets saved where:

| Change | File |
| --- | --- |
| Lore | `stories/<id>.md` |
| Profile photo (cropped square, 480 px) | `photos/<id>.jpg` |
| Gallery photos (up to 1600 px) | `gallery/<id>/<timestamp>.jpg` |

## Lore

Each person's lore is a text file: `stories/<id>.md`. Blank lines start new paragraphs; `*italics*` and `**bold**` work. Several write-ups can live in one file (the site shows them in order), which is how the Know Your Team write-ups from different years stack up. The easiest way to write it is the **Edit** button on their card.

## Adding photos

The easiest way is the **Edit** button on the person's card. To add photos by hand instead:

1. Crop the photo roughly square (a face shot works best; it's shown in a circle).
2. Name it after the person's id, e.g. `vidhi-kapuria.jpg`. `.jpg`, `.jpeg`, `.png` and `.webp` all work.
3. On GitHub, open the [`photos/`](photos) folder, click **Add file → Upload files**, drop the images in and commit.

Anyone without a photo gets their initials. Gallery photos go in `gallery/<id>/`. To use a different profile photo file name, set `photo: "photos/whatever.jpg"` on that person.

## Running it locally

No build step and no dependencies. Serve the folder and open it in a browser:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly works too, but lore only loads when the folder is served.

## Publishing on GitHub Pages

The repo includes `.github/workflows/pages.yml`, which deploys on every push to `main`. To switch it on:

1. Go to **Settings → Pages** in this repo.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push (or merge) to `main`. The site goes live at https://prayag-mohanty.github.io/BadminTree/.

After that, any teammate with access can update the tree by editing `data/team.js`, `stories/` or `photos/` right on GitHub, and the site redeploys on its own.
