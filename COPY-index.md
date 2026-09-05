# index.html — Copy Deck

All user-facing text on the main page, in document order.

**How to use:** edit the text after each `>` or in each table cell. Don't rename the
`[ID]` labels — they're how I map each string back to its place in `index.html`.
Anything marked _(fixed)_ is structural (numbers, labels) — change only if you mean to.

---

## 00 · Metadata (browser tab, search results, link previews)

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | James Ciclitira · Product Designer, Berlin |
| `meta.description` | Meta description | Senior Product Designer in Berlin. Ten years designing digital products end to end, across research, strategy and delivery, for companies working on things that matter. |
| `meta.og.title` | Social share title | James Ciclitira · Product Designer, Berlin |
| `meta.og.description` | Social share description | Senior Product Designer in Berlin. Ten years designing digital products end to end, across research, strategy and delivery, for companies working on things that matter. |

---

## 01 · Chrome (nav, menu, utility)

| ID | Element | Copy |
|---|---|---|
| `chrome.skip` | Skip link | Skip to content |
| `chrome.intro` | Intro curtain brand | James Ciclitira |
| `chrome.gridhint` | Grid hint pill | Grid · press G |
| `nav.logo` | Nav logo | James Ciclitira |
| `nav.01` | Nav link 01 | Work |
| `nav.02` | Nav link 02 | About |
| `nav.03` | Nav link 03 | Process |
| `nav.04` | Nav link 04 | Contact |
| `nav.05` | Nav link (Résumé) | Résumé ↗ |
| `nav.burger` | Mobile menu button | Menu |
| `nav.theme` | Theme toggle (screen-reader label) | Switch between light and dark mode |

### Mobile menu footer
| ID | Copy |
|---|---|
| `menu.linkedin` | LinkedIn ↗ |
| `menu.email` | Email ↗ |
| `menu.location` | Berlin, DE |

---

## 02 · Hero

### Metadata strip (four items, left to right)
| ID | Copy |
|---|---|
| `hero.meta.1` | Senior Product Designer |
| `hero.meta.2` | Berlin, DE · 52.52° N, 13.40° E |
| `hero.meta.3` | Practising since 2015 |
| `hero.meta.4` | Available from Oct 2026 |

### Headline
Set as three lines. The full stop is the red accent — keep it on the last line.

> **Line 1:** Complex
> **Line 2:** systems,
> **Line 3:** made usable.

### Subhead
> I design digital products where software meets hardware and real-world operations, turning complex workflows into tools people can actually use.

### Call to action
> Selected work: four case studies
>
> _(The words "`: four case studies`" are hidden on small screens — so "Selected work" must stand alone.)_

### Image alt text
> James Ciclitira, photographed in black and white against a plain wall, head and shoulders, looking towards the camera.

---

## 03 · Capability line

| ID | Term | Definition |
|---|---|---|
| `cap.1` | Disciplines | UX Research · Service Design · Information Architecture · Interaction Design |
| `cap.2` | Specialties | Digital-to-Physical Integration · Operational Tooling · Automation |
| `cap.3` | Domains | Climate Tech · Digital Health · Urban Mobility · Regulated Products |

Section label (screen readers only): `How I work`

---

## 04 · Clients & employers

| ID | Copy |
|---|---|
| `clients.h` | Clients & employers |
| `clients.idx` | Selected · 06 _(fixed)_ |

Logo alt text: `Enter logo` · `Bosch logo` · `Allianz logo` · `Cooler Future logo` · `YunoJuno logo` · `Quidco logo`

---

## 05 · Selected work

| ID | Copy |
|---|---|
| `work.h` | Selected work |
| `work.idx` | 01 / 04 · 2017–2026 _(fixed)_ |
| `work.cta` | View case study _(one per project — same string on all four)_ |

### 01 — Enter
> **Title:** Enter
>
> **Description:** Enter helps German homeowners plan energy-efficient renovations and claim government subsidies covering up to 70% of the cost. Certified energy advisors survey the home on site, and AI turns the data into a plan the homeowner can act on.
>
> **Role:** Senior Product Designer
> **Domain:** Climate tech
> **Scope:** B2C & field ops
>
> **Image alt:** An Enter energy advisor standing in a stairwell, tracing a building's footprint on a tablet during an on-site survey.

### 02 — Coup Mobility
> **Title:** Coup Mobility
>
> **Description:** Bosch's e-moped sharing service put 5,000 electric mopeds across Berlin, Paris, and Madrid. They could be found on a map, unlocked with a phone, and left anywhere. Behind the rider experience lay a massive field operation keeping every vehicle charged, repaired, and on the streets.
>
> **Role:** Senior Product Designer
> **Domain:** Urban mobility
> **Scope:** B2C & fleet ops
>
> **Image alt:** Two riders on Coup's red shared e-mopeds waiting at a Berlin intersection.

### 03 — Cooler Future
> **Title:** Cooler Future
>
> **Description:** A sustainable investing app for people who want to know exactly what their money is funding. It offers curated climate funds, transparent impact data and a €20 minimum investment, built for first-time investors and sceptics who want hard proof, not greenwashing.
>
> **Role:** Lead Product Designer
> **Domain:** Sustainable fintech
> **Scope:** B2C mobile
>
> **Image alt:** Cooler Future key visual: an aerial view of a turquoise glacial lake, captioned "The footprint of money: reshaping sustainable investing".

### 04 — Vivy
> **Title:** Vivy
>
> **Description:** An Allianz-backed digital health record that lets patients request medical documents, store them securely on their phones, and share them with any practitioner. A modern, encrypted solution built for a country where medical records still move by mail, fax, and in-person requests.
>
> **Role:** Product Designer
> **Domain:** Digital health
> **Scope:** B2C & healthcare B2B
>
> **Image alt:** The Vivy health record app open on a phone, showing a patient's stored medical documents.

---

## 06 · About

| ID | Copy |
|---|---|
| `about.h` | About |
| `about.idx` | 02 / 04 _(fixed)_ |

### Heading (two lines, red full stop on the last)
> **Line 1:** How I think
> **Line 2:** about the work.

### Fact table
| ID | Key | Value |
|---|---|---|
| `about.t.1` | Based in | Berlin, Germany |
| `about.t.2` | Working since | 2015 |
| `about.t.3` | Currently | Open to full-time & part-time |

### Body (three paragraphs)
> **P1:** Most of that time has been spent in complex domains: digital health, sustainable investing, urban mobility, and now home energy. The common thread is products people depend on to do something that matters to them, increasingly at companies working on environmental impact.
>
> **P2:** Research comes first. It's far cheaper to learn before you build than after you launch. Time with real users usually reveals the right direction; the job is to ask the right questions, reduce complexity, and turn insight into products that are clear and usable.
>
> **P3:** My experience ranges from being the sole designer in an early-stage startup to working inside large cross-functional teams, leading projects from research through to delivery.

### Capability columns
| Column | Items |
|---|---|
| Strategy | Product strategy · Service design · Customer journeys · Design systems |
| Execution | UX research · Interaction design · Prototyping · Design QA |
| Languages | English (native) · German (B2, working proficiency) |

---

## 07 · The process

| ID | Copy |
|---|---|
| `proc.h` | The process |
| `proc.idx` | 03 / 04 _(fixed)_ |

| Key | Title | Description |
|---|---|---|
| Where | Go where the work happens | What breaks a product is rarely visible from a desk. It's on the tablet in someone's basement, in the fax machine at the clinic, in the spreadsheet the ops team actually runs on. |
| How | Keep it rough while it's still wrong | Storyboards and grey boxes get argued with; polished screens get approved. I keep the work unfinished-looking while the direction is still in question, then make prototypes real enough to earn honest reactions. |
| When | Stay until it ships | Working alongside engineers through the build, on real devices, with real data. If a design doesn't hold up once it's coded, it wasn't done. |

---

## 08 · Contact

| ID | Copy |
|---|---|
| `contact.h` | Say hello |
| `contact.idx` | 04 / 04 _(fixed)_ |

### Heading (three lines, red full stop on the last)
> **Line 1:** Let's talk about
> **Line 2:** what you're
> **Line 3:** building.

### Contact table
| ID | Key | Value |
|---|---|---|
| `contact.t.1` | Email | jciclitira@gmail.com |
| `contact.t.2` | LinkedIn | /in/jciclitira ↗ |
| `contact.t.3` | Location | Berlin, Germany · remote-friendly |
| `contact.t.4` | Status | Open to full-time & part-time |
| `contact.t.5` | Reply time | Usually within a day or two |

### Form
| ID | Label | Placeholder |
|---|---|---|
| `form.name` | Your name | James Smith |
| `form.email` | Email | james@company.com |
| `form.subject` | What's the project? | Give me the quick version |
| `form.message` | Tell me more | What are you building, what's the problem, when do you need someone… |

| ID | Button state | Copy |
|---|---|---|
| `form.btn` | Default | Send message |
| `form.btn.sending` | Sending | Sending… |
| `form.btn.sent` | Sent | Sent ✓ |

| ID | Form message | Copy |
|---|---|---|
| `form.msg.empty` | Missing fields | Please fill in all fields. |
| `form.msg.badmail` | Invalid email | Please enter a valid email address. |
| `form.msg.noload` | Script failed to load | The form could not load. Please write to jciclitira@gmail.com instead. |
| `form.msg.ok` | Success | Message sent. I'll be in touch soon. |
| `form.msg.err` | Send failed | Something went wrong. Try emailing directly: jciclitira@gmail.com |

---

## 09 · Footer

| Column heading | Links |
|---|---|
| Index | Selected work · About · Process · Contact · Résumé |
| Case studies | 01 · Enter — 02 · Coup Mobility — 03 · Cooler Future — 04 · Vivy |
| Elsewhere | LinkedIn ↗ · Email ↗ |

| ID | Copy |
|---|---|
| `footer.copyright` | © 2026 James Ciclitira · Product Designer · Berlin |
| `footer.keys` | Press G for the grid |
| `footer.top` | Back to top ↑ |

---

## 10 · Asteroid Blaster (hidden game — press B or the "Play" button)

Star Trek themed. Strings marked _(JS)_ are generated at runtime and are only
placeholders in the HTML — tell me if you want those changed and I'll edit the
script instead.

| ID | Element | Copy |
|---|---|---|
| `game.launch` | Launch button | Play |
| `game.launch.label` | Launch button (screen-reader label) | Play a hidden game |
| `game.tip` | Controls tip | ↑ impulse · ←→ helm · phasers fire themselves · esc leave the bridge |
| `game.exit` | Exit button | ← Leave the bridge |
| `game.score` | Score readout | Stardate 0 |
| `game.buff.shield` | Shield buff | Deflector 0s |
| `game.buff.rapid` | Rapid-fire buff | Phasers 0s |
| `game.xp.level` | XP rail level | REFIT 1 _(JS)_ |
| `game.xp.val` | XP rail value | 0 / 4 _(JS)_ |
| `game.boss.name` | Capital ship name | I.K.S. Vor'cha _(JS)_ |
| `game.warn` | Inbound warning | Warbird closing |

### Game over
> **Title:** Hull breach
> **Score:** Stardate 0
> **Sub:** 0s adrift · refit 1 _(JS)_
> **Hint:** press any key to launch again

### Level up / refit card
> **Title:** Field refit
> **Sub:** Refit 2 · authorise one subsystem _(JS)_
> **Hint:** Select a subsystem, or press 1 2 3
>
> _(The three upgrade cards themselves are all generated in JS.)_

### Red alert / engagement hail
> **Title:** Red alert
> **Sub:** I.K.S. Vor'cha · intercept course · orders?  _(ship name is JS)_
> **Hint:** Give the order, or press 1 2

**Option 1 — Engage** (`Press 1`)
> **Name:** Stand and fight
> **Body:** Hold the sector and break her hull. She fights back, she calls escorts, and she turns nastier at half hull — but nothing else in the run pays like a kill.
> **Details:** +1800 stardate _(JS)_ · Battle salvage · one subsystem · +2 hull · dilithium · a power-up

**Option 2 — Evade** (`Press 2`)
> **Name:** Break off and run
> **Body:** Full impulse out of the sector. She never decloaks and she never touches you — and nothing she was carrying is ever yours.
> **Details:** No bounty · no refit · Next contact in 37s _(JS)_ · Evasive burn · 2.6s

### Pause
> **Title:** All stop
> **Hint:** click or press any key to resume
