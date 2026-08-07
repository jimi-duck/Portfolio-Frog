# James Ciclitira — Portfolio

Personal product design portfolio for James Ciclitira. A set of static, hand-coded HTML pages — no framework, no build step. Live at [www.jciclitira.com](https://www.jciclitira.com).

## Structure

```
index.html           Homepage
cv.html              Résumé (screen sheet + a single-page A4 print sheet)
404.html             Not found

enter.html           Case study — Enter (energy tech)
coup.html            Case study — Coup Mobility
cooler-future.html   Case study — Cooler Future
vivy.html            Case study — Vivy
crowdscores.html     Case study — CrowdScores
yunojuno.html        Case study — YunoJuno
quidco.html          Case study — Quidco (not currently linked from the homepage index)

css/swiss.css        The whole design system — every page loads this
css/cv.css           Résumé-only screen styles + the A4 print sheet
css/game.css         Chrome for the hidden Asteroids easter egg
js/swiss.js          Shared motion layer (reveals, marquee, cursor, menu, theme)
js/game.js           The easter egg itself

fonts/               TeX Gyre Heros, self-hosted (GUST Font License)
img/                 Case study screenshots and image assets
CNAME                Custom domain config for GitHub Pages
.nojekyll            Disables Jekyll processing so assets serve as-is
```

## Design system

Swiss / International Typographic Style: one grotesque, a strict grid, hairline
rules, one accent. All of it lives in `css/swiss.css`.

- **Type** — TeX Gyre Heros, a free cut to Helvetica's metrics, self-hosted from
  `fonts/`. Regular and Bold only; there is no third weight by design.
- **Colour** — paper `--paper`, ink `--ink`, one accent `--red`. Dark mode swaps
  the tokens under `[data-theme="dark"]`; nothing else changes.
- **Layout** — `.edge` for page margins, `.blk` for section rhythm, `.sechd` for
  the label + hairline section headers.
- **Motion** — add `.r` (fade up), `.rl` (masked lines, needs
  `<span class="ln"><i>…</i></span>` per line), `.rw` (rule wipe) or `.rm`
  (image clip reveal). `js/swiss.js` adds `.in` when the element scrolls into
  view; `data-delay="120"` staggers it. Everything is disabled under
  `prefers-reduced-motion`.

  Two traps worth knowing if you extend these. The `.rm` clip sits on the
  **image**, never on the observed element — a `clip-path` that collapses an
  element's visual rect makes `IntersectionObserver` report it as not
  intersecting, so it would never reveal. And every hidden start state is
  prefixed `html.js`, so the matching `.in` rule needs the same prefix or the
  start state out-specifies it.

Case study pages share one class vocabulary (`cs-hero`, `section`, `prose`,
`two`/`three`/`four`, `stats`, `pbox`, `pq`, `cards`, `dark-band`, `warm-band`,
`next`), so restyling them means editing `swiss.css` rather than the pages.

Press **G** on any page to overlay the 12-column grid.

## Running locally

Serve the folder with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploying

Hosted on GitHub Pages, deployed from the `main` branch. Pushing to `main` triggers an automatic rebuild — changes are usually live within a minute or two.

```bash
git add .
git commit -m "Update"
git push
```

## Custom domain

Already configured — the `CNAME` file points at `www.jciclitira.com`, with DNS records pointed at GitHub Pages. No action needed unless the domain changes.

## Contact form

The homepage contact form sends via EmailJS:
- Service: `service_rwv0n4u`
- Template: `template_0zf917w`

If it stops working, check the account's monthly send quota at emailjs.com (200/month on the free tier).
