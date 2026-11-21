# vgor15.github.io

Portfolio of **Vyom Gor**, embedded software engineer in Bengaluru.
Live at **https://vgor15.github.io/**

White + gold. The layout and motion language are inspired by
[carterogunsola.com](https://carterogunsola.com); all code here is original.

## Pages

| Path | What's there |
|---|---|
| `/` | Two linked wheels of selected work: drag, scroll or ← → |
| `/about` | Postcard with stamp and postmarks, live telemetry, CAN bit replay, UART log |
| `/lab` | Experiments in List, Wheel and Grid views |
| `/lab/can-bus` | Replay of the LPC2129 CAN dashboard firmware (frame 0x500, CRC-15, 16×2 LCD) |
| `/lab/glyph-studio` | HD44780 CGRAM glyph editor that exports a C array |
| `/lab/logic-analyzer` | UART, I2C and SPI waveforms with decoding |
| `/lab/register-flipper` | LPC2129 IODIR, IOSET and IOCLR playground |
| `/lab/led-matrix` | Spring-physics LED grid |
| `/lab/shell` | imperfect_cell, the C shell, in the browser (also press `` ` `` anywhere) |
| `/writing` | Notebook of posts |
| `/bench` | Swinging lanyard pass, experience, education, skills |
| `/contact` | Letter you sign and send (opens your mail app) and a ticket stub |
| `/record` | Frames any page at a fixed size for screen recording |
| `/changelog` | Everything new |

Global: HUD strip, ⌘K command menu, What's new drawer, light and dark themes, page veil transitions.

## Edit content

Everything lives in `assets/js/data.js`: work, lab, writing, changelog, bench, socials.

- **Photo:** put the image at `assets/img/profile.jpg` and set `photo: "/assets/img/profile.jpg"`.
- **Resume:** add a phone-free PDF at `assets/Vyom-Gor-Resume.pdf` and set `resume`.
- **Hidden projects:** entries with `hidden: true` stay off the wheel until you remove that flag.

## Privacy

- No cookies, no analytics, no third-party requests on load. Fonts (Geist, OFL) and libraries (GSAP, Lenis) are self-hosted.
- The email address is assembled only on click. There is no phone number anywhere.
- cal.com loads only when someone asks to book.
- Each page sets a strict Content-Security-Policy and a `no-referrer` policy.

## Run locally

Any static server works, for example `python -m http.server 4173`. No build step.
