# Editing the site with the admin panel

The admin panel is **https://vgor15.github.io/admin/** (Sveltia CMS). It edits the files in `content/`
and commits each save to `main`. The Deploy workflow then publishes the site, usually within a minute.

## One-time setup: a GitHub token

1. Open GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only select repositories* → `vgor15/vgor15.github.io`. Nothing else.
3. **Permissions → Repository permissions → Contents: Read and write.** (Metadata: read is added automatically.)
4. **Expiration:** 90 days. GitHub emails you before it expires; make a new one then.
5. Copy the token, open `/admin`, choose **Sign In Using Access Token** and paste it.

The token is stored only in that browser. Use it on your own devices only, and press **Sign Out** (top-right menu)
on any computer that isn't yours. If a token ever leaks, delete it on the same GitHub page; nothing else needs to change.

## Everyday edits

| I want to… | Go to |
|---|---|
| Add a project to the home wheels | **Projects → New Project**. Drag it to the top to show it first. |
| Hide a project for now | Open it, tick **Hide from the site**. |
| Change my job title | **Site settings → Job title**. `@title` anywhere in the content shows the current one. |
| Update the HUD status chip | **Site settings → HUD status** |
| Add a TIL note | **Notes → New Note** |
| Announce something in What's new | **What's new → New Update** |
| Update /now | **Now page** (also change *Last updated*) |
| Edit experience, skills, certificates | **Bench (experience)** |
| Add a real testimonial | **Bench → Testimonials**. Only real quotes, from people who agreed to be quoted. |
| Change my photo | **Site settings → Photo** |

### The title switch

`Site settings → Job title` has *Current title*, *Next title* and *Switch on*. From the switch date
(India time) the site shows the next title everywhere `@title` is used: the Bench badge, the VVDN
experience entry and the resume page. Nothing needs to be redeployed on the day.

### Images

Upload images through the image fields. The panel converts photos to WebP, scales them to at most
2048 px and **removes Exif data**, including GPS location, before anything is committed.
The deploy check also refuses any image that still carries GPS data.

Before uploading certificate scans, cover roll numbers, ID numbers and signatures.

### Posts

The Writing list (titles, dates, excerpts, draft flag) is editable now. Each post's text is still a page
in `writing/` and new posts are added there; writing whole posts in the panel comes in the next update.

## What the deploy check blocks

Every deploy runs `scripts/check.mjs`. It refuses to publish if the content has:

- a phone number, an email address written in plain text, or anything that looks like a key or token
- a link that doesn't start with `https://` or `/`
- a broken JSON file, a missing required field, a duplicate ID or a bad date
- a photo with GPS data

When a deploy is blocked, the live site stays on the last good version. The failed run on the
**Actions** tab says exactly which file and field to fix.

### Optional: block private words too

Repository **Settings → Secrets and variables → Actions → New repository secret**, name it
`PRIVACY_PATTERNS`, and set its value to a regular expression of words that must never be published
(for example `word1|word2|word3`). The words stay secret and the check enforces them on every deploy.

## Changing your email

The email is stored Base64-encoded so scrapers can't read it from the content file.
Encode the new address with any Base64 tool and paste the result into **Site settings → Email (encoded)**.

## Updating the admin panel

`admin/index.html` pins Sveltia CMS to an exact version with an integrity hash. To upgrade, change the
version in the script URL and replace the `integrity` value with the new file's SHA-256 (jsDelivr lists it at
`https://data.jsdelivr.com/v1/packages/npm/@sveltia/cms@<version>`). A wrong hash means the panel won't load,
which is the point.
