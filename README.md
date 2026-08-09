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
quidco.html          Case study — Quidco

css/swiss.css        The whole design system — every page loads this
css/cv.css           Résumé-only screen styles + the A4 print sheet
css/game.css         Chrome for the hidden Asteroids easter egg
js/swiss.js          Shared behaviour (reveals, menu, theme, grid overlay, launcher)
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
  Every uppercase micro-label shares one size (`--t-lab`) and one tracking
  (`--tr-lab`) — change the token, not the rule.
- **Colour** — paper `--paper`, ink `--ink`, one accent `--red`. Dark mode swaps
  the tokens under `[data-theme="dark"]`; nothing else changes. Hairlines are
  alpha (`--rule`, `--rule-2`) rather than solid tints, so they sit correctly on
  paper, `--sheet` and `--warm` alike. `--red-bright` is for hover/active only.
  The accent appears at most once per viewport — a number, a status dot, one
  CTA — never as a decorative fill.
- **Layout** — `.edge` for page margins, `.sechd` for the label + hairline
  section headers, and two section densities that alternate: `.blk` for the
  argument sections (work, figures, clients, process) and `.blk-air` for the
  reflective ones (about, contact), plus `.blk-tight` for a band that continues
  the one above it rather than starting a new beat. `.div-ink` is the one
  full-bleed ink rule, used above Contact to split the page into three acts.
- **Imagery** — framed media gets a fixed ratio and `object-fit: cover`, never
  natural height; the sources run from portrait to wide, so the frame imposes
  the crop. The exception is a banner carrying its own typography, which has
  nothing spare to lose — those take `.is-art` (`.wproj-fig.is-art` on the
  homepage, `.hero-img.is-art` on a case study) and keep their own ratio.
- **Emphasis** — never bold inside body copy, on any page. Rank comes from
  scale, position and the numbered system; a figure that matters gets its own
  column in a hairlined definition list (`.wmeta` on the work cards). The one
  surviving `<strong>` is structural, not emphasis: `.mcard strong` is the
  card's heading and renders as a block at `--t-h3`.
- **Semantics** — one `<h1>` per page, every section label (`.lab`, `.sec-lbl`)
  is a real `<h2>`, and every page has a skip link and a `<main id="main">`.
  The mobile menu is closed with `visibility:hidden`, not clip-path alone —
  clipping leaves its links in the tab order.
- **Typography** — apostrophes and quotation marks are typographic (’ “ ”);
  ranges take an en-dash (2016–2026), and the em-dash is for parenthetical
  breaks. Never run a text-level find-and-replace over a whole HTML file: the
  inline `<script>` blocks live in the body and string literals get mangled.
- **Motion** — add `.r` (fade up), `.rl` (masked lines, needs
  `<span class="ln"><i>…</i></span>` per line), `.rw` (rule wipe) or `.rm`
  (image clip reveal). `js/swiss.js` adds `.in` when the element scrolls into
  view; `data-delay="70"` staggers it — keep steps at or under ~80ms or the
  group stops reading as one gesture. `.sechd` and `.wproj` also draw their
  hairline in from the left on arrival. No hover scale, no shadows, no
  gradients: hover is an accent swap and a hairline underline. Everything is
  disabled under `prefers-reduced-motion`.

  Three traps worth knowing if you extend these. The `.rm` clip sits on the
  **image**, never on the observed element — a `clip-path` that collapses an
  element's visual rect makes `IntersectionObserver` report it as not
  intersecting, so it would never reveal. Every hidden start state is prefixed
  `html.js`, so the matching `.in` rule needs the same prefix or the start state
  out-specifies it. And the drawing hairlines are pseudo-elements rather than
  borders, so anything that sets `border-bottom` on `.sechd` will fight them.

Case study pages share one class vocabulary (`cs-hero`, `section`, `prose`,
`two`/`three`/`four`, `stats`, `pbox`, `pq`, `cards`, `dark-band`, `warm-band`,
`next`), so restyling them means editing `swiss.css` rather than the pages.

They also form one chain, and it has to stay unbroken: the homepage links the
first four, then each page's `.next` card carries you to the following one —
Enter → Coup → Cooler Future → Vivy → CrowdScores → YunoJuno → Quidco → home.
The last three are not on the homepage index, so that chain is the only way to
reach them. Break a `.next` link and those pages become unreachable while
staying in `sitemap.xml`.

Two easter eggs: **G** overlays the 12-column grid on any page (hinted once in
the footer), and the homepage game opens from the corner launcher or by pressing
**P**. The launcher collapses to its sprite until you approach it and stands
down entirely over the footer, where it otherwise covered "Back to top".

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
