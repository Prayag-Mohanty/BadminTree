/*
 * IIT Bombay Badminton Team Tree: the data.
 *
 * Everything on the site comes from this file, plus photos/ and stories/.
 * Every field except `name` is optional; leave out what you don't know.
 *
 * PLAYERS (under `batches`, keyed by the year they joined IIT Bombay)
 *   name        Full name (required). The player's id is the name in
 *               lowercase with dashes: "Vidhi Kapuria" -> "vidhi-kapuria".
 *   nicknames   ["Baddy"] or several: ["Sugardaddy", "..."].
 *   program     e.g. "B.Tech, Mechanical", "M.Tech, CSE".
 *   hostel      e.g. "H2".
 *   roles       e.g. ["Captain 2025-26"].
 *   interIIT    Every Inter IIT Sports Meet they played, e.g.
 *               [{ year: 2025, position: "Women's team, 3rd" }]
 *               The host of each year is listed in `interIITMeets` below.
 *   mentor      id of the senior who brought them in, e.g. "prayag-mohanty".
 *   instagram   Handle without the @.
 *   photo       Only needed if the picture isn't photos/<id>.jpg
 *               (.jpeg/.png/.webp also work automatically).
 *
 * STORIES live in stories/<id>.md, one file per person. The "Write story"
 * button on each player's card opens that file on GitHub.
 *
 * RESULTS go in `events`. Each result names the player by id (links to
 * their card) or by plain name (for people not on the tree).
 *   place: 1 = Winner, 2 = Runner-up, 3 = Third, "award" = special award.
 *   Add `label` to override the wording.
 */
window.TEAM_DATA = {
  club: "IIT Bombay Badminton",
  instagram: "badmintonclub_iitbombay",

  // Where the site's "Write story" buttons point.
  github: { repo: "Prayag-Mohanty/IITB-Badminton-Team-Tree", branch: "main" },

  batches: {
    2026: [
      { name: "Aditya Shinigami" },
      { name: "Kaushik Ranjan Nath" },
      { name: "Vidhi Kapuria" },
      { name: "Bhavadharini" },
      { name: "Nitya" },
    ],
    2025: [
      { name: "Rachel Singhal", nicknames: ["Baddy"], interIIT: [{ year: 2025 }] },
      { name: "Shriya Nazary", nicknames: ["Salsa"], interIIT: [{ year: 2025 }] },
      { name: "Tushar Meena" },
      { name: "Rishabh Meena" },
    ],
    2024: [
      { name: "Prayag Mohanty", nicknames: ["Sugardaddy"], interIIT: [{ year: 2025 }] },
      { name: "Aarnav Girish", nicknames: ["StillHomesick"], interIIT: [{ year: 2025 }] },
      { name: "Radhika Bansal" },
      { name: "Arya Patil", interIIT: [{ year: 2025 }] },
      { name: "Garima" },
      { name: "Gopal Verma" },
    ],
    2023: [
      { name: "Shlok" },
      { name: "Ekam Noor", nicknames: ["Sarso Ka Smash"], interIIT: [{ year: 2025 }] },
      { name: "Sai Charan", nicknames: ["Gyaan Doo?"], interIIT: [{ year: 2025 }] },
      { name: "Prakhar Jain", nicknames: ["Absentee"], interIIT: [{ year: 2025 }] },
      { name: "Kalp" },
      { name: "Yajat", nicknames: ["Spiderman"], interIIT: [{ year: 2025 }] },
      { name: "Aadish" },
    ],
    2022: [
      { name: "Prayash", nicknames: ["Goldman"], interIIT: [{ year: 2025 }] },
      { name: "Bhavya Mittal" },
      { name: "Sharvanee", nicknames: ["Limpy Kid"], interIIT: [{ year: 2025 }] },
      { name: "Keshav Samdani" },
      { name: "Hemant Kabra" },
      { name: "Yaswanth Juluva" },
    ],
    2021: [
      { name: "Tanay" },
      { name: "Gopal" },
    ],
  },

  // Players whose joining year isn't known yet. They sit at the roots
  // until you move them into the right batch above.
  yearUnknown: [
    { name: "Suryakant", nicknames: ["Suryasth"], interIIT: [{ year: 2025 }] },
  ],

  interIITMeets: [
    { year: 2025, host: "IIT Madras", result: "" },
  ],

  events: [
    {
      name: "Institute Badminton Open",
      year: 2026,
      results: [
        { category: "Men's Singles", place: 1, who: "kaushik-ranjan-nath" },
        { category: "Men's Singles", place: 2, who: "ekam-noor" },
        { category: "Men's Singles", place: 3, who: "Bhanu Bisht" },
        { category: "Women's Singles", place: 1, who: "rachel-singhal" },
        { category: "Women's Singles", place: 2, who: "bhavya-mittal" },
        { category: "Women's Singles", place: 3, who: "nitya" },
      ],
    },
    {
      name: "PG Badminton Tournament",
      year: 2026,
      results: [
        { category: "Men's Doubles", place: 1, who: "prayag-mohanty" },
        { category: "Men's Singles", place: 3, who: "prayag-mohanty" },
        { category: "Women's Singles", place: 1, who: "nitya" },
      ],
    },
    {
      name: "Institute Badminton League",
      year: null, // add the year
      results: [
        { category: "Team Titans (captain)", place: 2, who: "aarnav-girish" },
        { category: "Team Gladiators (captain)", place: 3, who: "gopal-verma" },
        { category: "Most Valuable Player (Men)", place: "award", who: "prakhar-jain" },
        { category: "Most Valuable Player (Women)", place: "award", who: "rachel-singhal" },
      ],
    },
  ],

  // The extended family: coaches, managers, friends of the team.
  // { name: "…", role: "Coach", years: "2019-present", note: "…" }
  family: [],
};
