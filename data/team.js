/*
 * IIT Bombay Badminton Team Tree: the data.
 *
 * Everything on the site comes from this file, plus photos/ and stories/.
 * Every field except `name` is optional; leave out what you don't know.
 *
 * PLAYERS (under `batches`, keyed by the year they joined IIT Bombay)
 *   name        Full name (required). The tree shows only the first name;
 *               the full name shows on their card. The player's id is the
 *               full name in lowercase with dashes: "Vidhi Kapuria" ->
 *               "vidhi-kapuria".
 *   shortName   What to show on the tree if not the first name.
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
 * RESULTS go in `events`. People are named by id (links to their card) or
 * by plain name (for people not on the tree).
 *   category  What the result is for: "Men's Singles", "Team Titans"...
 *   place     1 = Winner, 2 = Runner-up, 3 = Third, "award" = special award.
 *   who       The winner, or the captain/manager of a team.
 *   role      e.g. "Captain", "Manager" (shown before `who`).
 *   members   Everyone else in the team, e.g. ["yajat-sharma", "Vinamra"].
 *   label     Overrides the place wording; `note` adds a short remark.
 * An event's `year` is used for sorting; `yearLabel` (e.g. "2025-26")
 * changes what's displayed.
 */
window.TEAM_DATA = {
  club: "IIT Bombay Badminton",
  instagram: "badmintonclub_iitbombay",

  // Where the site's "Write story" buttons point.
  github: { repo: "Prayag-Mohanty/IITB-Badminton-Team-Tree", branch: "main" },

  // Batches are keyed by the year the players joined IIT Bombay.
  batches: {
    2026: [
      { name: "Aditya Shinganmakki" },
      { name: "Kaushik Ranjan Nath" },
      { name: "Vidhi Kapuria" },
      { name: "Bhavadharini V" },
      { name: "Nitya" },
    ],
    2025: [
      { name: "Rachel Singhal", nicknames: ["Baddy"], interIIT: [{ year: 2025 }] },
      { name: "Shriya Narzary", nicknames: ["Salsa"], interIIT: [{ year: 2025 }] },
      { name: "Tushar Meena" },
      { name: "Rishabh Meena" },
      { name: "Aditi Nimbolkar" },
    ],
    2024: [
      { name: "Prayag Mohanty", nicknames: ["Sugardaddy"], interIIT: [{ year: 2025 }] },
      { name: "Aarnav Girish", nicknames: ["StillHomesick"], interIIT: [{ year: 2025 }] },
      { name: "Radhika Bansal" },
      { name: "Arya Patil", interIIT: [{ year: 2025 }] },
      { name: "Garima Pradutt" },
      { name: "Gopal Verma" },
      { name: "Suryakant Priyadarshan", nicknames: ["Suryasth"], interIIT: [{ year: 2025 }] },
      { name: "Bipin Dehariya" },
    ],
    2023: [
      { name: "Shlok Agrawal" },
      { name: "Ekam Noor Singh", nicknames: ["Sarso Ka Smash"], interIIT: [{ year: 2025 }] },
      { name: "Sai Charan", nicknames: ["Gyaan Doo?"], interIIT: [{ year: 2025 }] },
      { name: "Prakhar Jain", nicknames: ["Absentee"], interIIT: [{ year: 2025 }] },
      { name: "Kalp Rawat" },
      { name: "Yajat Sharma", nicknames: ["Spiderman"], interIIT: [{ year: 2025 }] },
      { name: "Aadish Vohra" },
      { name: "Arshit Singh" },
      { name: "Arjun Kabra" },
    ],
    2022: [
      { name: "Prayash Sahu", nicknames: ["Goldman"], interIIT: [{ year: 2025 }] },
      { name: "Bhavya Mittal" },
      { name: "Sharvanee Sonawane", nicknames: ["Limpy Kid"], interIIT: [{ year: 2025 }] },
      { name: "Keshav Samdani" },
      { name: "Hemant Kabra" },
      { name: "Yaswanth Juluva" },
    ],
    2021: [
      { name: "Tanay Tayal" },
      { name: "Gopal" },
    ],
  },

  // Players whose joining year isn't known yet. They sit at the roots
  // under a "?" until you move them into the right batch above.
  yearUnknown: [],

  interIITMeets: [
    { year: 2025, host: "IIT Madras", result: "Lost in the quarterfinals" },
    {
      year: 2024,
      host: "", // add the host
      result: "Men's team: Runner-up, our best finish in 12 years. IIT Bombay were also overall sports champions.",
    },
  ],

  events: [
    {
      name: "Institute Badminton Open",
      year: 2026,
      results: [
        { category: "Men's Singles", place: 1, who: "kaushik-ranjan-nath" },
        { category: "Men's Singles", place: 2, who: "ekam-noor-singh" },
        { category: "Men's Singles", place: 3, who: "Bhanu Bisht" },
        { category: "Women's Singles", place: 1, who: "rachel-singhal" },
        { category: "Women's Singles", place: 2, who: "bhavya-mittal" },
        { category: "Women's Singles", place: 3, who: "nitya" },
      ],
    },
    {
      name: "PG Mania",
      year: 2026,
      results: [
        { category: "Men's Doubles", place: 1, who: "prayag-mohanty" },
        { category: "Men's Singles", place: 3, who: "prayag-mohanty" },
        { category: "Women's Singles", place: 1, who: "nitya" },
      ],
    },
    {
      name: "Institute Badminton League",
      year: 2026,
      results: [
        { category: "Team Titans", place: 2, role: "Captain", who: "aarnav-girish", members: ["yajat-sharma", "rachel-singhal"] },
        { category: "Team Gladiators", place: 3, role: "Captain", who: "gopal-verma", members: ["sai-charan", "Shelendra", "aditi-nimbolkar", "keshav-samdani"] },
        { category: "Team Vortex", members: ["bhavya-mittal", "prakhar-jain"] },
        { category: "Most Valuable Player (Men)", place: "award", who: "prakhar-jain" },
        { category: "Most Valuable Player (Women)", place: "award", who: "rachel-singhal" },
      ],
    },
    {
      name: "Hostel General Championship",
      year: 2025.5,
      yearLabel: "2025-26",
      results: [
        { category: "Men's · H3+8", place: 1, members: ["ekam-noor-singh", "yajat-sharma", "bipin-dehariya"] },
        { category: "Men's · H2+7", place: 2, members: ["shlok-agrawal", "aarnav-girish", "arshit-singh", "kalp-rawat", "aadish-vohra", "keshav-samdani"] },
        { category: "Men's · H6+18", place: 3, members: ["sai-charan", "prayash-sahu"] },
        { category: "Women's · H10", place: 1, members: ["bhavadharini-v", "sharvanee-sonawane"] },
        { category: "Women's · H11+21", place: 2 },
        { category: "Women's · H16C", place: 3, members: ["rachel-singhal"] },
      ],
    },
    {
      name: "Institute Badminton Open",
      year: 2025,
      results: [
        { category: "Men's Singles", place: 1, who: "prakhar-jain" },
        { category: "Men's Singles", place: 2, who: "ekam-noor-singh" },
        { category: "Men's Singles", place: 3, who: "aarnav-girish" },
        { category: "Women's Singles", place: 1, who: "shriya-narzary" },
        { category: "Women's Singles", place: 2, who: "sharvanee-sonawane" },
        { category: "Women's Singles", place: 3, who: "bhavadharini-v" },
      ],
    },
    {
      name: "PG Mania",
      year: 2025,
      results: [{ category: "Men's Singles", place: 1, who: "prayag-mohanty" }],
    },
    {
      name: "Institute Badminton League",
      year: 2025,
      results: [
        {
          category: "Team Titans",
          place: 1,
          role: "Manager",
          who: "arshit-singh",
          members: ["prayag-mohanty", "kalp-rawat", "tanay-tayal", "Tejal Sharan", "suryakant-priyadarshan", "keshav-samdani"],
        },
        { category: "Team Gladiators", place: 2, role: "Manager", who: "Vinamra", members: ["prayash-sahu", "Jathin Sai Ganesh"] },
        { category: "Team Vortex", place: 3, role: "Manager", who: "arjun-kabra", members: ["shlok-agrawal"] },
        { category: "Player of the Tournament (Men)", place: "award", who: "Jathin Sai Ganesh" },
        { category: "Player of the Tournament (Women)", place: "award", who: "bhavadharini-v" },
      ],
    },
    {
      name: "Spardha, IIT BHU",
      year: 2025,
      results: [{ category: "Men's Team", place: 3 }],
    },
    {
      name: "Inter IIT Sports Meet",
      year: 2024,
      results: [
        { category: "Men's Team", place: 2, note: "Best finish in 12 years" },
        { category: "Overall Sports Championship", place: 1, who: "IIT Bombay" },
      ],
    },
    {
      name: "Udghosh, IIT Kanpur",
      year: 2024,
      results: [{ category: "Men's Team", place: 3 }],
    },
  ],

  // The extended family: coaches, managers, friends of the team.
  // { name: "…", role: "Coach", years: "2019-present", note: "…" }
  family: [
    { name: "Shelendra Rasaniya", role: "Head coach · Men's coach" },
    { name: "Namrata Ghole", role: "Women's coach" },
  ],
};
