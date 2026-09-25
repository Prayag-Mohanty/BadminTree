/*
 * IIT Bombay Badminton Team Tree: the data.
 *
 * This is the only file you need to edit to keep the tree up to date.
 * Every field except `name` is optional; leave out what you don't know.
 *
 * Player fields
 *   name          Full name (required). Also used to build the player's id,
 *                 e.g. "Vidhi Kapuria" -> "vidhi-kapuria".
 *   nickname      What the team actually calls them.
 *   squad         "Men's" / "Women's" (used for the squad filter).
 *   program       e.g. "B.Tech, Mechanical", "Dual Degree, EE".
 *   hostel        e.g. "H2".
 *   roles         e.g. ["Captain 2025-26", "Vice-captain 2024-25"].
 *   achievements  List of { year, title } objects.
 *   mentor        id of the senior who brought them in / mentored them,
 *                 e.g. "prayag-mohanty". Draws the "lineage" in the tree.
 *   instagram     Handle without the @.
 *   photo         Only needed if the picture isn't at photos/<id>.jpg.
 *                 Photos named after the id (photos/vidhi-kapuria.jpg, .png,
 *                 .jpeg or .webp) show up automatically.
 *   note          One line that tells a fresher who this person is.
 *
 * Family fields (people who weren't on the roster but were part of the story:
 * coaches, managers, markers, hostel friends who never missed a match...)
 *   name, role, years (e.g. "2022-2024"), note, instagram, photo
 */
window.TEAM_DATA = {
  club: "IIT Bombay Badminton",
  instagram: "badmintonclub_iitbombay",

  // Batches are keyed by the year the players joined the team.
  batches: {
    2026: [
      { name: "Aditya Shinigami" },
      { name: "Kaushik Nath" },
      { name: "Vidhi Kapuria" },
      { name: "Bhavadharini" },
      { name: "Nitya" },
    ],
    2025: [
      { name: "Rachel Singhal" },
      { name: "Shriya Nazary" },
      { name: "Tushar Meena" },
      { name: "Rishabh Meena" },
    ],
    2024: [
      { name: "Prayag Mohanty", note: "Planted this tree." },
      { name: "Aarnav Girish" },
      { name: "Radhika Bansal" },
      { name: "Arya Patil" },
      { name: "Garima" },
    ],
    2023: [
      { name: "Shlok" },
      { name: "Ekam Noor" },
      { name: "Sai Charan" },
      { name: "Prakhar Jain" },
      { name: "Kalp" },
      { name: "Yajat" },
      { name: "Aadish" },
    ],
    2022: [
      { name: "Prayash" },
      { name: "Bhavya Mittal" },
      { name: "Sharvanee" },
      { name: "Keshav Samdani" },
    ],
    2021: [
      { name: "Tanay" },
      { name: "Gopal" },
    ],
  },

  // Team-level results: Inter-IIT, PAN IIT, Mood Indigo, Techfest, etc.
  // e.g. { year: 2025, title: "Inter IIT Sports Meet: Men's team bronze" }
  teamAchievements: [],

  // The extended family. e.g.
  // { name: "Coach Name", role: "Coach", years: "2019-present", note: "..." }
  family: [],
};
