# Pre-release review — jciclitira.com

Design and QA pass ahead of the development release. 7 September 2026.

**Verdict: ship it.** Nine issues found, nine fixed. Four recommendations left open,
none of them blocking. The one thing worth a decision before you push is the tenure
claim in item 4 — it's a factual statement about you.

---

# Part 1 · The storytelling problem

You were right that the page wanders, and it's diagnosable rather than vague. The home
page told the reader it had **four sections** — the `01 / 04 … 04 / 04` counters down the
right margin — and then walked them past **seven blocks**.

Three of those blocks were the same genre of content: capability lists.

| | Block | Height | In the count? |
|---|---|---|---|
| 1 | Hero | 1000px | — |
| 2 | **Discipline strip** — Disciplines / Specialties / Domains | 235px | no, and no visible heading |
| 3 | **Clients & employers** — six logos | 258px | no, but wears chapter chrome |
| 4 | 01 · Selected work | 2541px | yes |
| 5 | 02 · About | 991px | yes |
| 6 | **Capability columns** — Strategy / Execution / Languages | 202px | no, buried inside About |
| 7 | 03 · The process | 708px | yes |
| 8 | 04 · Say hello | 853px | yes |

Three credential modules, in three different visual languages — a `dl` of rows, a logo
grid, a three-column list — at three separate points on the page, 3,400px apart. That is
the "all over the place" feeling, and it has a specific cause.

## The same facts, four times

The discipline strip and the capability columns overlapped directly:

| Claim | Strip | Capability cols | About prose | Case-study meta | CV |
|---|---|---|---|---|---|
| UX Research | ✓ | ✓ | | | ✓ |
| Service Design | ✓ | ✓ | | | ✓ |
| Interaction Design | ✓ | ✓ | | | ✓ |
| Climate Tech | ✓ | | ✓ | ✓ | ✓ |
| Digital Health | ✓ | | ✓ | ✓ | ✓ |
| Urban Mobility | ✓ | | ✓ | ✓ | ✓ |

Three of the four Disciplines reappeared verbatim in the capability grid 3,400px later.
The domains were stated **four times** on the home page alone — strip, About paragraph 1,
and the Domain field of all four case studies.

None of those four was the definitive statement. That's what makes a page feel restless:
not that it says too much, but that nothing it says feels final.

## What About was doing to itself

One section, five layout registers stacked back to back: section header with counter →
display heading in stacked lines → key/value facts table → three prose paragraphs →
three-column list grid. Read on its own, About had no through-line — it was a heading,
then a table, then an essay, then a spreadsheet.

## The fix

The senior version of this page states each thing **once, in the place it belongs**, and
lets the case studies carry the weight. Three changes:

**1 · The capability grid comes out of About.** I checked first: the CV already carries
nine of its ten terms. Only "Design QA" lived nowhere else, so that moved to the CV's
Craft column. Nothing was lost from the site.

**2 · Languages became a fact, not a skill.** "English · German (B2)" now sits in the
About facts table beside "Based in — Berlin, Germany", which is where a reader looks for
it. It was never a capability in the sense the other two columns were.

**3 · Product Strategy joined the discipline strip.** It's the first item on your CV and
the one genuine seniority signal the strip was missing. The strip is now the single place
capability is stated, at the top of the page where scanning actually happens.

### Result

| | Before | After |
|---|---|---|
| Blocks before the footer | 7 | 6 |
| Credential modules | 3 | 1 |
| About section height | 991px | 753px |
| Page height | 7,006px | 6,788px |
| Layout registers inside About | 5 | 3 |

The page now reads **claim → proof → person → method → invitation**, with the strip and the
logos sitting together as front matter before the numbered spine starts. The strip's three
columns still balance exactly (137px each) with the extra item, and About flows straight
into Process instead of stopping for a list.

Nothing was restructured, moved, or redesigned. One duplicate block was removed and one
row was rehomed — the "without going over the top" version.

---

# Part 2 · Issues found and fixed

### 1 · A dead employer link pointing at a domain-for-sale page
**Where:** `cv.html`, the CrowdScores entry.
The link went to `https://CrowdScores.com/`, which now redirects to a GoDaddy
"buy this domain" listing. A recruiter clicking your former employer landed on a
domain-squatter ad. Cooler Future — also defunct — already linked to a Wayback snapshot,
so I matched that pattern: a June 2016 capture, from inside your tenure. Verified 200.

### 2 · Straight apostrophe in a site of 51 curly ones
**Where:** `index.html`, About paragraph 2 — "It's far cheaper".
Mine, introduced in the first copy pass. Every other apostrophe on the site is `’`;
this was the only `'`. In a Swiss-typographic layout at that size it reads as a
typewriter tick. Fixed.

### 3 · Meta description truncating in search results
**Where:** `index.html`, `description` and `og:description`.
168 characters; Google cuts around 160, so the description ended mid-clause. Now 130.

### 4 · Tenure claim contradicted the page it sits on — **please confirm**
The same description said "Ten years", while the hero says "Practising since 2015" and
your CV starts at CrowdScores in August 2015. To September 2026 that is eleven years. I
changed it to "Eleven years", which is both accurate and better for you — but it's a
claim about your career, so overrule me if you count from somewhere else.

> **Before:** Senior Product Designer in Berlin. Ten years designing digital products end to end, across research, strategy and delivery, for companies working on things that matter.
>
> **After:** Senior Product Designer in Berlin. Eleven years designing digital products end to end for companies working on things that matter.

The dropped "across research, strategy and delivery" is stated directly by the discipline
strip a screen below, so the description doesn't need to carry it too.

### 5 · Stale sitemap
Every `lastmod` said `2026-08-22`, but all six pages changed on 5 and 7 September.
Updated to `2026-09-07`.

### 6 · Design QA existed nowhere but the block being deleted
Added to the CV's Craft column, in both the screen and print copies, so the capability
inventory stays complete.

### 7–9 · Dead CSS and stale comments
Removing the capability grid left `.caps` / `.cap-c` with no consumer: 11 lines of rules
plus 5 orphaned responsive overrides in two media queries. Removed. Two comments
elsewhere cited `.cap-c h4` as the reference for the label type scale — updated to point
at `.ctab .k`, which still exists.

---

# Part 3 · Recommendations, not done

**A · The Enter hero is 75% of that page's first load.**
`Man_selecting_the_footprint.jpg` is 1333×2000 and 693KB. Initial transfer for
`enter.html` is 922KB, and 693KB of it is this one file. It isn't badly compressed —
260KB per megapixel is in line with your other heroes — it's simply far more pixels than
the slot needs. Resizing to ~1200px tall, or serving WebP, cuts roughly 400–500KB off
the first paint of your most important case study. Highest-value performance fix on the
site by a distance.

**B · Case-study pages are 3–3.9MB in total.**
Not a first-paint problem — lazy loading works correctly and only one image loads
upfront — but it is a lot to pull down while scrolling on mobile data. Same fix as A,
applied across `img/`.

**C · "Clients & employers" wears chapter chrome without being a chapter.**
It has an `h2` and a right-margin index (`Selected · 06`) exactly like the numbered
sections, but sits outside the `01–04` count. This is the last remaining source of the
"more sections than it says" feeling. Two clean options: demote it to a quiet logo band
without the section header, or move it below Selected work so the logos read as
corroboration rather than as a credential presented before any evidence. I'd move it —
but it's a structural change and you asked me not to go over the top, so it's yours to call.

**D · EmailJS is pinned to a major version.**
`@emailjs/browser@4` rather than an exact version, so a future 4.x release ships to your
site without review. Low risk, standard practice, worth knowing.

---

# Part 4 · Checked and genuinely fine

Recording these so you know they were actually tested, not assumed.

| Area | Result |
|---|---|
| Links & assets | 0 missing files, 0 broken anchors across all 7 pages |
| External links | All resolve. `somethingcreative.de` 403s to curl but 200s to a browser — bot-blocking, not broken |
| Colour contrast | Every text role passes WCAG AA in **both** themes. Lowest: 6.37:1 light, 7.35:1 dark — near AAA |
| Landmarks | `lang`, skip link, `main`, `nav`, `footer` present on all 7 pages |
| Alt text | 4 empty `alt=""` — all correctly decorative (next-project thumbnails beside a text link, plus the pacman gif) |
| Image dimensions | Every `<img>` carries width/height — no layout shift |
| Lazy loading | Works: 1 image loads upfront, 14 deferred |
| Reduced motion | Thorough — CSS kills animation and reveals, JS honours it, the game has three separate blocks |
| Print résumé | The duplicate `h1` is `display:none` **and** `aria-hidden` — correctly hidden from screen readers |
| Contact form | Real keys, validation on both empty and malformed-email paths, graceful "write to me instead" fallback if the CDN fails |
| Easter egg | Launches, pauses, closes cleanly. No console errors |
| Mobile 375px | No horizontal overflow on any page tested |
| Markup | Tag balance clean on all 7 pages; brace balance clean in all 3 stylesheets |
| `.DS_Store` | Present on disk but gitignored — won't ship |
| Copy deck | 701 live strings round-trip against `COPY-site.md`; the only 12 gaps are the documented print-CV date variants and the game's runtime values |

**Two false alarms**, recorded so nobody re-investigates them:

- `body { overflow-x: hidden }` looks like it makes `body` a scroll container and breaks
  `window.scrollTo`. It doesn't — viewport propagation means it applies to the viewport.
  Scrolling failed only because the preview pane was hidden.
- `.proc-k` measured 2.55:1 in dark mode, which would have failed AA. That was a frozen
  in-flight colour transition — a hidden pane produces no frames, so the transition never
  advanced. On a fresh dark load it is 7.35:1.

---

# Part 5 · Before you push

- [ ] Confirm **"Eleven years"** (Part 2, item 4)
- [ ] Optional: resize the Enter hero (Part 3, item A) — biggest single win available
- [ ] Optional: decide on Clients & employers placement (Part 3, item C)
- [ ] `git add -A && git commit` — 9 files changed, all uncommitted on the `Copy` branch
- [ ] After deploy: confirm the Cloudflare RUM beacon fires (it CORS-fails on localhost
      by design; the live origin will be correct)
- [ ] Resubmit `sitemap.xml` in Search Console so the new `lastmod` is picked up
