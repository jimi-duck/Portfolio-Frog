# jciclitira.com — Full Copy Deck

Every piece of user-facing text on the site, page by page, in document order.
Generated from the HTML on 6 September 2026.

**How to use:** edit the text in each table cell or after each `>`. Don't rename the
`[ID]` labels — they map each string back to its place in the markup. Anything marked
_(fixed)_ is structural (counters, section numbers) — change only if you mean to.
Image `alt` text is included: it is read aloud by screen readers and shown when an
image fails, so it is copy like any other.

## Pages

| # | File | What it is |
|---|---|---|
| — | _(all pages)_ | [Shared chrome](#shared--chrome-on-every-page) — nav, menu, footer |
| 01 | `index.html` | [Home](#01--indexhtml--home) |
| 02 | `enter.html` | [Enter — case study](#02--enterhtml--case-study) |
| 03 | `coup.html` | [Coup Mobility — case study](#03--couphtml--case-study) |
| 04 | `cooler-future.html` | [Cooler Future — case study](#04--cooler-futurehtml--case-study) |
| 05 | `vivy.html` | [Vivy — case study](#05--vivyhtml--case-study) |
| 06 | `cv.html` | [Résumé](#06--cvhtml--résumé) |
| 07 | `404.html` | [Not found](#07--404html--not-found) |
| 08 | `js/game.js` | [Asteroid Blaster — easter egg](#08--the-easter-egg) |

---

# Shared · chrome on every page

Identical across all seven pages. Change it here and it changes everywhere.

## Navigation

| ID | Element | Copy |
|---|---|---|
| `chrome.skip` | Skip link | Skip to content |
| `chrome.gridhint` | Grid hint pill | Grid · press G |
| `nav.logo` | Logo | James Ciclitira |
| `nav.01` | Link 01 | Work |
| `nav.02` | Link 02 | About |
| `nav.03` | Link 03 | Process |
| `nav.04` | Link 04 | Contact |
| `nav.05` | Link (Résumé) | Résumé ↗ |
| `nav.burger` | Mobile menu button | Menu |
| `nav.theme` | Theme toggle (screen-reader label) | Switch between light and dark mode |
| `nav.aria.primary` | Landmark label | Primary |
| `nav.aria.menu` | Landmark label | Site menu |

### Mobile menu footer
| ID | Copy |
|---|---|
| `menu.linkedin` | LinkedIn ↗ |
| `menu.email` | Email ↗ |
| `menu.location` | Berlin, DE |

## Footer

| ID | Element | Copy |
|---|---|---|
| `foot.h1` | Column heading | Index |
| `foot.index.1` | Link | Selected work |
| `foot.index.2` | Link | About |
| `foot.index.3` | Link | Process |
| `foot.index.4` | Link | Contact |
| `foot.index.5` | Link | Résumé |
| `foot.h2` | Column heading | Case studies |
| `foot.case.1` | Link | 01 · Enter |
| `foot.case.2` | Link | 02 · Coup Mobility |
| `foot.case.3` | Link | 03 · Cooler Future |
| `foot.case.4` | Link | 04 · Vivy |
| `foot.h3` | Column heading | Elsewhere |
| `foot.linkedin` | Link | LinkedIn ↗ |
| `foot.email` | Link | Email ↗ |
| `foot.copyright` | Legal line | © 2026 James Ciclitira · Product Designer · Berlin |
| `foot.grid` | Grid hint _(home only)_ | Press `G` for the grid |
| `foot.top` | Back to top | Back to top ↑ |

### Case-study pages only
| ID | Element | Copy |
|---|---|---|
| `case.back` | Return link, top of page | ← All work |
| `case.top.label` | Floating button (screen-reader label) | Back to top |
| `case.top.text` | Floating button | Top |

---

# 01 · index.html — Home

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | James Ciclitira · Product Designer, Berlin |
| `meta.description` | Meta description | Senior Product Designer in Berlin. Eleven years designing digital products end to end for companies working on things that matter. |
| `meta.og.title` | Social share title | James Ciclitira · Product Designer, Berlin |
| `meta.og.description` | Social share description | Senior Product Designer in Berlin. Eleven years designing digital products end to end for companies working on things that matter. |

## Intro curtain

| ID | Copy |
|---|---|
| `intro.brand` | James Ciclitira |

## Hero

### Metadata strip (four items, left to right)
| ID | Copy |
|---|---|
| `hero.meta.1` | Senior Product Designer |
| `hero.meta.2` | Berlin, DE |
| `hero.meta.3` | Practising since 2015 |
| `hero.meta.4` | Available from Oct 2026 |

### Headline
Set as three lines. The full stop is the red accent — keep it on the last line.

> **Line 1:** Complex
> **Line 2:** systems,
> **Line 3:** made usable **.**

### Subhead & call to action
| ID | Copy |
|---|---|
| `hero.sub` | I design digital products where software meets hardware and real-world operations, turning complex workflows into tools people can actually use. |
| `hero.cta` | Selected work |
| `hero.cta.long` | : four case studies _(hidden on small screens)_ |
| `hero.photo.alt` | James Ciclitira, photographed in black and white against a plain wall, head and shoulders, looking towards the camera. |

## Discipline strip

Landmark label: _How I work_

| ID | Term | Definition |
|---|---|---|
| `disc.1` | Disciplines | UX Research · Service Design · Product Strategy · Information Architecture · Interaction Design |
| `disc.2` | Specialties | Digital-to-Physical Integration · Operational Tooling · Workflow Automation |
| `disc.3` | Domains | Climate Tech · Digital Health · Fintech · Urban Mobility · B2B · B2C · Regulated Products |

## Clients & employers

| ID | Copy |
|---|---|
| `clients.h` | Clients & employers |
| `clients.idx` | Selected · 06 _(fixed)_ |
| `clients.alt` | Enter logo · Bosch logo · Allianz logo · Cooler Future logo · YunoJuno logo · Quidco logo |

## Selected work

| ID | Copy |
|---|---|
| `work.h` | Selected work |
| `work.idx` | 01 / 04 · 2017–2026 _(fixed)_ |
| `work.cta` | View case study _(all four)_ |

### 01 · Enter
> Enter helps German homeowners plan energy-efficient renovations and claim government subsidies covering up to 70% of the cost. Certified energy advisors survey the home on site, and AI turns the data into a plan the homeowner can act on.

| Role | Domain | Scope |
|---|---|---|
| Senior Product Designer | Climate tech | B2C & field ops |

**Alt:** An Enter energy advisor standing in a stairwell, tracing a building's footprint on a tablet during an on-site survey.

### 02 · Coup Mobility
> Bosch’s e-moped sharing service put 5,000 electric mopeds across Berlin, Paris, and Madrid. They could be found on a map, unlocked with a phone, and left anywhere. Behind the rider experience lay a massive field operation keeping every vehicle charged, repaired, and on the streets.

| Role | Domain | Scope |
|---|---|---|
| Senior Product Designer | Urban mobility | B2C & fleet ops |

**Alt:** Two riders on Coup's red shared e-mopeds waiting at a Berlin intersection.

### 03 · Cooler Future
> A sustainable investing app for people who want to know exactly what their money is funding. It offers curated climate funds, transparent impact data and a €20 minimum investment, built for first-time investors and sceptics who want hard proof, not greenwashing.

| Role | Domain | Scope |
|---|---|---|
| Lead Product Designer | Sustainable fintech | B2C mobile |

**Alt:** Cooler Future key visual: an aerial view of a turquoise glacial lake, captioned "The footprint of money: reshaping sustainable investing".

### 04 · Vivy
> An Allianz-backed digital health record that lets patients request medical documents, store them securely on their phones, and share them with any practitioner. A modern, encrypted solution built for a country where medical records still move by mail, fax, and in-person requests.

| Role | Domain | Scope |
|---|---|---|
| Product Designer | Digital health | B2C & healthcare B2B |

**Alt:** The Vivy health record app open on a phone, showing a patient's stored medical documents.

## About

| ID | Copy |
|---|---|
| `about.h` | About |
| `about.idx` | 02 / 04 _(fixed)_ |

### Heading
> **Line 1:** How I think
> **Line 2:** about the work **.**

### Facts table
| ID | Key | Value |
|---|---|---|
| `about.t.1` | Based in | Berlin, Germany |
| `about.t.2` | Working since | 2015 |
| `about.t.3` | Languages | English · German (B2) |
| `about.t.4` | Currently | Open to full-time & part-time |

### Body
> **P1:** Most of that time has been spent in complex domains: digital health, sustainable investing, urban mobility, and now home energy. The common thread is products people depend on to do something that matters to them, increasingly at companies working on environmental impact.

> **P2:** Research comes first. It’s far cheaper to learn before you build than after you launch. Time with real users usually reveals the right direction; the job is to ask the right questions, reduce complexity, and turn insight into products that are clear and usable.

> **P3:** My experience ranges from being the sole designer in an early-stage startup to working inside large cross-functional teams, leading projects from research through to delivery.

## The process

| ID | Copy |
|---|---|
| `proc.h` | The process |
| `proc.idx` | 03 / 04 _(fixed)_ |

| Key | Title | Description |
|---|---|---|
| Where | Go where the work happens | What breaks a product is rarely visible from a desk. It’s on the tablet in someone’s basement, in the fax machine at the clinic, in the spreadsheet the ops team actually runs on. |
| How | Keep it rough while it’s still wrong | Storyboards and grey boxes get argued with; polished screens get approved. I keep the work unfinished-looking while the direction is still in question, then make prototypes real enough to earn honest reactions. |
| When | Stay until it ships | Working alongside engineers through the build, on real devices, with real data. If a design doesn’t hold up once it’s coded, it wasn’t done. |

## Contact

| ID | Copy |
|---|---|
| `contact.h` | Say hello |
| `contact.idx` | 04 / 04 _(fixed)_ |

### Heading
> **Line 1:** Let’s talk about
> **Line 2:** what you’re
> **Line 3:** building **.**

### Details table
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
| `form.subject` | What’s the project? | Give me the quick version |
| `form.message` | Tell me more | What are you building, what's the problem, when do you need someone… |
| `form.submit` | — | Send message |

### Easter-egg trigger
| ID | Copy |
|---|---|
| `egg.label` | Play a hidden game _(screen-reader label)_ |
| `egg.text` | Play |

---

# 02 · enter.html — Case study

Section headings are set across several lines. The _italic_ portion is the red accent —
keep it on the closing phrase.

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | Enter · James Ciclitira |
| `meta.description` | Meta description | A field tool for energy advisors: capture a building survey on site, feed it to an AI model, and produce the report German homeowners need for retrofit funding. |
| `meta.og.title` | Social share title | Enter · James Ciclitira |
| `meta.og.description` | Social share description | A field tool for energy advisors: capture a building survey on site, feed it to an AI model, and produce the report German homeowners need for retrofit funding. |

## Hero

| ID | Copy |
|---|---|
| `hero.eyebrow` | Climate Tech · Field Operations · Customer Journey |
| `hero.title` | _Enter_ |
| `hero.intro` | A climate-tech startup helping German homeowners plan energy-efficient renovations. I designed the advisor’s field tool and the customer journey, from the first on-site visit to the official retrofit report. |
| `hero.alt` | An Enter energy advisor tracing a building’s footprint on a tablet during an on-site survey |

| Role | Company | Products |
|---|---|---|
| Senior Product Designer | Enter, Berlin | Advisor field app · Customer report · iSFP flow |

### Stat trio
| Figure | Caption |
|---|---|
| iSFP | Official government document generated from field data |
| 2D | Live floor plans with window-level precision |
| 1 visit | Survey, energy model and findings, before anyone leaves the house |

## The context

> Billions in renovation funding.
> The data to unlock it _didn’t yet exist._

> **P1:** Enter helps German homeowners plan energy-efficient renovations: insulation, heat pumps, new windows, and the government funding that covers much of the cost. The **Bundesförderung für effiziente Gebäude** (BEG) pays up to 70% on certain measures. To qualify, a homeowner needs an Individual Renovation Roadmap (iSFP), prepared by a certified energy advisor after an on-site assessment.
> That visit is the foundation of everything after it: the energy model, the recommendations it produces, and the report needed to claim the funding.

> **P2:** When I joined, advisors worked from paper forms and handwritten notes. The data was inconsistent, hard to digitise and unfit for an AI pipeline. Nothing existed for advisors collecting information in the field, or for homeowners trying to understand their options.
> I led the design of both: a tablet-first field app that guides advisors through the on-site assessment, and a digital customer report that helps homeowners compare renovation scenarios and decide what to do next.

## Understanding the work

> Two hours in the house.
> A week to the _answer._

> **P1:** I rode along on several assessments, start to finish, from the meter cupboard to the loft: what advisors measured, what they wrote down, what they left until later. Then I followed the data backwards, sitting with the team who turned those notes into an energy model and listening to the calls where the homeowner finally heard the results.

> **P2:** The visit took around two hours in the house. The model took days at a desk. The homeowner heard the outcome on a phone call a week later, long after the advisor had left their kitchen.
> Three stages, three teams, a handover at every seam. Every seam was somewhere data could go missing or interest could cool, and none of it was visible from a desk in Berlin.

| Caption | Alt text |
|---|---|
| Ride-alongs: following the assessment through the house, room by room | Energy advisor following a homeowner through the hallway of a house at the start of an assessment |
| Page three of six: room areas, wall build-up, U-value. All of it rekeyed at a desk later | Handwritten building survey sheet: a floor plan marked with room areas, alongside notes on wall build-up, missing insulation and calculated U-values |

## Rethinking data collection

> Paper first.
> Then _the engineering._

> **P1:** The obvious answer was a digital floor plan the advisor could draw on. But building one properly meant cadastral data, a drawing surface, live geometry and validation. Months of engineering, and I didn’t want to spend them finding out that the idea underneath didn’t survive a real house.
> So I made the cheapest possible version of it. A pre-populated 2D footprint, pulled from cadastral records and dimensioned, dropped into the Files app on the advisor’s own tablet and marked up with a pencil during real appointments. No code. An afternoon to change.

> **P2:** It carried two ideas, and I had very different confidence in them.
> The first was the footprint itself. Could an advisor work from a plan they hadn’t drawn? Was the registered geometry actually right? Did starting from it save time? I expected this to hold, but it was the expensive thing to build, which made it the thing worth proving first.
> The second was speculative. Rather than specifying every window one by one, the advisor defined three or four window _types_ by year, frame material and glazing, then tagged positions on the plan by colour. Far less manual effort, but a complete rethink of how the survey worked, and I had no idea whether what came back would still be good enough for the modelling team.

> **P3:** Every completed sheet went to two audiences: the advisors who had to work this way in someone’s attic, and the modelling team who had to build an energy model out of whatever came back. A version that satisfied one and failed the other wasn’t worth building, which is why both were in the room for every round.

| ID | Copy |
|---|---|
| `proto.link` | Open the prototype sheet (PDF) ↗ |
| `proto.link.label` | Open the full prototype sheet as a PDF _(screen-reader label)_ |

| Caption | Alt text |
|---|---|
| One sheet per floor: the footprint, windows tagged by type, and one blunt question: does this plan match the floor you are standing on? | Prototype survey sheet: a dimensioned building footprint with coloured crosses marking window positions, a question asking whether the plan matches the floor, and a table defining four window types by frame material and glazing |
| Marked up in the Files app on the advisor’s own tablet. Nothing was built to run this test | Energy advisor marking up the prototype floor plan on a tablet inside an unfinished house |

### Findings
| Title | Body |
|---|---|
| The footprint held | Advisors could work from a plan they hadn’t drawn. The registered geometry was close enough to correct on site rather than re-measure from scratch, and starting from something beat starting from nothing. That was the green light to build it properly. |
| So did the window types | The idea I trusted least turned out to be the bigger win. Defining three or four types and tagging positions by colour turned the most tedious stretch of the survey into something quick and almost painless. The modelling team got what they needed too. Only position and size still had to be captured opening by opening. |
| Paper still leaked | Whatever the format, a field skipped in the house was a field missing at the desk. Structure on a page can invite completeness but it cannot enforce it. That was the argument for a real tool rather than a better form. |

> **Closing:** That reframed the brief. Not “digitise the form”, but: make capture fast enough for the advisor and structured enough that the AI can turn it into findings the homeowner sees before anyone leaves the house. The compliant iSFP still needed finishing afterwards. The conversation no longer had to wait for it.

## End to end

> Field data. AI model.
> Government document.
> _One continuous flow._

| Step | Description |
|---|---|
| Field Visit | Advisor conducts the assessment on site using a tablet |
| Building Survey | Rooms, floors, construction materials, windows, heating systems and a detailed floor plan are captured |
| AI Processing | Assessment data becomes the building’s energy model and its recommended measures |
| Customer Report | The advisor reviews the results with the homeowner: assessment, recommended measures, expected savings and available subsidies |
| Final iSFP | Agreed measures are compiled into the official Individual Renovation Roadmap, ready for the funding application |

> **Sub-heading:** Fast processing. The advisor still _decides._

> **P1:** Processing was quick enough that there was no waiting state to design. The question was what the advisor could do with the numbers coming back. Chief among them is the U-value: how much heat escapes through a square metre of wall, roof or window. The lower the figure, the better insulated the element, and the whole model rests on it.

> **P2:** So rather than returning U-values at the end, we calculated them live and showed them updating as construction details were entered. Every value stayed editable. An advisor standing in front of an opened-up wall could override the calculated figure with their own, and the model took their number instead. The AI set the default. The person in the building had the last word.

> **P3:** An override was a signal, not an error. Where advisors corrected the same assumption repeatedly, that was a defect in the model worth feeding back.

## Appointment management

> Everything the advisor needs
> before they _knock on the door._

> **P1:** The appointment screen was the starting point for every visit. Before tapping “Start appointment”, advisors could check the homeowner’s details, see the property on a map and its estimated size, call the client or open navigation. The assessment itself stayed locked: starting the appointment marked the official beginning and opened the data collection flow.

> **P2:** Once the data was uploaded, the same screen showed the appointment complete and unlocked the customer report. The report could only be generated once every required section had been submitted, so every recommendation rested on a complete survey.

| Caption | Alt text |
|---|---|
| Before: data locked, “**Termin starten**” visible | Pre-appointment briefing screen |
| After: full data unlocked, iSFP ready | Post-completion appointment screen |

## Building data capture

> Every house is different.
> Every detail _matters._

> **P1:** The field tool was structured around the iSFP format: house data, systems, floors and rooms, and construction. Advisors navigated between tabs, drilling into each floor and room in turn. Nothing was free text where it could be structured: dropdowns, toggles and preset options kept the data clean for the model downstream.

> **P2:** Each section followed the same pattern: enter data, take photos if relevant, move on. The advisor always knew where they were in the survey and exactly what was left. On a 186m² detached house, that mattered.

| # | Section | Detail |
|---|---|---|
| 01 | House Data | Year built, footprint, energy costs, living area |
| 02 | Systems | Heating, hot water, ventilation, renewables |
| 03 | Floors & Rooms | Each storey: room count, area, windows, heating status |
| 04 | Construction | Walls, insulation, roof, basement: materials & U-values |

| Caption | Alt text |
|---|---|
| Floor and room structure: each storey drilled into in sequence | Advisor navigating floor list on tablet |
| Data confirmation: all building data reviewed before submitting to AI processing | Data review screen |

## The floor plan feature

> Window-level accuracy.
> Built into the _floor plan._

> **P1:** Windows are one of the most consequential variables in an energy model, and the paper trials had already settled the shape of the answer: place each opening on the plan, but pull its specification from a handful of pre-defined types. Position, dimensions and glazing all affect the U-value of the surrounding wall, which decides which retrofit measures make financial sense. Get it wrong and the whole recommendation skews.

> **P2:** The floor plan feature pulled in a pre-populated 2D footprint from cadastral and satellite sources, then let advisors place each window directly on the plan, dragging it to the correct wall, entering dimensions, confirming glazing type. One spatial interaction replaced three separate form fields. Across a survey that took around 25% off the time on site, enough for one more appointment a day.

> **P3:** The footprint served a second purpose: advisors could flag differences between the registered data and what they saw on site, feeding corrections back for future visits. The pre-populated data got more reliable, and surveys arrived at the desk far more complete, with completeness rising from 80% to 95%.

| Caption | Alt text |
|---|---|
| Placing a window on the 2D floor plan: position, size and glazing confirmed in one step | Advisor placing window on 2D floor plan |

## The customer report

> Field data becomes
> a plan a homeowner _can trust._

> **P1:** Once the field survey was submitted, the AI processed the assessment data and generated a draft report within seconds. Rather than returning for a second visit, the advisor stayed with the homeowner and used the report immediately to review the findings together.

> **P2:** I designed this part of the product from scratch: a structured report that guided the conversation and helped the homeowner choose between the options. Together they confirmed which measures went into the final iSFP, the document behind the funding application.

### Report contents
| # | Title | Description |
|---|---|---|
| 01 | Future outlook | Rising energy costs in the years ahead, and the subsidies available. |
| 02 | Current assessment | The property’s energy performance today, and its savings potential. |
| 03 | Renovation roadmap | Measures reviewed and chosen, ranked by saving, cost and suitability. |
| 04 | Your next steps | When the iSFP arrives, and the quote comparison service that follows. |

### Report walkthrough
**Future outlook — The cost of doing nothing**
> The report opened with energy prices rather than renovation costs. Projected gas, oil and electricity rates ran out to 2064, set against what this household was already spending each year. It gave the rest of the conversation a baseline: not what a retrofit costs, but what standing still costs.
>
> _Alt:_ Report screen showing projected energy price development and expected household costs

**Current status — Where the building stands today**
> Year built, floor area, heat source and annual consumption, drawn straight from the survey the advisor had completed minutes earlier in the same house. Beside it, the current energy class and the class the building could realistically reach. Homeowners recognised their own property here, which is what made the numbers credible.
>
> _Alt:_ Report screen showing the current building assessment and energy class

**Renovation measures — Every measure, ranked**
> The AI’s full set of recommendations in one table: annual savings, payback period, cost and a recommendation rating for each measure. Ticking a measure updated the totals along the bottom, so the pair could assemble a package and watch the combined saving, energy class and subsidy move as they went.
>
> _Alt:_ Report screen listing all available retrofit measures with rankings

**Renovation details — What one measure does on its own**
> Opening a measure showed it in isolation: what it saves, what it costs, the subsidy it attracts, the payback period and the energy class it moves the building to. This was usually where the decision happened.
>
> _Alt:_ Report screen showing the individual impact of a selected heat pump measure

## Product metrics

> How success was _measured._

| Metric | Description |
|---|---|
| Data accuracy | More consistent building data, with fewer errors reaching the energy model. |
| Time on site | Reducing time spent on property visits without sacrificing data quality. |
| iSFP turnaround | Shortening the time from site visit to completed iSFP. |
| Retrofit sales | Helping more homeowners move forward with recommended measures. |

| Figure | Caption |
|---|---|
| 25% | Less time per on-site survey, enough for one more appointment a day |
| 80 → 95% | Data completeness on surveys reaching the energy model |

## Next project

| ID | Copy |
|---|---|
| `next.label` | Next project → |
| `next.title` | Coup _Mobility_ |
| `next.meta` | Senior Product Designer · Bosch · Fleet Operations |

---

# 03 · coup.html — Case study

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | Coup Mobility · James Ciclitira |
| `meta.description` | Meta description | Bosch's e-moped service across three cities. Rebuilding a ride experience that left riders without the information they needed, and the ops tools behind it. |
| `meta.og.title` | Social share title | Coup Mobility · James Ciclitira |
| `meta.og.description` | Social share description | Bosch's e-moped service across three cities. Rebuilding a ride experience that left riders without the information they needed, and the ops tools behind it. |

## Hero

| ID | Copy |
|---|---|
| `hero.eyebrow` | Mobility · Consumer UX · Field Operations |
| `hero.title` | Coup _Mobility_ |
| `hero.intro` | A Bosch-owned e-moped fleet across three European cities. I led the redesign of the rider app and designed the tools behind it: a dispatcher dashboard and a field worker app for the operation keeping 5,000 scooters on the road. |
| `hero.alt` | Two riders on Coup’s red shared e-mopeds waiting at a Berlin intersection |

| Role | Markets | Products |
|---|---|---|
| Senior Product Designer | Berlin · Paris · Madrid | Rider app · Dispatcher dashboard · Field worker app |

### Stat trio
| Figure | Caption |
|---|---|
| 5,000 | Electric mopeds across Berlin, Paris and Madrid |
| 1 in 8 | Rides cancelled before the engine started, with the reason unrecorded |
| Zero | Tools built for the field team before this project |

## The brief

> A product people loved.
> An app that kept _letting them down._

> **P1:** Coup was ahead of its time: fully electric, free-floating mopeds across Berlin, Paris and Madrid, before the category had really taken shape. Backed by Bosch and growing quickly, the service had real momentum. But the app was the weak link.
> It had been built for speed: get the fleet live, prove the concept. And it showed. Riders were missing the information they needed at the moments they needed it, and the service broke down in the places a service has to hold. The first job was to rebuild every interaction around the ride itself, from finding a scooter to ending a trip.

> **P2:** The second challenge was behind the scenes. Coup’s field operations ran on WhatsApp groups and spreadsheets, with no reliable way to assign work, track maintenance or report issues. Every scooter off the road longer than necessary was lost revenue, multiplied across thousands of vehicles and three cities.
> Nothing supported that layer, so we designed it. The dispatcher dashboard and field worker app started with the reality of the work: people fixing vehicles on the street, in all weathers, with little time and constant pressure to keep the fleet moving.

## 01 · The consumer ride app

> Rebuilt from the ground up,
> not _reskinned._

> **P1:** On paper the old app worked: riders could find a scooter, unlock it and end a ride. In practice it failed them. The information a rider needed in order to decide was missing at the moment they needed it, and the app rarely said what was happening or what to do next. Cancellations and support tickets were the symptoms. The cause was a service that had never been designed as one.

> **P2:** So we did not reskin it. We rebuilt the journey against the basics: does the rider always know what state they are in, what happens next, and what to do when something goes wrong? Interviews across all three cities kept returning the same word: confidence. Riders wanted to know they had picked the right scooter, to see what the service was doing on their behalf, and to stay in control from start to finish.

> **P3:** We rebuilt every step of the ride: discovery and maps, scooter selection, reservations, pre-ride checks, the ride itself and trip completion. The work was in what the app said and when it said it: which information belonged at each moment, how prompts were timed, and whether a rider could always answer the question “what now?”

> **P4:** Reliability was the other half of the failure. Bluetooth dropped, unlocks failed, and when they did the app left riders guessing. Experienced users had learned the quirks; new riders were simply stuck. We mapped every moment that caused hesitation or failure, then rebuilt those flows around clear guidance, honest error states and the fastest route back to moving.

> **P5:** Rebuilding the flow also turned the rider app into a source of operational insight. Rather than relying on riders to report problems, we captured the signal at the moment a problem occurred. A three-tap cancellation flow told the operations team more than a dedicated reporting feature would have, because it matched what riders already did.

| Caption | Alt text |
|---|---|
| The object the whole service turns on: one moped, three cities, thousands of daily decisions | The Coup e-moped |
| Redesigned ride experience: a clearer flow built around confidence, transparency and keeping riders in control | Redesigned ride experience: route to scooter, reservation, unlock and cancellation |
| _(no caption)_ | A Coup e-moped parked by the canal in Berlin |
| _(no caption)_ | The Coup fleet lined up on a Berlin street |
| _(no caption)_ | Riders collecting Coup scooters at Potsdamer Platz |

### Passive intelligence

> One in eight rides was
> cancelled. Nobody knew _why._

> **P1:** Around one in eight rides was cancelled before the engine started. Costly, and worse, impossible to fix: the reasons were invisible. Damaged scooter? Battery too low? Wrong vehicle? Missing helmet? Without data, every improvement was a guess.

> **P2:** We added one step to the cancellation flow: a short list of reasons, one tap, then out. Quick for the rider, and a structured, timestamped record for the ops team.

> **P3:** For the first time the team could see why rides were failing and fix the biggest causes, rather than guess across thousands of scooters.

| Caption | Alt text |
|---|---|
| Cancellation prompt: structured reporting built into a moment riders were already experiencing | Cancellation flow with structured reason prompt |

## 02 · Research before commitment

> Testing an expensive idea
> _before building anything._

> **P1:** The idea on the table: let engaged riders earn credits by swapping flat batteries themselves, cutting ops costs and reliance on field workers. The appeal was obvious, but validating it properly would have meant building charging infrastructure that didn’t yet exist. An expensive bet to place on a hunch.
> Instead we ran a small in-app pilot: targeted changes to the existing flow that let us watch what riders actually did. Cheap, quick, and enough for the business to decide whether the infrastructure was worth building. Design used to answer a question, not to ship a feature.

| Caption | Alt text |
|---|---|
| Community battery swapping pilot: testing intent before infrastructure commitment | Community battery swap pilot |

## 03 · The field operations platform

> Nothing existed.
> We built the _whole thing._

> **P1:** Ground operations ran on WhatsApp, spreadsheets and memory. Assignments came through group chats. Maintenance was logged inconsistently, if at all. Dispatchers had no live view of the fleet, field workers had no reliable way to receive jobs, and nothing recorded what had been done across thousands of scooters.
> Every gap cost money. A scooter with an unresolved fault stayed offline. A field worker without priorities wasted time. A dispatcher without accurate information decided on assumptions.

> **P2:** There was no brief, just a blank page. We started with the work itself: riding along with field workers, sitting with dispatchers, mapping the informal systems teams had built to keep the fleet running.
> Two needs emerged. Dispatchers needed visibility and control over the whole fleet. Field workers needed clear instructions and a fast way to close jobs on the street. That became two connected products: a fleet dashboard on the web and a mobile-first app for the field.

### Platform capabilities
| Title | Body |
|---|---|
| Fleet status at a glance | A live view of every scooter: availability, open issues, maintenance status. Dispatchers could read the health of the operation without chasing manual updates. |
| Structured maintenance logging | Workers received clear assignments, worked through guided steps and recorded outcomes in a consistent format. Every action left a traceable history. |
| Assignment management | Dispatchers created, assigned and reprioritised tasks as conditions changed. Jobs arrived on the worker’s phone, replacing calls and WhatsApp chains. |

| Caption | Alt text |
|---|---|
| Field worker app: assignments, status updates and maintenance logging in a single flow | Field worker app assignment view |
| Maintenance report: structured outcome logging that built the ops team’s data picture over time | Maintenance report screen |
| _(no caption)_ | Field worker app sign-in screen |
| _(no caption)_ | Scooter status view: battery level, location and open faults for one vehicle |
| _(no caption)_ | Dispatcher overview: the live fleet map with vehicles grouped by status |
| The ticket queue: every field task categorised, assigned and tracked from creation to completion | Dispatcher ticket queue with battery swaps queued, in progress and completed |

> **Closing:** The field worker app had to hold up in demanding conditions: rain, traffic, winter, often one-handed. Controls had to work with gloves on. Text had to stay legible in full sun. Actions had to be large, obvious and hard to mistake, so a tired worker never had to stop and puzzle over the screen.

## Product metrics

> How success was _measured._

| Metric | Description |
|---|---|
| Scooter downtime | Keeping more scooters on the road through faster maintenance and repairs. |
| Task completion | Helping field teams prioritise and complete work more efficiently. |
| Manual coordination | Replacing WhatsApp and spreadsheets with structured fleet workflows. |
| Rides per scooter | Getting more trips out of every vehicle in the fleet, each day it is on the street. |

## Next project

| ID | Copy |
|---|---|
| `next.label` | Next project → |
| `next.title` | Cooler _Future_ |
| `next.meta` | Lead Designer · Climate Fintech · Full launch |

---

# 04 · cooler-future.html — Case study

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | Cooler Future · James Ciclitira |
| `meta.description` | Meta description | A climate investing app taking on greenwash head-on. Sustainable funds, transparent impact data, and an onboarding flow that made investing accessible from €20. |
| `meta.og.title` | Social share title | Cooler Future · James Ciclitira |
| `meta.og.description` | Social share description | A climate investing app taking on greenwash head-on. Sustainable funds, transparent impact data, and an onboarding flow that made investing accessible from €20. |

## Hero

| ID | Copy |
|---|---|
| `hero.eyebrow` | Climate Fintech · Lead Design · Full Launch |
| `hero.title` | Cooler _Future_ |
| `hero.intro` | Sustainable investing was crowded with greenwashing and jargon. Cooler Future set out to build a more transparent alternative. I led design from day one: research, product, website and launch. |
| `hero.alt` | Cooler Future key visual: an aerial view of a turquoise glacial lake, captioned "The footprint of money: reshaping sustainable investing" |

| Role | Stage | Products |
|---|---|---|
| Lead Product Designer | Pre-launch through to full product release | Investing app · Marketing site · Design system |

### Stat trio
| Figure | Caption |
|---|---|
| €20 | Minimum investment, open to almost anyone |
| 2 | Distinct user types with fundamentally different needs |
| 0 → 1 | Joined before a screen existed, stayed through to public launch |

## The brief

> Green investing had a _credibility problem._

> **P1:** It is easy to label a fund sustainable. It is much harder to stand behind that label when someone looks closer. Most products leaned on jargon and vague impact claims nobody could check.
> Cooler Future built the product around transparency instead: what is in the portfolio, what is excluded, how the credentials were verified, and what the money actually supports, trade-offs included.

> **P2:** I joined before anything had been designed. The scope was the mobile app, the marketing site and the design system holding both together. The first question was who we were building for and what they needed in order to trust it.
> Research came first, and it shaped everything after.

## Research

> Two very different users,
> looking at the _same screen._

> **P1:** Interviews, diary studies and card sorting turned up something the brief had missed: this was not one audience. It was two groups arriving at the same product with different questions.

> **P2:** What each group knew, doubted, and needed in order to trust us became the basis of the strategy. Research did not just shape the interface; it changed how the product had to talk.

**First-time investors — Curious but overwhelmed**
> Interested in making better choices, but unsure where to start. They arrived with questions like _“Is this actually better than leaving my money in the bank?”_ The product needed to answer that through the experience itself, rather than relying on separate education pages.

**Existing investors — Sceptical and evidence-driven**
> Already investing and familiar with the promises of sustainable finance. They had seen vague claims before and wanted proof: _“How is this actually different from what I already have?”_ For this audience, transparency was not just a brand value. It was the reason to trust the product.

## Onboarding

> Opening a regulated investment
> account is legally complex.
> _It doesn’t have to feel that way._

> **P1:** Signing up meant opening a German depot account: identity verification, tax details, KYC and regulatory disclosures. All of it mandatory. The job was to make it feel like the minimum, not a wall.

> **P2:** Anything that could be postponed was postponed, and anything not legally required was removed. Every step was introduced with clear context, users knew what information they needed before reaching it, and progress remained visible throughout.

> **P3:** After registration, users went straight to the themes: Smart Energy, Clean Water, Circular Economy, Forestry & Timber. Choosing what to back came before committing any money.

| Caption | Alt text |
|---|---|
| Register in 10 mins | Registration flow: take your first step |
| Choose your themes | Explore the funds |
| Your portfolio | Portfolio overview |

## The portfolio experience

> Clean enough to trust
> at a glance. Deep enough
> _to explore._

> **P1:** The portfolio screen became the product’s home, the place users returned to most often. Its first job was simple: show how an investment was performing. Its second was more important: connect that performance to the environmental impact behind it, with evidence rather than marketing.

> **P2:** For first-time investors, it put returns and measurable impact in one place. For experienced ones, it carried the evidence they expected: performance, sector allocation, exclusion criteria, and how each fund’s credentials were assessed.

> **P3:** Every layer of the experience was designed to answer the same question: why should I trust this investment?

| Caption | Alt text |
|---|---|
| Portfolio overview | Portfolio performance chart and investments |
| Fund detail and impact | Smart Energy fund detail screen |

## The impact problem

> Designing for honesty,
> _not certainty._

> **P1:** Communicating the environmental impact of an investment was the hardest problem on the product. Regulators, data providers and frameworks all measured impact differently, which made it hard to say anything both meaningful and defensible.

> **P2:** The link between a €500 investment and a real-world outcome is rarely direct. Capital moves through funds, asset managers and underlying holdings, making precise attribution almost impossible. Rather than flatten that, I explored goal-based impact summaries, supported-project feeds and carbon dashboards with real-world comparisons.

> **P3:** The work stayed exploratory, but it set a principle the product kept: show only what the data supports, give the context to read it, and never overstate the impact.

| Caption | Alt text |
|---|---|
| Goals: breaking impact down by investment theme | Impact dashboard showing sustainable investment goals |
| Projects: showing what funds are actively supporting | Supported projects including wind farm and solar |

## Education

> Trust was the barrier.
> Understanding was _how we got past it._

> **P1:** Trust was the biggest barrier for both groups, for opposite reasons. First-time investors doubted themselves. Experienced investors doubted the industry. The Learn section covered both: the fundamentals of sustainable investing for newcomers, and fund methodology, ratings and portfolio construction for everyone else.

> **P2:** Content sat in self-paced courses with progress tracking, and users could suggest what to cover next. Education was part of the product, not a marketing channel: it explained not just where the money went, but why. Enough confidence to move from reading to a first investment.

| Caption | Alt text |
|---|---|
| Learn: courses and sustainability content | Learn section with courses and blog |
| Investing 101: progress tracked lesson by lesson | Investing 101 lesson list with progress |

## Marketing website

> Two surfaces.
> _One world._

> **P1:** Alongside the app, I designed the marketing site, usually the first thing anyone saw. It had to carry the same transparency people would meet inside the product.
> Visual language, messaging and trust signals ran as one system across both. For a product built on trust, a gap between site and app would have broken the promise before anyone opened an account.

**Alt text:** Marketing site homepage: the product promise above a view of the app · Marketing site funds page: each theme with its holdings and exclusions · Marketing site about page: the team and the methodology behind the ratings · Marketing site invest page: how to open an account and what it costs

## Product metrics

> How success was _measured._

| Metric | Description |
|---|---|
| Onboarding completion | Reducing drop-off throughout the regulated sign-up journey. |
| First investment | Helping more users move from account creation to investing. |
| Trust in impact data | Making sustainability claims transparent and easy to understand. |

## Next project

| ID | Copy |
|---|---|
| `next.label` | Next project → |
| `next.title` | Vivy _Health_ |
| `next.meta` | Founding Designer · Allianz-backed · Digital health |

---

# 05 · vivy.html — Case study

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | Vivy · James Ciclitira |
| `meta.description` | Meta description | An Allianz-backed digital health record, letting patients request, store, and share encrypted medical files from their phone. Designed from the ground up. |
| `meta.og.title` | Social share title | Vivy · James Ciclitira |
| `meta.og.description` | Social share description | An Allianz-backed digital health record, letting patients request, store, and share encrypted medical files from their phone. Designed from the ground up. |

## Hero

| ID | Copy |
|---|---|
| `hero.eyebrow` | Digital Health · Allianz-backed |
| `hero.title` | Vivy |
| `hero.intro` | Your medical history, from lab results and prescriptions to X-rays and discharge letters, is usually spread across hospitals, clinics and paper files. Vivy set out to bring it into one encrypted place under the patient’s control. I joined as one of the first product designers and helped shape the product from the ground up. |
| `hero.alt` | Vivy app showing medication details, vaccination record and X-ray viewer |

| Role | Backed by | Products |
|---|---|---|
| Product Designer, founding team | Allianz Insurance | Patient app · Practitioner portal · Invoice management |

### Stat trio
| Figure | Caption |
|---|---|
| E2E | End-to-end encryption, security users could trust |
| 4 days | Design sprint in Munich with Allianz to define invoicing |
| 3 | Sides of one record: patient, practitioner and insurer |

## The problem

> Your health records exist.
> They just don’t exist
> _anywhere useful._

> **P1:** In Germany, a patient’s medical history is scattered. Lab results with one provider, X-rays with another, prescriptions on paper, discharge letters in a folder at home. Moving any of it between providers still means phone calls, faxes and in-person requests.
> Vivy gave patients one encrypted place to keep their records, request documents digitally, and share them with a practitioner whenever they chose.

> **P2:** As one of the first designers, the role went well beyond screens. A new kind of product in a heavily regulated industry: design meant setting up research practice, defining principles and building a shared way of deciding. Every feature had to balance usability, security and trust, and stay honest about what the product could not yet do.

| Caption | Alt text |
|---|---|
| First run: setting the tone before a single document is added | Vivy onboarding screens introducing the encrypted health record before sign-up |

## Document request & sharing

> The core flow: request a
> document, receive it, share it.
> _Encrypted throughout._

> **P1:** A patient opens the app, sends a request to their GP for last month’s blood results, and receives them directly to their phone, with no phone calls, no waiting rooms and no paper. Once there, files can be shared with any other practitioner in seconds, with access controlled entirely by the patient.

| Caption | Alt text |
|---|---|
| Requesting, uploading and finding a doctor: three entry points into the same flow | Three entry points to the same flow: request a document, upload one, or find a doctor |
| An early flow map, sketching how a request could reach a doctor, and where it could quietly break down. That risk turned out to be the real story (next). | Early flow map tracing a document request from patient to practice and back, with the points where it could stall |

## Expectation management

> Better to be honest with people
> than _reassuring._

> **P1:** When we launched, many document requests went unanswered, because most doctors had never heard of Vivy. The technology worked. The ecosystem wasn’t ready yet. Patients felt the app was broken. The problem wasn’t the product; it was that we’d set expectations we couldn’t yet meet.

> **P2:** So rather than hiding the uncertainty behind a progress spinner, I made it visible. The request-status system kept people informed: what was pending, why it might be delayed, and what their options were, with small explanatory moments along the way so patients understood the process, not just the interface.
> It was one of the better decisions I made at Vivy: trust people with honest information rather than paper over a messy reality with reassuring-looking UI. Patients coped far better with honesty than with false confidence.

| Caption | Alt text |
|---|---|
| Replacing a progress spinner with a specific status, a reason, and a next step | Request status screen naming what is pending and why it may be delayed · Explanatory screen setting out what happens next and what the patient can do meanwhile |

### Pull quote
> “Building a product that’s ahead of its supporting infrastructure teaches you something most UX courses don’t: how to manage the gap between vision and reality with dignity.”
>
> — James Ciclitira, on Vivy

## The Munich sprint: invoice management

> Four days with Allianz.
> One major feature,
> _defined properly._

> **P1:** Private healthcare in Germany puts the bill on the patient first: pay up front, then claim it back from the insurer. It is slow, paper-heavy and genuinely stressful. I went to Munich to run a four-day sprint with Allianz, to understand both sides before anyone designed a screen.

| Day | Title | Description |
|---|---|---|
| Day 01 | Stakeholder mapping | Unpacking Allianz’s internal workflows and the legal requirements for invoice processing. |
| Day 02 | Patient pain journey | Mapping every frustration, every piece of confusion, every moment of delay in the current process. |
| Day 03 | Rapid prototyping | Multiple invoice submission flows, tested on-the-spot with real patients and Allianz staff. |
| Day 04 | Validation & sign-off | Working prototype. Feature requirements aligned. A shared language between design, tech, and insurer. |

| Caption | Alt text |
|---|---|
| The invoice flow that came out of the sprint, validated with Allianz and real patients | Invoice management: submitting a private healthcare bill and tracking the reimbursement claim |

## File sharing & the practitioner interface

> The patient experience only
> works if doctors
> _trust it too._

> **P1:** I also designed the practitioner side: a secure, direct connection that felt professional to clinician and patient alike. The challenge was carrying enough trust signals that a doctor would put it into their workflow.

| Caption | Alt text |
|---|---|
| The patient’s phone (left) and the practitioner’s portal (right): two contexts, one trust model | Patient sharing a document from their phone, choosing who gets access · Practitioner portal: documents a patient has shared, opened on a clinic desktop |
| The Pro Portal’s online check-in: patients arrive with paperwork already done, staff see who’s due at a glance | Vivy Pro Portal online check-in list for practices |

## Product metrics

> How success was _measured._

| Metric | Description |
|---|---|
| Document requests | Helping more medical record requests reach completion. |
| Provider adoption | Supporting existing clinical workflows without changing how providers work. |
| Patient trust | Giving people confidence to store and share sensitive health records securely. |

## Back to the portfolio

| ID | Copy |
|---|---|
| `next.label` | That’s all the work → |
| `next.title` | Back to the _portfolio_ |

---

# 06 · cv.html — Résumé

The page carries two copies of the same content: the on-screen résumé and a
print-only version used by **Print / Save PDF**. Wording is identical except where
noted — keep the two in sync when editing. Dates are the one systematic difference:
on screen they use an en dash (Jul 2024 – Feb 2026), in print the word “to”
(Jul 2024 to Feb 2026).

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | James Ciclitira · Résumé |
| `meta.description` | Meta description | Senior Product Designer specialising in service design and complex customer journeys. Bridging customer needs, operational realities and digital touchpoints. |
| `meta.og.title` | Social share title | James Ciclitira · Résumé |
| `meta.og.description` | Social share description | Senior Product Designer specialising in service design and complex customer journeys. Bridging customer needs, operational realities and digital touchpoints. |

## Header

| ID | Copy |
|---|---|
| `cv.name` | James Ciclitira |
| `cv.title` | Senior Product Designer |
| `cv.email` | jciclitira@gmail.com |
| `cv.site` | jciclitira.com _(print version: www.jciclitira.com)_ |
| `cv.linkedin` | linkedin.com/in/jciclitira |
| `cv.location` | Berlin, Germany |
| `cv.print` | Print / Save PDF |

## Summary

> Senior Product Designer specialising in service design and complex customer journeys. Bridging customer needs, operational realities and digital touchpoints.

## Experience

### Enter · baupal GmbH — Senior Product Designer · Jul 2024 – Feb 2026
> Energy advisory platform for home retrofitting.
>
> - **Operational Software:** Rebuilt the advisory workflow around structured data capture and 2D floor plans, so the output could feed an AI model.
> - **Consumer Product:** Owned the homeowner experience end to end, turning survey data into a report advisors used on site.

### Cooler Future GmbH — Lead Product Designer · Jul 2021 – May 2023
> Sustainable investing app for retail investors.
>
> - **Product Strategy:** Led product design from 0 to 1 launch across iOS, Android and web platforms. _(print version adds an Oxford comma: “iOS, Android, and web”)_
> - **Product Discovery:** Defined two target audiences through user research and designed a compliant onboarding flow for both.

### Something Creative — Senior Product Designer · Feb 2021 – Jul 2021
> Digital product agency.
>
> - **Discovery & Delivery:** Led discovery and delivery on multiple client projects, from UX research to shipped design.

### Bosch · Coup Mobility — Senior Product Designer · Mar 2019 – Dec 2020
> Shared e-moped service operating 5,000 vehicles across Berlin, Paris and Madrid. _(print version: “Berlin, Paris, and Madrid”)_
>
> - **Consumer Product:** Rebuilt the rider app from the ground up, aligning the ride experience with how the operation actually ran.
> - **Operational Software:** Designed the internal fleet operations platform: dispatcher dashboard and field worker app.

### Vivy GmbH — Product Designer · Oct 2017 – Mar 2019
> Encrypted digital health records platform.
>
> - **Patient Experience:** Designed the core feature set for the patient-facing mobile application.
> - **Partnerships:** Ran design sprints with partners to shape and integrate new services on the platform.

### YunoJuno, Quidco, Suggestv — Freelance Product Designer · Oct 2016 – Oct 2017
> Independent consultancy for startups and scaling platforms.
>
> - **Research & Design:** Led end-to-end design engagements across B2B software and consumer platforms.

### CrowdScores — Product Designer · Aug 2015 – Jan 2017
> Live football scores app.
>
> - **Mobile Apps:** Led iOS and Android UX/UI design, and restructured the platform’s information architecture.

## Education

| Institution | Dates | Qualification |
|---|---|---|
| The University of Edinburgh | 2011 – 2015 | BA (Hons) Product Design |

## Skills

_The print version groups these under one heading, **Skills & Tools**._

| Strategy | Craft | Industries |
|---|---|---|
| Product Strategy | UX Research | Climate / Green Tech |
| Service Design | UI / Interaction Design | Digital Health |
| Customer Journeys | Prototyping | Mobility |
| Product Discovery | Design Systems | Fintech |
| | Design QA | B2B SaaS |
| | Information Architecture | Consumer |
| | Accessibility | |

_The **Industries** column appears on screen only, not in the print version._

| Languages | Tools |
|---|---|
| English (native) | Figma |
| German (B2, professional working proficiency) | Miro |
| | Claude Code |
| | ChatGPT |
| | AI Workflows |

_In the print version the last three read: “AI Workflows” and “Claude Code, ChatGPT”._

## Looking for _(screen only)_

| ID | Copy |
|---|---|
| `cv.want.1` | Senior Product Designer |
| `cv.want.2` | Lead Product Designer |
| `cv.want.3` | Berlin · Remote-friendly |
| `cv.want.4` | Full-time |
| `cv.want.5` | Part-time |

---

# 07 · 404.html — Not found

## Metadata

| ID | Field | Copy |
|---|---|---|
| `meta.title` | Page title | 404 · James Ciclitira |
| `meta.description` | Meta description | Page not found · James Ciclitira, Product Designer, Berlin. |
| `meta.robots` | Indexing | noindex _(fixed)_ |
| `meta.og.title` | Social share title | Page not found · James Ciclitira |
| `meta.og.description` | Social share description | That link does not lead anywhere, but the work is all still here. |

## Metadata strip

| ID | Copy |
|---|---|
| `404.meta.1` | Error 404 |
| `404.meta.2` | Page not found |
| `404.meta.3` | The work is all still here |
| `404.meta.4` | Berlin, DE |

## Headline

> **Line 1:** This page has
> **Line 2:** been renovated
> **Line 3:** away **.**

| ID | Copy |
|---|---|
| `404.body` | The link you followed doesn’t lead anywhere. It may have moved, or it may never have existed. Either way, everything worth seeing is one row down. |
| `404.cta` | Back to the work |

## Work list

| ID | Copy |
|---|---|
| `404.work.h` | Selected work |
| `404.work.idx` | 2017–2026 · 04 _(fixed)_ |

| # | Project | Domain | Years |
|---|---|---|---|
| 01 | Enter | Climate tech · Field operations | 2024–26 |
| 02 | Coup Mobility | Fleet management · Bosch | 2019–20 |
| 03 | Cooler Future | Sustainable fintech | 2021–23 |
| 04 | Vivy | Digital health · Allianz | 2017–19 |

---

# 08 · The easter egg

A Star Trek–themed arcade game hidden behind the **Play** button in the home page
footer. Static UI lives in `index.html`; the upgrade cards and encounter text live in
`js/game.js`.

## Bridge UI

| ID | Copy |
|---|---|
| `game.refit` | REFIT 1 |
| `game.progress` | 0 / 4 |
| `game.enemy` | I.K.S. Vor’cha |
| `game.warning` | Warbird closing |
| `game.controls.desktop` | ↑ impulse · ←→ helm · phasers fire themselves · esc leave the bridge |
| `game.controls.touch` | drag to steer · phasers fire themselves · ← leave the bridge |
| `game.leave` | ← Leave the bridge |
| `game.stardate` | Stardate |
| `game.deflector` | Deflector |
| `game.phasers` | Phasers |
| `game.pause` | All stop |
| `game.resume` | click or press any key to resume |

## Game over

| ID | Copy |
|---|---|
| `game.over.h` | Hull breach |
| `game.over.stat` | Stardate |
| `game.over.sub` | 0s adrift · refit 1 |
| `game.over.again` | press any key to launch again _(touch: tap to play again)_ |

## Field refit

| ID | Copy |
|---|---|
| `refit.h` | Field refit |
| `refit.sub` | Refit **2** · authorise one subsystem |
| `refit.hint` | Select a subsystem, or press `1` `2` `3` |
| `refit.hull` | Hull broken · authorise one subsystem |

### Upgrade cards
| Name | Role | Description |
|---|---|---|
| Phaser Array | Rate | Your main gun cycles faster. |
| Impulse Drive | Handling | Accelerate harder and come about quicker. |
| Phaser Array Cone | Coverage | Fires a fan instead of one beam. Covers more sky, cycles slower. |
| Photon Torpedo Bay | Crowds | Adds a slow torpedo that detonates on impact, damaging everything caught in the blast. The answer to packed rock. |
| Polarised Emitters | Pierce | Beams carry on through whatever they hit instead of stopping dead. |
| Warp Core Output | Damage | Every weapon on the ship hits harder. |
| Long-Range Emitters | Reach | Beams travel faster and stay alive longer before they fade. |
| Tractor Beam | Collect | Hauls dilithium in to you, so you need not fly through the rocks to collect it. |
| Deflector Overcharge | Defence | Raises a shield by itself, over and over, for the rest of the run. |
| Damage Control | Repair | Patches a hull plate back on, the moment you take it. |

## Red alert encounter

| ID | Copy |
|---|---|
| `alert.h` | Red alert |
| `alert.sub` | **I.K.S. Vor’cha** · intercept course · orders? |
| `alert.hint` | Give the order, or press `1` `2` |

**Option 1 — Engage · Press 1 · Stand and fight**
> Hold the sector and break her hull. She fights back, she calls escorts, and she turns nastier at half hull — but nothing else in the run pays like a kill.
>
> +1800 stardate · Battle salvage · one subsystem · +2 hull · dilithium · a power-up

**Option 2 — Evade · Press 2 · Break off and run**
> Full impulse out of the sector. She never decloaks and she never touches you — and nothing she was carrying is ever yours.
>
> No bounty · no refit · Next contact in 37s · Evasive burn · 2.6s

### Enemy ship names
I.K.S. Vor’cha · I.K.S. K’tinga · I.K.S. Negh’Var · I.K.S. Qu’Vat
