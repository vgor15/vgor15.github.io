# vgor15.github.io

Portfolio of **Vyom Gor**, embedded software engineer in Bengaluru.
Live at **https://vgor15.github.io/** · Admin at **https://vgor15.github.io/admin/**

White + gold. The layout and motion language are inspired by
[carterogunsola.com](https://carterogunsola.com); all code here is original.

## Edit the site

Open **/admin**, sign in with your GitHub token, edit, press **Save**. The site updates in about a minute.
Step-by-step guide: **[docs/EDITING.md](docs/EDITING.md)**.

All content lives in [`content/`](content/) as JSON files; the pages read them at load time.

| File | What it holds |
|---|---|
| `site.json` | Name, job title (switches by itself on the date you set), status, socials, menu |
| `work.json` | Project cards on the home wheels |
| `writing.json` | The Writing list |
| `lab.json` | Text of the Lab cards |
| `notes.json` | TIL notes on /notes |
| `changelog.json` | The What's new drawer and /changelog |
| `about.json`, `bench.json`, `now.json`, `resume.json` | Those pages |

## Pages

| Path | What's there |
|---|---|
| `/` | Two linked wheels of selected work: drag, swipe, scroll or ← → |
| `/about` | Postcard with stamp and postmarks, live telemetry, CAN bit replay, UART log |
| `/lab` | Experiments in List, Wheel and Grid views |
| `/lab/can-bus` | Replay of the LPC2129 CAN dashboard firmware (frame 0x500, CRC-15, 16×2 LCD) |
| `/lab/glyph-studio` | HD44780 CGRAM glyph editor that exports a C array |
| `/lab/logic-analyzer` | UART, I2C and SPI waveforms with decoding |
| `/lab/register-flipper` | LPC2129 IODIR, IOSET and IOCLR playground |
| `/lab/led-matrix` | Spring-physics LED grid |
| `/lab/shell` | imperfect_cell, the C shell, in the browser (also press `` ` `` anywhere) |
| `/writing` | Notebook of posts |
| `/bench` | Swinging lanyard pass, DIP-16 skills datasheet, experience, certificates |
| `/resume`, `/now`, `/notes` | Printable web CV, what I'm on now, short TIL notes |
| `/contact` | Letter you sign and send (opens your mail app) and a ticket stub |
| `/record` | Frames any page at a fixed size for screen recording |
| `/changelog` | Everything new |

## Docs

- [docs/EDITING.md](docs/EDITING.md): using the admin panel
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the site is put together
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): how it goes live, and how to roll back
- [docs/TESTING.md](docs/TESTING.md): the automatic checks on every change
- [docs/SEO.md](docs/SEO.md): search, sharing and the one-time Google and Bing steps
- [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md)

## Run locally

No build step. With Node 22+: `node scripts/serve.mjs`, then open http://localhost:4173.
It serves `/about` as `about.html` like GitHub Pages does.
