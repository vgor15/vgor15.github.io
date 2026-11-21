/* ============================================================
   VYOM GOR — SITE CONTENT
   Single source of truth. Every page renders from this file.
   ============================================================ */

const SITE = {
  name: "Vyom Gor",
  first: "Vyom",
  initials: ["V", "G"],
  role: "Embedded Software Engineer",
  tagline: "Close to the metal. Clear in the mind.",
  company: "VVDN Technologies",
  city: "Bengaluru",
  country: "India",
  tz: "Asia/Kolkata",
  tzLabel: "IST",
  pos: "N 12°58′19″ / E 77°35′40″",
  status: "BUILDING @ VVDN",
  // Local schedule used by the HUD's "VYOM::" chip (IST, Mon–Sat)
  schedule: { days: [1, 2, 3, 4, 5, 6], from: 9.5, to: 18.5 },
  github: { user: "vgor15", contributions: 54, repos: 19 },

  // Email is assembled only when a visitor asks for it (keeps it out of the HTML).
  mail: { u: [118, 121, 111, 109, 103, 111, 114, 49, 53, 48, 51], d: [103, 109, 97, 105, 108, 46, 99, 111, 109] },
  cal: "vyom-gor-1503/15min",
  resume: "", // set to "/assets/Vyom-Gor-Resume.pdf" once a phone-free PDF is added
  photo: "",  // set to "/assets/img/profile.jpg" once the portrait is added

  socials: [
    { label: "GitHub", url: "https://github.com/vgor15", icon: "github" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/vyom-gor/", icon: "linkedin" },
    { label: "X (Twitter)", url: "https://x.com/VyomGor15", icon: "x" },
  ],

  nav: [
    { label: "About", href: "/about" },
    { label: "Lab", href: "/lab" },
    { label: "Writing", href: "/writing" },
    { label: "Bench", href: "/bench" },
    { label: "Contact", href: "/contact" },
  ],

  /* ---------- Selected work (home wheels) ---------- */
  work: [
    {
      title: "CAN Dashboard",
      by: "w/vector india",
      year: "2025",
      href: "https://github.com/vgor15/LPC2129_CAN_Automotive_Dashboard",
      plate: "canIllo",
      icon: "can",
      summary: "Two LPC2129 ECUs on one CAN 2.0B bus: speed, temperature and indicators.",
    },
    {
      title: "imperfect_cell",
      by: "w/linux",
      year: "2026",
      href: "https://github.com/vgor15/imperfect_cell",
      plate: "terminal",
      icon: "cell",
      summary: "A Unix-like shell in C: fork, execvp, wait, and a prompt with attitude.",
    },
    {
      title: "Production Test",
      by: "w/vvdn",
      year: "2026",
      href: "/bench",
      plate: "test",
      icon: "test",
      summary: "Linux production-test tooling for embedded hardware. Details stay under NDA.",
    },
    {
      title: "CAN Bus Lab",
      by: "w/lab",
      year: "2026",
      href: "/lab/can-bus",
      plate: "lcdPlate",
      icon: "lcd",
      summary: "The dashboard firmware, replayed in your browser.",
    },
    {
      title: "DSA in C++",
      by: "w/leetcode",
      year: "2026",
      href: "https://github.com/vgor15/Leetcode",
      plate: "tree",
      icon: "tree",
      summary: "Problem-solving practice, one tree and one pointer at a time.",
    },
    // Waiting for Vyom's OK before going live:
    { hidden: true, title: "TicTacToe", by: "w/c", year: "2025", href: "", plate: "grid", icon: "grid", summary: "Console game in C with ANSI colours." },
    { hidden: true, title: "LPC2129 Drivers", by: "w/vector india", year: "2025", href: "", plate: "lcd", icon: "chip", summary: "LCD, LED and UART drivers on ARM7." },
  ],

  /* ---------- About ---------- */
  about: {
    route: "KUTCH → BENGALURU",
    journey: [
      { place: "KUTCH", years: "2018–21", note: "Diploma" },
      { place: "AHMEDABAD", years: "2022–25", note: "B.Tech" },
      { place: "BENGALURU", years: "2025–", note: "Building" },
    ],
    letter: [
      "Hey, you found my file.",
      "I'm Vyom, an embedded software engineer who likes software best when it makes an LED blink, a relay click or a frame land on a bus. I write C and C++ close to the hardware: registers, interrupts, drivers, and the Linux plumbing that ties a device together.",
      "Days, I'm at VVDN Technologies in Bengaluru, working with the team that builds production-test software for embedded Linux hardware. Before that I spent six months at Vector India going deep on Embedded C, RTOS and Linux system programming, and built a two-node CAN dashboard on ARM7.",
      "Studied in Kutch and Ahmedabad (B.Tech, 9.08 CGPA), now building in Bengaluru. Off the bench: anime, games, swimming, hiking, and the next good food spot.",
    ],
    awards: [
      { title: "MYSY Scholarship", note: "Academic excellence, B.Tech" },
      { title: "9.08 / 10 CGPA", note: "B.Tech Computer Engineering" },
      { title: "Embedded Systems Certification", note: "Vector India · 2025" },
    ],
  },

  /* ---------- Bench (experience) ---------- */
  bench: {
    badge: { kind: "BENCH PASS", year: "2026", role: "Embedded Software", org: "CURRENTLY · VVDN", loc: "BLR · IN" },
    experience: [
      {
        when: "Feb 2026 — Present",
        org: "VVDN Technologies",
        role: "Embedded Software",
        where: "Bengaluru",
        text: "Working with the team behind a Linux production-test suite for an in-vehicle network video recorder.",
        points: [
          "C on embedded Linux with POSIX threads and systemd services",
          "I2C GPIO-expander logic for status LEDs, buzzers and buttons",
          "Storage (NVMe / SATA) detection and data-integrity debugging",
          "NIC and Ethernet-switch MAC provisioning on the test line",
        ],
      },
      {
        when: "Jan 2026 — Feb 2026",
        org: "Vector India",
        role: "LC Lab Coordinator",
        where: "Bengaluru",
        text: "Ran lab sessions in C, Embedded C, data structures and Linux programming.",
        points: ["Debugged student programs around pointers, memory and process execution"],
      },
      {
        when: "May 2025 — Nov 2025",
        org: "Vector India",
        role: "Embedded Systems Certification",
        where: "Bengaluru",
        text: "Six months of C, C++, Embedded C, RTOS and Linux system programming with hands-on labs.",
        points: ["Built the two-node CAN dashboard on LPC2129 (team of 3)"],
      },
    ],
    education: [
      { when: "2022 — 2025", title: "B.Tech, Computer Engineering", where: "Silver Oak University, Ahmedabad", note: "CGPA 9.08 / 10 · MYSY Scholarship" },
      { when: "2018 — 2021", title: "Diploma, Computer Engineering", where: "Government Polytechnic, Kutch", note: "CGPA 7.62 / 10" },
    ],
    skills: [
      { group: "Embedded", items: ["ARM7 · LPC2129", "CAN 2.0B", "I2C", "SPI", "UART", "GPIO & interrupts", "RTOS basics"] },
      { group: "Linux & systems", items: ["C", "C++", "POSIX threads", "fork / exec / wait", "TCP sockets", "systemd", "Bash", "Make"] },
      { group: "Tools", items: ["Keil µVision", "Flash Magic", "GCC", "GDB", "Git", "Python"] },
    ],
    hobbies: ["Anime", "Video games", "Swimming", "Hiking", "Food spots"],
  },

  /* ---------- Lab ---------- */
  lab: [
    { slug: "can-bus", title: "CAN Bus Lab", tags: ["SIM"], isNew: true, desc: "Two LPC2129 nodes, one bus. Flip the switches and watch frame 0x500 land on the LCD." },
    { slug: "glyph-studio", title: "Glyph Studio", tags: ["TOOL"], isNew: true, desc: "Draw 5×8 HD44780 glyphs and copy the CGRAM array straight into C." },
    { slug: "logic-analyzer", title: "Logic Analyzer", tags: ["CANVAS"], isNew: true, desc: "Type a byte, see it on the wire as UART, I2C or SPI, decoded." },
    { slug: "register-flipper", title: "Register Flipper", tags: ["UI"], isNew: true, desc: "Flip LPC2129 port bits and get the IOSET / IOCLR line for free." },
    { slug: "led-matrix", title: "LED Matrix", tags: ["CANVAS"], isNew: true, desc: "A grid of LEDs on one spring integration, pushed around by your cursor." },
    { slug: "shell", title: "imperfect_cell", tags: ["TERMINAL"], isNew: true, desc: "My C shell's prompt, rebuilt for the browser. Try `help`." },
  ],

  /* ---------- Writing ---------- */
  writing: [
    { n: "01", slug: "two-ecus-one-bus", title: "Two ECUs, one bus", tag: "EMBEDDED", date: "NOV 21 2026", read: "6 MIN",
      excerpt: "How a speed pot, a temperature sensor and three switches on one LPC2129 end up on another board's LCD, one CAN frame at a time." },
    { n: "02", slug: "a-shell-is-a-loop", title: "A shell is just a loop", tag: "LINUX", date: "NOV 21 2026", read: "5 MIN",
      excerpt: "Read, split, fork, exec, wait, repeat. What writing imperfect_cell taught me about processes in C." },
  ],

  /* ---------- What's new / changelog ---------- */
  changelog: [
    { type: "Site", date: "2026-11-21", label: "NOV", title: "The new site is live", desc: "Rebuilt from scratch: two wheels, a lab and a bus you can drive.", href: "/" },
    { type: "Lab", date: "2026-11-21", label: "NOV", title: "CAN Bus Lab", desc: "My Vector India dashboard, replayed in the browser.", href: "/lab/can-bus" },
    { type: "Lab", date: "2026-11-21", label: "NOV", title: "Glyph Studio", desc: "Design LCD glyphs, export the C array.", href: "/lab/glyph-studio" },
    { type: "Writing", date: "2026-11-21", label: "NOV", title: "Two ECUs, one bus", desc: "CAN on the LPC2129, from ADC to LCD.", href: "/writing/two-ecus-one-bus" },
    { type: "Work", date: "2026-02-01", label: "FEB", title: "Joined VVDN Technologies", desc: "Embedded software on Linux production-test tooling.", href: "/bench" },
    { type: "Code", date: "2026-01-26", label: "JAN", title: "Shipped imperfect_cell", desc: "A Unix-like shell in C.", href: "https://github.com/vgor15/imperfect_cell" },
    { type: "Work", date: "2026-01-05", label: "JAN", title: "Lab Coordinator at Vector India", desc: "Teaching C, Embedded C and Linux in the lab.", href: "/bench" },
    { type: "Code", date: "2025-11-27", label: "NOV", title: "CAN dashboard open-sourced", desc: "Two-node CAN on LPC2129, on GitHub.", href: "https://github.com/vgor15/LPC2129_CAN_Automotive_Dashboard" },
    { type: "Milestone", date: "2025-11-15", label: "NOV", title: "Embedded Systems certification", desc: "Six months at Vector India.", href: "/bench" },
    { type: "Milestone", date: "2025-06-01", label: "2025", title: "B.Tech, 9.08 CGPA", desc: "Computer Engineering, Silver Oak University.", href: "/bench" },
  ],

  credit: { text: "Design inspired by Carter Ogunsola", url: "https://carterogunsola.com" },
};

window.SITE = SITE;
