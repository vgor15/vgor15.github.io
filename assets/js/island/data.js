/* VYOM ISLAND: zones, characters, story lines and achievements.
   Everything a visitor reads comes from here or from window.SITE
   (the same content the /admin panel edits). Plain words, no jargon. */

const S = () => window.SITE || {};

/* Each zone is a place on the island and a real page of the site.
   pos = [x, z] on the island, npc = who greets you there. */
export const ZONES = [
  { id: "plaza", name: "Welcome Plaza", icon: "📡", pos: [0, 0], r: 8, href: "/", color: "#ff6a3d",
    npc: { name: "VY-01", bot: true, at: [3.4, 3.6], voice: 880 } },
  { id: "workshop", name: "The Workshop", icon: "🛠️", pos: [23, -12], r: 9, href: "/work", color: "#ffb21e",
    npc: { name: "Tink", at: [0, 6.2], voice: 520, look: { hair: "#151515", body: "#ffb21e", skin: "#8d5a3b", hat: "hardhat", hatColor: "#ffe14d", face: "grin", extra: "none" } } },
  { id: "garden", name: "Skill Garden", icon: "🌱", pos: [-23, -11], r: 9, href: "/machine", color: "#35c46a",
    npc: { name: "Sprout", at: [3.4, 3.2], voice: 640, look: { hair: "#c0392b", body: "#35c46a", skin: "#ffd2a8", hat: "beanie", hatColor: "#ff5d8f", face: "smile", extra: "scarf" } } },
  { id: "busstop", name: "CAN Bus Stop", icon: "🚌", pos: [25, 14], r: 8, href: "/lab/can-bus", color: "#3d7bff",
    npc: { name: "Captain Bus", at: [-2.6, 0.4], voice: 300, look: { hair: "#eeeeee", body: "#3d7bff", skin: "#c68863", hat: "cap", hatColor: "#1d2a6b", face: "smile", extra: "none" } } },
  { id: "arcade", name: "The Arcade", icon: "🕹️", pos: [-3, -26], r: 8, href: "/lab", color: "#a35cff",
    npc: { name: "Pixel", at: [0, 2.8], voice: 1040, look: { hair: "#7b5cff", body: "#a35cff", skin: "#ffe0bd", hat: "headphones", hatColor: "#ff2d95", face: "cool", extra: "none" } } },
  { id: "house", name: "Vyom's House", icon: "🏡", pos: [-22, 14], r: 8, href: "/about", color: "#ff5d8f",
    npc: { name: "Vyom", at: [0, 2.2], voice: 420, look: { hair: "#151515", body: "#2d2a7a", skin: "#c98b62", hat: "none", hatColor: "#111", face: "smile", extra: "backpack" } } },
  { id: "post", name: "Post Office", icon: "📮", pos: [3, 26], r: 8, href: "/contact", color: "#ff3b3b",
    npc: { name: "Postie", at: [-2.4, 1.6], voice: 720, look: { hair: "#e3b26b", body: "#ff3b3b", skin: "#ffd2a8", hat: "cap", hatColor: "#ffffff", face: "grin", extra: "backpack" } } },
  { id: "library", name: "The Library", icon: "📚", pos: [12, -23], r: 8, href: "/writing", color: "#7b5cff",
    npc: { name: "Page", at: [-2.2, 2.6], voice: 560, look: { hair: "#5a3825", body: "#7b5cff", skin: "#e8b48a", hat: "beanie", hatColor: "#ffd23f", face: "smile", extra: "scarf" } } },
];
export const zone = (id) => ZONES.find((z) => z.id === id);

/* Story lines. Each returns an array of steps: { t: text, choices?: [{ label, act }] } */
export const LINES = {
  intro: () => [
    { t: `Hey there! I'm VY-01, the little robot who looks after ${S().first || "Vyom"}'s island.` },
    { t: `${S().name || "Vyom Gor"} builds the tiny brains inside machines: the code that makes lights blink, buttons answer and cars talk to themselves.` },
    { t: "Every building here is a piece of his story. Meet the folks, play the games, and keep an eye out for eight lost chips. They glow!" },
    { t: "Tap or click the ground to walk. On a keyboard, use W A S D or the arrow keys. Drag to turn the view." },
    { t: "But first, want to give yourself a fresh look?", choices: [{ label: "Maybe later", act: "skip" }, { label: "Let's do it!", act: "style" }] },
  ],
  plaza: () => [
    { t: `Welcome back! ${S().first || "Vyom"} is ${(S().status || "building").toLowerCase().includes("vvdn") ? "busy building things at VVDN in Bengaluru" : "busy building things"}.` },
    { t: "Not sure where to go? The map at the bottom takes you anywhere in one tap.", choices: [{ label: "Open the map", act: "map" }, { label: "I'll wander", act: "close" }] },
  ],
  workshop: () => [
    { t: "Welcome to the Workshop! Every stand out here is something Vyom built." },
    { t: "Walk up to a stand, or open the whole list. Each one has a short story and a link.", choices: [{ label: "Show me everything", act: "panel" }, { label: "I'll look around", act: "close" }] },
  ],
  garden: () => [
    { t: "Shh, the skills are growing. Each plant here is something Vyom knows how to do." },
    { t: "The more he practises, the taller they get. Want the full list?", choices: [{ label: "Show the skills", act: "panel" }, { label: "Just looking", act: "close" }] },
  ],
  busstop: () => [
    { t: "All aboard the CAN bus! In cars, tiny computers chat over a shared wire called a CAN bus. This one carries people instead." },
    { t: "Vyom built a real one with two little circuit boards talking to each other. Fancy a ride around the island?", choices: [{ label: "Hop on!", act: "ride" }, { label: "Play the real demo", act: "go" }, { label: "Later", act: "close" }] },
  ],
  arcade: () => [
    { t: "Player one has entered! These games are tiny, silly and a little bit nerdy." },
    { t: "Pick one. High scores unlock achievements.", choices: [{ label: "Packet Catch", act: "game:packets" }, { label: "Bit Flip", act: "game:bits" }, { label: "More toys", act: "panel" }] },
  ],
  house: () => [
    { t: `Oh hi! I'm ${S().first || "Vyom"}. Come in, mind the cables.` },
    { t: "I studied in Kutch and Ahmedabad, and now I build things in Bengaluru. Off the clock: anime, games, swimming, hiking and hunting for good food." },
    { t: "Want the longer story?", choices: [{ label: "Tell me more", act: "panel" }, { label: "Get the résumé", act: "resume" }, { label: "Bye!", act: "close" }] },
  ],
  post: () => [
    { t: "Got something to say to Vyom? A job, a project, or just hello?" },
    { t: "Drop it in the big red box and I'll make sure it lands.", choices: [{ label: "Write to Vyom", act: "panel" }, { label: "Not now", act: "close" }] },
  ],
  library: () => [
    { t: "Welcome to the Library! Vyom writes short stories about what he learns at the bench: buses, shells, pointers and bugs." },
    { t: "Grab something to read. The notes shelf has quick thoughts, and the logbook shows every change to this island.", choices: [{ label: "Notes and logbook", act: "panel:notes" }, { label: "Read his posts", act: "panel" }] },
  ],
  chips: () => [{ t: "Whoa, you found all eight lost chips! Every machine on the island is running at full power now. Thank you!" }],
  bus_done: () => [{ t: "Thanks for riding the CAN bus! Every stop delivered right on time." }],
  explorer: () => [{ t: "You've seen every corner of the island. VY-01 is officially impressed! Check your progress any time from the trophy button." }],
};

/* Achievements: unlocked once, saved on this device only. */
export const ACH = [
  { id: "hello", icon: "👋", title: "Hello, world", text: "Stepped onto the island." },
  { id: "style", icon: "🧢", title: "Fresh fit", text: "Gave your avatar a new look." },
  { id: "steps", icon: "👟", title: "First steps", text: "Walked somewhere on your own." },
  { id: "visit-plaza", icon: "📡", title: "Tower talk", text: "Chatted with VY-01 at the plaza." },
  { id: "visit-workshop", icon: "🛠️", title: "Tool time", text: "Visited the Workshop." },
  { id: "visit-garden", icon: "🌱", title: "Green thumb", text: "Visited the Skill Garden." },
  { id: "visit-busstop", icon: "🚏", title: "Next stop", text: "Visited the CAN Bus Stop." },
  { id: "visit-arcade", icon: "🕹️", title: "Player one", text: "Visited the Arcade." },
  { id: "visit-house", icon: "🏡", title: "Knock knock", text: "Visited Vyom's House." },
  { id: "visit-post", icon: "📮", title: "You've got mail", text: "Visited the Post Office." },
  { id: "visit-library", icon: "📚", title: "Bookworm", text: "Visited the Library." },
  { id: "explorer", icon: "🗺️", title: "Island explorer", text: "Visited every place on the island." },
  { id: "bus", icon: "🚌", title: "Bus rider", text: "Rode the CAN bus all the way round." },
  { id: "packets", icon: "📦", title: "Packet catcher", text: "Caught 15 packets in one game." },
  { id: "bits", icon: "💡", title: "Bit wizard", text: "Solved three Bit Flip puzzles." },
  { id: "project", icon: "🔎", title: "Curious mind", text: "Opened a project up close." },
  { id: "map", icon: "🧭", title: "Map reader", text: "Travelled with the map." },
  { id: "night", icon: "🌙", title: "Night owl", text: "Switched the island to night." },
  { id: "tower", icon: "📶", title: "Signal boost", text: "Tapped the signal tower five times." },
  { id: "letter", icon: "✉️", title: "Pen pal", text: "Opened the way to write to Vyom." },
  { id: "chip", icon: "💾", title: "Shiny!", text: "Picked up a lost chip." },
  { id: "chips", icon: "🧩", title: "Chip collector", text: "Found all eight lost chips." },
  { id: "reader", icon: "📖", title: "Deep diver", text: "Read a post or played a lab toy." },
];

/* Looks for the avatar maker. */
export const LOOKS = {
  body: ["#ff6a3d", "#ffb21e", "#35c46a", "#3d7bff", "#a35cff", "#ff5d8f", "#2d2a7a", "#20c5c5"],
  hair: ["#2b1d14", "#5a3825", "#a0522d", "#e3b26b", "#151515", "#c0392b", "#7b5cff", "#eeeeee"],
  skin: ["#ffe0bd", "#ffd2a8", "#e8b48a", "#c98b62", "#8d5a3b", "#5c3a24"],
  hat: ["none", "cap", "beanie", "hardhat", "headphones", "crown"],
  hatColor: ["#ffffff", "#1d2a6b", "#ffe14d", "#ff2d95", "#35c46a", "#111111"],
  face: ["smile", "grin", "cool", "wow"],
  extra: ["none", "backpack", "scarf", "cape"],
};
export const DEFAULT_LOOK = { body: "#3d7bff", skin: "#ffd2a8", hair: "#5a3825", hat: "cap", hatColor: "#ffe14d", face: "smile", extra: "none" };
