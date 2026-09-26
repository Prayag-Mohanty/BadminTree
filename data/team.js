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
 *   roles       Extra roles, e.g. ["General Secretary, Sports 2024-25"].
 *               Secretary and convenor roles come from `leadership` below.
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
 *   place     1 = Winner, 2 = Runner-up, 3 = Third, 4 = Fourth,
 *             "award" = special award.
 *   who       The winner, or the captain/manager of a team. Use a list for
 *             doubles pairs or co-leads: ["sharvanee-sonawane", "sara-ahire"].
 *   role      e.g. "Captain", "Manager" (shown before `who`).
 *   members   Everyone else in the team, e.g. ["yajat-sharma", "Vinamra"].
 *   label     Overrides the place wording; `note` adds a short remark.
 * An event's `year` is used for sorting; `yearLabel` (e.g. "2025-26")
 * changes what's displayed. Set `scope: "inter-college"` for events
 * against other colleges; everything else is listed as on campus.
 * Record only the placing (1, 2, 3...), not match scores.
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
      { name: "Yash Kashyap" },
    ],
    2024: [
      { name: "Prayag Mohanty", nicknames: ["Sugardaddy", "Mota Bhai"], interIIT: [{ year: 2025 }, { year: 2024 }] },
      { name: "Aarnav Girish", nicknames: ["StillHomesick", "Mumma's Boy"], interIIT: [{ year: 2025 }, { year: 2024 }] },
      { name: "Radhika Bansal", nicknames: ["Chhoti Si"], interIIT: [{ year: 2024, position: "Women's team captain" }] },
      { name: "Arya Patil", nicknames: ["Flawless (self-claimed)"], interIIT: [{ year: 2025 }, { year: 2024 }] },
      { name: "Garima Pradutt", nicknames: ["Geet"], interIIT: [{ year: 2024 }] },
      { name: "Gopal Verma" },
      { name: "Suryakant Priyadarshan", nicknames: ["Suryasth"], interIIT: [{ year: 2025 }] },
      { name: "Bipin Dehariya" },
    ],
    2023: [
      { name: "Shlok Agrawal", nicknames: ["RR (Raftaar Returns)", "Raftaar"], interIIT: [{ year: 2024 }, { year: 2023 }] },
      { name: "Ekam Noor Singh", nicknames: ["Sarso Ka Smash", "AxelSingh"], interIIT: [{ year: 2025, position: "Men's team captain" }, { year: 2024 }] },
      { name: "Sai Charan", nicknames: ["Gyaan Doo?", "Aashiq", "Baaya"], interIIT: [{ year: 2025 }, { year: 2024 }, { year: 2023 }] },
      { name: "Prakhar Jain", nicknames: ["Absentee", "Baadalo Ka Raja"], interIIT: [{ year: 2025 }, { year: 2023 }] },
      { name: "Kalp Rawat" },
      { name: "Yajat Sharma", nicknames: ["Spiderman"], interIIT: [{ year: 2025 }] },
      { name: "Aadish Vohra", nicknames: ["Court Sick"], interIIT: [{ year: 2024, position: "Men's team captain" }] },
      { name: "Arshit Singh" },
      { name: "Arjun Kabra" },
    ],
    2022: [
      { name: "Prayash Sahu", nicknames: ["Goldman", "Gambhir"], interIIT: [{ year: 2025 }, { year: 2024 }] },
      { name: "Bhavya Mittal", nicknames: ["Bubbly"], interIIT: [{ year: 2023 }] },
      { name: "Sharvanee Sonawane", nicknames: ["Limpy Kid", "RG Queen", "Slow-Mo"], interIIT: [{ year: 2025, position: "Women's team captain" }, { year: 2023 }, { year: 2022 }] },
      { name: "Keshav Samdani" },
      { name: "Hemant Kabra" },
      { name: "Yaswanth Juluva" },
    ],
    2021: [
      { name: "Tanay Tayal" },
      { name: "Siddharth Farkiya", roles: ["General Secretary, Sports 2024-25"] },
      { name: "Gopal Maheshwari", nicknames: ["Chotiwala", "Feku"], interIIT: [{ year: 2023 }, { year: 2022 }] },
    ],
    2020: [
      { name: "Anuj Partani", nicknames: ["Secy"], interIIT: [{ year: 2022 }] },
    ],
  },

  // Players whose joining year isn't known yet. They sit at the roots
  // under a "?" until you move them into the right batch above.
  yearUnknown: [
    { name: "Soumya Mandal", nicknames: ["LeaDR", "Non Veg Lover"], interIIT: [{ year: 2023 }, { year: 2022 }] },
    { name: "Rupansh Kaushik", nicknames: ["Maverick", "Captain"], interIIT: [{ year: 2023 }, { year: 2022, position: "Men's team captain" }] },
    { name: "Lokesh Soni", nicknames: ["Loki"], interIIT: [{ year: 2023 }] },
    { name: "Aanya Verma", nicknames: ["Captain Cool"], interIIT: [{ year: 2023 }] },
    { name: "Tejal Sharan", nicknames: ["Designer Dadi"], interIIT: [{ year: 2023 }] },
    { name: "Sara Ahire", nicknames: ["Ms. Freshie"], interIIT: [{ year: 2023 }] },
    { name: "Gyan Bhushan", nicknames: ["Navy"], interIIT: [{ year: 2022 }] },
    { name: "Vaibhav Gupta", nicknames: ["Air Force"], interIIT: [{ year: 2022 }] },
    { name: "Sanika Langde", nicknames: ["Captain"], interIIT: [{ year: 2022, position: "Women's team captain" }] },
    { name: "Shainal Jain", nicknames: ["Robot"], interIIT: [{ year: 2022 }] },
    { name: "Srinithya", nicknames: ["Silencer"], interIIT: [{ year: 2022 }] },
  ],

  interIITMeets: [
    { year: 2025, host: "IIT Madras", result: "Lost in the quarterfinals" },
    { year: 2024, host: "IIT Indore", result: "Men's team: Runner-up, our best finish in 12 years. IIT Bombay were also overall sports champions." },
    { year: 2023, edition: "56th", host: "IIT Bombay", result: "Women's team: Silver" },
    { year: 2022, edition: "55th", host: "IIT Delhi", result: "Men's and women's teams: lost in the group stage" },
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
          members: ["prayag-mohanty", "kalp-rawat", "tanay-tayal", "tejal-sharan", "suryakant-priyadarshan", "keshav-samdani"],
        },
        { category: "Team Gladiators", place: 2, role: "Manager", who: "Vinamra", members: ["prayash-sahu", "Jathin Sai Ganesh"] },
        { category: "Team Vortex", place: 3, role: "Manager", who: "arjun-kabra", members: ["shlok-agrawal"] },
        { category: "Player of the Tournament (Men)", place: "award", who: "Jathin Sai Ganesh" },
        { category: "Player of the Tournament (Women)", place: "award", who: "bhavadharini-v" },
      ],
    },
    {
      name: "Spardha, IIT BHU",
      scope: "inter-college",
      year: 2025,
      results: [{ category: "Men's Team", place: 3, members: ["ekam-noor-singh", "sai-charan", "prakhar-jain", "aarnav-girish"] }],
    },
    {
      name: "Inter IIT Sports Meet",
      scope: "inter-college",
      year: 2024,
      results: [
        {
          category: "Men's Team",
          place: 2,
          note: "Best finish in 12 years",
          members: ["aadish-vohra", "shlok-agrawal", "ekam-noor-singh", "prayash-sahu", "sai-charan", "prayag-mohanty", "aarnav-girish"],
        },
        { category: "Overall Sports Championship", place: 1, who: "IIT Bombay", overall: true },
      ],
    },
    {
      name: "Udghosh, IIT Kanpur",
      scope: "inter-college",
      year: 2024,
      results: [{ category: "Men's Team", place: 3, members: ["ekam-noor-singh", "shlok-agrawal", "prakhar-jain", "sai-charan"] }],
    },
    {
      name: "Institute Doubles Open",
      year: 2025,
      results: [
        { category: "Men's Doubles", place: 1, who: ["ekam-noor-singh", "yajat-sharma"] },
        { category: "Men's Doubles", place: 2, who: ["shlok-agrawal", "Vinay"] },
        { category: "Men's Doubles", place: 3, who: ["Jathin Sai Ganesh", "Vishnu"] },
        { category: "Women's Doubles", place: 1, who: ["bhavya-mittal", "tejal-sharan"] },
        { category: "Women's Doubles", place: 2, who: ["Namrata", "Pallavi"] },
        { category: "Women's Doubles", place: 3, who: ["Kasturi", "Geeta"] },
        { category: "Mixed Doubles", place: 1, who: ["Namrata", "Gopal"] },
        { category: "Mixed Doubles", place: 2, who: ["prayash-sahu", "Vidya"] },
        { category: "Mixed Doubles", place: 3, who: ["prayag-mohanty", "Ritoo"] },
      ],
    },
    {
      name: "Hostel General Championship",
      year: 2024.5,
      yearLabel: "2024-25",
      results: [
        { category: "Men's · Hostel 6", place: 1, members: ["Rudraksh", "Jathin Sai Ganesh", "sai-charan", "prayash-sahu", "Vinamra"] },
        { category: "Men's · Hostel 2", place: 2, members: ["shlok-agrawal", "kalp-rawat", "keshav-samdani", "aadish-vohra", "Anurag"] },
        { category: "Men's · Hostel 3", place: 3, members: ["ekam-noor-singh", "Tamil", "yajat-sharma", "Damodar"] },
        { category: "Men's · Hostel 18", place: 4, members: ["suryakant-priyadarshan", "Raj", "lokesh-soni", "tanay-tayal"] },
      ],
    },
    {
      name: "Institute Badminton Open",
      year: 2024,
      results: [
        { category: "Men's Singles", place: 1, who: "shlok-agrawal" },
        { category: "Men's Singles", place: 2, who: "prakhar-jain" },
        { category: "Men's Singles", place: 3, who: "aadish-vohra" },
        { category: "Men's Singles", place: 4, who: "prayag-mohanty" },
        { category: "Women's Singles", place: 1, who: "bhavadharini-v" },
        { category: "Women's Singles", place: 2, who: "Tanuja Mishra" },
        { category: "Women's Singles", place: 3, who: "Vidya Jadhav" },
        { category: "Women's Singles", place: 4, who: "garima-pradutt" },
      ],
    },
    {
      name: "Institute Badminton League",
      year: 2024,
      results: [
        { category: "Team Hunters", place: 1, role: "Manager", who: "Shardul Kher" },
        { category: "Team Warriors", place: 2, role: "Manager", who: "tanay-tayal", members: ["aadish-vohra"] },
        { category: "Team Smashers", place: 3, role: "Co-led by", who: ["Aditya Vema Reddy", "bhavya-mittal"] },
        { category: "Player of the Tournament (Men)", place: "award", who: "lokesh-soni" },
      ],
    },
    {
      name: "Inter IIT Sports Meet",
      scope: "inter-college",
      year: 2023,
      results: [
        {
          category: "Women's Team",
          place: 2,
          label: "Silver",
          members: ["bhavya-mittal", "tejal-sharan", "aanya-verma", "sharvanee-sonawane", "sara-ahire"],
        },
      ],
    },
    {
      name: "Institute Doubles Open",
      year: 2023,
      results: [
        { category: "Men's Doubles", place: 1, who: ["Rijil", "suryakant-priyadarshan"] },
        { category: "Men's Doubles", place: 2, who: ["aadish-vohra", "Veer"] },
        { category: "Men's Doubles", place: 3, who: ["keshav-samdani", "Aditya"] },
        { category: "Women's Doubles", place: 1, who: ["sharvanee-sonawane", "sara-ahire"] },
        { category: "Women's Doubles", place: 2, who: ["Sarbani", "Nikita"] },
      ],
    },
    {
      name: "Institute Badminton Open",
      year: 2023,
      results: [
        { category: "Men's Singles", place: 1, who: "shlok-agrawal" },
        { category: "Men's Singles", place: 2, who: "soumya-mandal" },
        { category: "Men's Singles", place: 3, who: "lokesh-soni" },
        { category: "Women's Singles", place: 1, who: "aanya-verma" },
        { category: "Women's Singles", place: 2, who: "bhavya-mittal" },
        { category: "Women's Singles", place: 3, who: "Aastha Singh Chouhan" },
      ],
    },
  ],

  // Institute Badminton Secretary (3rd year) and Convenors (2nd year).
  // These also appear as roles on each person's card.
  leadership: [
    { year: "2026-27", secretary: ["radhika-bansal"], convenors: ["rishabh-meena", "yash-kashyap"] },
    { year: "2025-26", secretary: ["sai-charan"], convenors: ["radhika-bansal", "gopal-verma"] },
    { year: "2024-25", secretary: ["prayash-sahu"], convenors: ["arjun-kabra", "shlok-agrawal"] },
    { year: "2023-24", secretary: ["siddharth-farkiya"], convenors: ["prayash-sahu", "hemant-kabra"] },
    { year: "2022-23", secretary: ["anuj-partani"], convenors: ["siddharth-farkiya", "tanay-tayal"] },
  ],

  // Coaches, shown under the tree.
  // { name: "…", role: "Coach", years: "2019-present", note: "…" }
  family: [
    { name: "Shelendra Rasaniya", role: "Head coach · Men's coach" },
    { name: "Namrata Ghole", role: "Women's coach" },
  ],
};
