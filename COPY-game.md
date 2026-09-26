# Asteroid Blaster — Copy Deck

Every piece of user-facing text in the game, in the order you meet it during a run.

**How to use:** edit the text in each table cell or after each `>`. Don't rename the
`[ID]` labels — they're how I map each string back to its place in the source.

- `{braces}` are values the game computes at runtime. Keep them, move them, but don't
  write a number in their place — a card that quotes a figure the ship doesn't get is
  worse than one with no figure on it.
- _(fixed)_ means structural: a key cap, a counter, a label the CSS decorates. Change
  only if you mean to.
- Where two strings are listed as **desktop** / **touch**, the game picks one by
  input type. Both need to work.

**Where it lives.** The static board is `partials/game.html`, stamped by `build.js`
into both `index.html` and `lab.html` — so edit the partial, never the two copies.
Everything dynamic is in `js/game.js`. Line numbers below are current as of this pass
and will drift as the file changes; the ID is the stable handle.

⚠️ **This supersedes section 08 of `COPY-site.md`**, which is out of date — it lists
ten upgrade cards where there are now seventeen, and its wording for several of them no
longer matches what ships. Once you've worked on this deck I'll fold it back in and
cut that section.

---

## Contents

| § | Section | When the player sees it |
|---|---|---|
| 00 | [The door](#00--the-door) | Before the game exists to them |
| 01 | [The HUD](#01--the-hud) | Always, once the run starts |
| 02 | [Coaching pills](#02--coaching-pills) | First seconds, then on first discovery |
| 03 | [Warbird chrome](#03--warbird-chrome) | When a capital ship is inbound or alive |
| 04 | [Red alert — the hail](#04--red-alert--the-hail) | Before each capital ship arrives |
| 05 | [Field refit — the card](#05--field-refit--the-card) | Every time the rail fills |
| 05b | [Shakedown — the hull pick](#05b--shakedown--the-hull-pick) | Once, before the field spawns |
| 06 | [The seventeen upgrades](#06--the-seventeen-upgrades) | Three at a time, on that card |
| 07 | [All stop](#07--all-stop) | Tab blur, or a click away |
| 08 | [Hull breach](#08--hull-breach) | End of the run |

---

# 00 · The door

The game is something you come across, not something you're sent to. There are two
ways in and they're deliberately different in tone.

## Corner launcher — home page only
`index.html` · the pill in the bottom corner, over a looping Pac-Man gif.

| ID | Element | Copy |
|---|---|---|
| `launch.label` | Visible label | Play |
| `launch.a11y` | `aria-label` (screen readers) | Play a hidden game |

> The gif is decorative (`alt=""`) so the `aria-label` is the *whole* announcement a
> screen-reader user gets. It's the only string on the page that has to explain the
> button on its own.

## Experiments entry — `lab.html` § 03
Not in the game, but it's the framing a reader gets before they click, so it belongs
in the same edit pass.

| ID | Element | Copy |
|---|---|---|
| `lab.lbl` | Section label _(fixed pattern)_ | 03 · Asteroid Blaster · Canvas |
| `lab.h2` | Heading _(line break after "site,"; "playtests it." is the accent)_ | A game in the site, and the script that *playtests it.* |
| `lab.brief` | Brief box | When someone's done reading, I want something here they can play instead, so the last thing they do isn't more scrolling. |
| `lab.p1` | Body | A survivor-style roguelite over whatever page you launched it from. The phasers fire automatically, so the helm is the only control, and each time the dilithium rail fills you choose one of three upgrades. |
| `lab.p2` | Body | It needed a test rig to balance. Every warbird kill used to drop a hull point, which put the net rate at 0.00 lives a minute, so no run could ever end. Playing it never felt wrong, but the numbers were. |
| `lab.alt` | Image alt | The game running over this page: a cyan starship among magenta rocks on a dark green grid, a refit rail across the top reading REFIT 2, and a Leave the bridge button in the corner |
| `lab.cap` | Caption | Refit 2, nine dilithium to the next one. The page you launched it from is still underneath |
| `lab.cta` | Button | Play it here → |

Full `lab.h2` as marked up: **A game in the site,** / **and the script that** *playtests it.*

---

# 01 · The HUD

On screen for the whole run. Read at a glance while flying, never read properly — so
every string here is competing with a rock.

## Top rail — progress to the next refit
`partials/game.html` · values from `js/game.js:1514-1517`

| ID | Element | Copy | Notes |
|---|---|---|---|
| `hud.refit` | Refit counter | REFIT {n} | Caps are in the source string, not the CSS |
| `hud.xp` | Dilithium count | {have} / {need} | _(fixed)_ — sits next to a gem icon |

## Bottom rail — what you've got in hand right now
`js/game.js:1508-1552`

| ID | Element | Copy | Notes |
|---|---|---|---|
| `hud.score` | Score | Stardate {n} | The score's name. Also used on the game-over card |
| `hud.hull` | Hull plates | _(no text)_ | Five pixel icons, lit or unlit |
| `hud.shield` | Shield timer | Shields {n}s | Only while a shield drop is running |
| `hud.rapid` | Phaser timer | Phasers {n}s | Only while an overload is running |
| `hud.core.idle` | Overcharge gauge label | Overcharge | |
| `hud.core.ready` | …when the gauge fills | Overcharge ready | |
| `hud.core.key` | Key cap on the gauge | Space | _(fixed)_ |
| `hud.chain` | Kill-chain multiplier | Chain ×{1.00} | _(fixed)_ |

> `hud.core.*` has been through two names already. **CORE** was a resource you had to
> work out the use of; **VENT** was an order that didn't say what it was venting.
> **Overcharge** says both halves — the thing fills up, and what it does when full is
> let go of what it filled up with. It also survives both HUD states: idle and "ready".

## Controls

| ID | Element | Copy |
|---|---|---|
| `hud.exit` | Leave button (always visible) | ← Leave the bridge |
| `hud.release` | Touch button, bottom right _(touch only)_ | Release |

> `hud.release` and `hud.core.key` are the same action. If you rename one, rename the
> other — they're the only two labels for the only button in the game.

---

# 02 · Coaching pills

A pill that fades in over the field, then fades out. The rule is **once, at the
moment it first becomes true, then never again** — a tip that repeats is noise. Each
pill is a row of short phrases, not a sentence; they're shown separated by dots.

## Opening tip — on every launch
`partials/game.html` (desktop) · `js/game.js:4656` (touch). Fades after 5 seconds.

**Desktop** — five phrases:
> ↑ impulse · ←→ helm · phasers fire automatically · near misses charge overcharge · space to release

**Touch** — four phrases:
> drag to steer · phasers fire automatically · near misses charge overcharge · tap release when full

| ID | Phrase | Desktop | Touch |
|---|---|---|---|
| `tip.open.1` | Thrust | ↑ impulse | drag to steer |
| `tip.open.2` | Steering | ←→ helm | — |
| `tip.open.3` | Guns | phasers fire automatically | phasers fire automatically |
| `tip.open.4` | How the core fills | near misses charge overcharge | near misses charge overcharge |
| `tip.open.5` | How to spend it | space to release | tap release when full |

## Taught once, on first discovery
`js/game.js:202` and `js/game.js:218`

| ID | Fires when | Copy | Duration |
|---|---|---|---|
| `tip.graze.h` | First time you fly close to a rock without being hit | Close pass | 5s |
| `tip.graze.b` | …second phrase | Near misses charge your overcharge. | |
| `tip.core.h` | First time the gauge fills | Overcharge ready | 6s |
| `tip.core.b` | …second phrase, **desktop** | Press **space** to release it. | |
| `tip.core.b.touch` | …second phrase, **touch** | Tap **release** to let it go. | |

| `tip.wing.h` | First capital-ship escort wing of the run | Escort wing | 4s |
| `tip.wing.b` | …second phrase | They attack together. Break the formation. | |
| `tip.tractor.h` | First Borg tractor lock | Tractor lock | 5s |
| `tip.tractor.b` | …second phrase | Thrust away from the cube to break free. | |
| `tip.adapt.h` | First time a Borg cube adapts | The cube has adapted | 5s |
| `tip.adapt.b` | …second phrase | It shrugs off fire while it glows. Dodge and wait. | |

> `tip.core.*` is the one tip allowed to reappear — it shows every time the core
> fills until you've actually used it once, on the grounds that a prompt you've never
> acted on hasn't done its job yet. The bold word is the key cap, swapped by input
> type; keep it bold and keep it matching `hud.core.key` / `hud.release`.

---

# 03 · Warbird chrome

Only on screen while a capital ship is inbound or alive. Not part of the standing HUD.

## The capital-ship roster
`js/game.js` — `BOSS_TYPES`. Since Sep 2026 every faction sends its own flagship, with
four names each. The next contact is a faction already unlocked on the clock, never the
same faction twice running, and the first contact of a run is never an ambush. After a
faction's four names the game appends a mark number (`MK2`, `MK3`…).

| Faction | Names | Unlocks |
|---|---|---|
| Klingon | I.K.S. Vor'cha · I.K.S. Negh'Var · I.K.S. Qu'Vat · I.K.S. Gr'oth | from the start |
| Cardassian | Keldon-class Trager · Keldon-class Koranak · Keldon-class Prakesh · Keldon-class Rabol | 70s |
| Romulan | I.R.W. Khazara · I.R.W. Valdore · I.R.W. Haakona · I.R.W. T'Met | 95s |
| Borg | Tactical Cube 138 · Tactical Cube 630 · Tactical Cube 972 · Tactical Cube 316 | 138s |
| Tholian | Tholian Tarantula · Tholian Recluse · Tholian Widow · Tholian Orb-Weaver | 158s |

The name, the hull bar and the name on the hail are drawn in the faction's own colour
(Klingon red-orange, Cardassian amber, Romulan green, Borg green, Tholian orange). At
half hull the bar still turns alert pink.

> Apostrophes are curly (') in the source. The name is wrapped in `[ ]` by the CSS
> above the hull bar — that's styling, don't type the brackets.

## Inbound warning
`js/game.js:2949`

| ID | Element | Copy |
|---|---|---|
| `warbird.warn` | Flashing warning, before the hail | {name} approaching |
| `warbird.warn.ambush` | …for a Romulan, which never hails | {name} decloaking |

> It says **approaching** for a ship that will hail, because the player can still refuse
> it. A Romulan doesn't hail — the warning is the only notice — so it says **decloaking**,
> which is exactly what happens next.

## Hull bar

| ID | Element | Copy |
|---|---|---|
| `warbird.name` | Label over the hull bar | {name} |

---

# 04 · Red alert — the hail

The one decision in a run that isn't a refit. It opens between the inbound warning
and the ship actually arriving, and it stops the field the same way a refit card does.
Two cards, side by side.
`partials/game.html` · figures from `js/game.js:1984-1987`

| ID | Element | Copy |
|---|---|---|
| `hail.t` | Heading | Red alert |
| `hail.s` | Subhead | **{name}** · on intercept course |
| `hail.h` | Footer hint | Give the order, or press `1` `2` _(just `1` when Evade is locked)_ |

> The CSS puts a ⚠ before `hail.t` — don't type one. Since Sep 2026 the hail wears the
> refit panel's notched frame and delta in alert pink, and its key legend uses the same
> boxed amber key caps.
>
> **Breaking off isn't worthless any more.** A capital ship that survives its 42s
> and leaves now drops dilithium in proportion to the damage you did. It isn't on the
> card — a kill still pays the listed rewards — so it lands as a surprise the first time.

## Card 1 — fight

| ID | Element | Copy |
|---|---|---|
| `hail.fight.verb` | Big verb | Engage |
| `hail.fight.key` | Key cap _(fixed)_ | Press 1 |
| `hail.fight.name` | What it means | Stand and fight |
| `hail.fight.warn` | The threat, per faction | Klingon: Disruptor rings and ramming runs, with a Bird-of-Prey wing that dives in together. · Cardassian: Spiral barrages from behind a line of Galors that fire as one. · Borg: Cutting beams, a tractor lock, and drones that box you in. · Tholian: Web cages and splitting shards, and weavers with a live strand strung between them. |
| `hail.fight.d1` | Reward line 1 | +{1800} stardate |
| `hail.fight.d2` | Reward line 2 | Battle salvage · one upgrade |
| `hail.fight.d3` | Reward line 3 | +{2} hull · dilithium · a power-up _(+2 for the first kill of a run, +1 after — computed, so the card always matches the drop)_ |

## Card 2 — flee

| ID | Element | Copy |
|---|---|---|
| `hail.flee.verb` | Big verb | Evade |
| `hail.flee.key` | Key cap _(fixed)_ | Press 2 |
| `hail.flee.name` | What it means | Break away |
| `hail.flee.warn` | The cost, in a sentence | You get clear, but you can't break away twice running. |
| `hail.flee.warn.warp` | …locked, after an evade | Your warp drive is still recharging from the last break. Fight this one to recharge it. |
| `hail.flee.warn.cube` | …locked, a Borg cube | A cube can't be outrun. This one has to be fought. |
| `hail.flee.locked` | Cost lines when locked | Not available · Recharges after a fight _(or)_ No escape from a cube |
| `hail.flee.d1` | Cost line 1 | No bounty · no refit |
| `hail.flee.d2` | Cost line 2 | Next contact in {37}s |
| `hail.flee.d3` | Cost line 3 | Evasive burn · 2.6s |

> `hail.fight.d1` and `hail.flee.d2` are the real figures for *this* contact, not
> round numbers — they climb as the run goes on. `hail.flee.d3` is hard-typed in the
> markup and currently matches the code; if the evasive burn is ever retuned this
> line won't follow it.

---

# 05 · Field refit — the card

Opens the instant the dilithium rail fills, and freezes the field. Three cards, rolled
fresh every time. The player has learned that a panel means the run has stopped and a
decision is owed.
`js/game.js` — `openLevelUp` / `renderChoices`.

## The panel, Sep 2026

It was 900px wide and about 190px tall, which on a 1440px screen is a fifth of the
picture — a dialog floating in a lot of nothing, with three cards in it small enough
that the figures were 9.5px. It's now sized as a console: **96% of the screen's width**,
the cards are the panel, and the header is a band above them.

Four parts, top to bottom:

| Part | What it is |
|---|---|
| **Header band** | the Starfleet delta hard left, the title and subhead hard right |
| **Header bar** | one block per card, on the grid's own columns and gutters |
| **Cards** | one per offer, stretched to a common height |
| **Footer** | the key legend, on the grid's left edge |

The panel never scrolls. Three layouts, chosen by what the viewport actually has:

| Viewport | Layout |
|---|---|
| wider than 980px, taller than 420px | three full columns |
| 980px or narrower, 560px or taller | one column, compact card |
| under 560px tall (narrow) or under 420px tall (any width) | three short columns, compact card |

> **Why the short-height rule is not just a phone rule.** The full card bottoms out
> at about 359px — its own 185px floor plus the header, bar and footer — so a
> desktop window shorter than that scrolls the panel. The run is frozen and the body
> carries `touch-action:none`, which is the same trap the hull-breach card's own
> short-height steps exist for. The step fires at 420px, about 60px of headroom over
> the measured floor.

> **The header bar used to be decoration.** It was an LCARS rule drawn part-filled, so
> it read as a progress meter permanently stuck at seventy percent — a readout
> promising a number it never had. It's now a position indicator: the lit block is the
> card you're on, and it's the second place the selection is announced.

## Choosing

There is no confirm step — a click picks — so "selected" isn't a staging area, it's the
card the next Enter would take. Every panel ignores input for its first 0.4s while the
cards fade up, and held (repeating) keys never pick, so a thumb or a key meant for the
field can't take a card nobody has read.

| Input | Does |
|---|---|
| `1` `2` `3` | takes that card outright |
| `Tab` / `Shift+Tab` | moves the selection, cycling inside the panel — nothing tabs out of it |
| `Enter` | takes the selected card |
| arrows, `Space` | nothing: they're flight keys, and one is usually held when the card opens |
| hover | moves the selection (mouse and pen; a touch tap is already picking) |
| click | takes that card, anywhere on it |

> **The selected card says so four ways**, because it can't be carried by colour alone:
> the left rail goes amber, the field warms, the whole block lifts 3px, and the
> shortcut key fills in solid — plus the lit block in the header bar above it. A
> keyboard also gets a focus ring, which is the one signal that only ever means
> "your keyboard is here".

The header has two states — one for a refit the rail paid for, one for a card a
capital ship paid for. Beating a boss doesn't advance the refit number, so salvage
isn't numbered.

| ID | State | Copy |
|---|---|---|
| `refit.t` | Earned by dilithium | Field refit |
| `refit.s` | …its subhead | Refit **{n}** · choose one upgrade |
| `refit.t.salvage` | Dropped by a kill | Battle salvage |
| `refit.s.salvage` | …its subhead | Hull broken · choose one upgrade |
| `refit.h` | Footer hint | Choose an upgrade · `1` `2` `3` |

## Badges — top-right of each card

| ID | Shown when | Copy |
|---|---|---|
| `refit.badge.new` | You don't own this one yet | NEW |
| `refit.badge.up` | You already own it | LV {2} → {3} _(fixed)_ |
| `refit.badge.max` | This pick finishes the system | LV {5} → MAX |
| `refit.badge.instant` | One-shot card, doesn't stack | ONE USE |

> Only **Damage Control** is **ONE USE**; everything else stacks. The hull pick uses
> the same slot for **HULL**, which is neither: it's the one card in the game that
> isn't an upgrade.

---

# 05b · Shakedown — the hull pick

The same panel, once per run, before anything has moved. Three of the seventeen cards
aren't upgrades at all — they're whole weapons, and which one you're holding decides
how the first two minutes are flown. Drawing one at refit 2 was the biggest thing that
happened to a run, and it happened *to* you. Now you choose it, and the run opens with
the weapon already warm.

The other two aren't cut, they're held back: the first joins the deck at **3 cards
taken** and the second at **5**. Counted in cards actually taken, not XP level, so
salvage off a capital ship brings them closer. After that they're ordinary cards —
rolled at random, upgraded like everything else.

| ID | State | Copy |
|---|---|---|
| `hull.t` | Panel title | Shakedown |
| `hull.s` | …its subhead | Three hulls on the pad · they fly differently |
| `hull.h` | Footer hint | Choose a hull · `1` `2` `3` |
| `hull.badge` | Top-right of every card _(fixed)_ | HULL |

| ID | Role | Name | Plain benefit | Figures | Caveat | Tag |
|---|---|---|---|---|---|---|
| `hull.torp` | Escort | Defiant class | You start with torpedoes that chase their target. | {4} blast damage / Reloads every {3.4}s | They hunt ships. Rock is only ever in the way. | Quick, thin-skinned, built to close the distance. |
| `hull.spread` | Cruiser | Sovereign class | You start with a wide spread of beams. | {3} beams per shot / {3.5} shots/sec | Wider cover, slower cycle. She turns like the ship she is. | Heavy, patient, hard to put a hole in. |
| `hull.mine` | Scout | Nova class | You start with mines that wait in your wake. | {5} blast damage / Lays every {4.2}s / {80}% wider dilithium pull | They arm behind you and never touch your own hull. | Turns on a coin. Two plates and no second chances. |

## The three hulls actually fly differently

This used to be a weapon menu wearing three ship names — same thrust, same helm, same
hull, three opening guns. Then five numbers moved per hull, but only by about 15%
each, and the pick still read as one ship three times. Since Sep 2026 each hull owns
one axis outright and pays for it on another (`HULL_MODS` in `js/game.js`):

| | Defiant | Sovereign | Nova |
|---|---|---|---|
| Top speed | **~500px/s** | ~315px/s | ~420px/s |
| Turn rate | ~205°/s | ~155°/s | **~275°/s** |
| Coast after letting go | 0.5s | 0.72s | 0.43s |
| Phaser rate | ×1.22 | ×1.00 | ×0.87 |
| Beams per second at the start | 5.2 | **10.5** (three-beam cone) | 3.7 |
| Hull plates | 3 | **4** | 2 |
| Dilithium pull | ×1 | ×1 | ×1.8 |

On the card that reads as: Defiant **speed**, Sovereign **phasers and hull**, Nova
**turning**. Measured with the scripted pilot, the three survive within noise of
each other.

> **The Nova opens on two plates, not three.** It is the one thing on this panel that
> makes a run harder before anything has spawned, and it is why the card says so twice
> — once as four lit pips against nine, and once in words at the foot.

## What each card shows

| Tier | What it is |
|---|---|
| **Role / name** | Escort, Cruiser, Scout — then the class |
| **Schematic** | the hull in plan view, drawn to relative scale against the other two |
| **Opens with** | the weapon glyph and the plain benefit, then the caveat |
| **Three bars** | Speed, Turning, Phasers — ten pips each. They **rank** the three hulls: the best on a row gets ten, the worst three. Measured from zero, every row on every card looked nearly full |
| **Hull** | the plate count, as lit plates |
| **Figures** | the weapon's own numbers, in cyan mono |
| **Tag** | what the ship is, in the voice a crew would use about it |

> **The card leads on the ship now, not the gun.** The old rule was the opposite — a
> weapon glyph, because three hulls drawn as three saucers said nothing at a glance.
> That held while the three flew identically. It does not hold now the Sovereign turns
> 18% slower than standard, so the ship is what the card shows and the weapon glyph
> moved down to the line it belongs on.
>
> **One colour per ship, not per category.** Everywhere else amber means a weapon, cyan
> a hull plate and violet the ship. Here it means which ship — amber, cyan, violet in
> roster order. Safe only because a hull draft has no upgrade cards in it, and the two
> schemes are never on screen together.
>
> **The order the locked two arrive in is fixed**, so a run can be read back: they open
> in roster order — torpedo, cone, mine — skipping whichever you started with.

`js/game.js` — the `SHIPS` roster, `HULL_MODS`, `HULL_ART`, `hullStats()` and `sigUnlock()`.

---

# 06 · The seventeen upgrades

Three of these are on screen at a time over a frozen field. The card is read top to
bottom, and the sizes match that order:

| Tier | What it is | How it looks |
|---|---|---|
| **Name** | the Star Trek system | **the headline** — caps, full ink, heaviest weight |
| **Plain benefit** | what it does, in ordinary words | two thirds the name, lighter, sentence case |
| **Figures** | how much it does | cyan mono, hard against the foot of the card |
| **Caveat** | only where there's more to say | small and muted, first offer only |
| **Category** | Weapons, Defence or Ship | the smallest thing on the card, in its colour |
| **Cost** | only where a card takes something | ink rather than cyan, under a ↓ tick |

> **The ladder descends once and never turns back.** Every tier below the name is
> both smaller and dimmer than the one above it. At 1440px wide: name 20.4px at full
> ink, benefit 13.7px at 80%, figures 13px cyan, caveat 10.4px at 55%, category
> 10.1px. Same ratios on a phone, one step down throughout — 16 / 12.5 / 12 / 10.5.
>
> It was the other way round for a while: a 13px tracked name above a 20px sentence
> above a 13px mono figure. That isn't a hierarchy, it's a bulge — the card had no
> obvious top and the two outer tiers read as belonging to different cards.
>
> **Why the figures sit at the foot.** They're pinned to the bottom of every card, so
> all three rules land on one line across the row and the three drafts can be read as
> a table. The caveat moved above them to get that — and a four-word caveat belongs
> beside the sentence it qualifies anyway, not stranded under numbers it says nothing
> about.
>
> **Why only 9 cards have a caveat.** When all of them had one, most just said the
> benefit again in longer words. It's set only where it answers *"wait, how does that
> work?"*: a caveat, or a mechanic you'd otherwise have to discover by dying.
> **Ablative Armour** lost its one in Sep 2026 — "It grows back on its own" was the
> third tier of a card whose second tier already reads *Regrows every 37s*.

## The five words the whole deck is written in

A player reading three cards in a frozen second can't also be learning a vocabulary,
so every card uses the same five nouns for the same five things, and never a synonym.

| Word | Means | Never |
|---|---|---|
| **shot** | one pull of the trigger. Rate is quoted in shots/sec. | round, burst |
| **beam** | one phaser round in flight. Damage, speed, range and how many targets it passes through are all properties of a beam. | bullet, laser, bolt |
| **torpedo** | the homing warhead | missile, rocket |
| **mine** | the thing you leave behind you. It is *laid*, never fired. | bomb, charge |
| **hull** | the plates you lose on a hit | life, health, HP |

That's why the Cone quotes *beams per shot* and the Array quotes *shots/sec*: the two
figures look alike, mean different things, and the nouns are what tells them apart.

Every benefit is **one short sentence, second person, ending in a full stop**. It's the
line the card is picked on, so it says what *you* get rather than what the system is
called.

`js/game.js` — the `UPGRADES` roster.

## Weapons

| ID | Name | Plain benefit | Figures | Caveat |
|---|---|---|---|---|
| `card.fire` | Phaser Array | Your phasers fire faster. | {n} → {n} shots/sec | — |
| `card.ram` | Ramming Speed | Fly into asteroids to break them. | {4} impact damage / Needs {86}% of top speed · then: {n} → {n} impact damage / Needs {n}% → {n}% of top speed | Not capital ships. |
| `card.spread` | Phaser Array Cone | Fire a wider spread of beams. | {1} → {3} beams per shot · **cost:** {n} → {n} shots/sec | Wider cover, slower cycle. |
| `card.torp` | Photon Torpedo Bay | Adds torpedoes that chase their target. | {4} blast damage / Reloads every {3.4}s · then: {4} → {5} blast damage / Reloads every {3.4}s → {2.8}s | They fire and reload on their own. |
| `card.mine` | Tricobalt Mine Layer | Leave mines behind you that wait for a target. | {5} blast damage / Lays every {4.2}s · then: {5} → {6} blast damage / Lays every {4.2}s → {3.4}s / {6} → {8} mines in the rack | They arm on their own and never touch your hull. |
| `card.wake` | Warp Plasma Vent | Leave a burning trail behind you. | {1} burn damage / Trail lasts {2.4}s · then: {1} → {2} burn damage / Trail lasts {2.4}s → {3.2}s | Anything that flies through it takes damage. |
| `card.pierce` | Polarised Emitters | Your beams pass through targets. | Each beam hits {1} → {2} targets | One shot can clear a line of rock. |
| `card.dmg` | Warp Core Output | Your weapons deal more damage. | Beam damage {1} → {2} / Torpedoes hit harder | — |
| `card.arc` | Hull Arc Coils | Burn anything that gets too close. | {2.6} damage/sec / At arm's length · then: {2.6} → {5.2} damage/sec / +{n}% reach | No aiming. It covers the hull. |
| `card.range` | Long-Range Emitters | Hit enemies from further away. | +12% beam speed / +15% beam range | — |
| `card.seek` | Targeting Sensors | Your torpedoes track their target better. | +45% turn rate / +30% lock range | — |

> `card.seek` is only offered once you own a torpedo bay.
>
> `card.torp`, `card.spread` and `card.mine` are the three signature weapons. One of
> them is the hull you picked and is on offer from the first refit; the other two are
> held until 3 and 5 cards taken. See [§ 05b](#05b--shakedown--the-hull-pick).
>
> `card.ram` has to carry the capital-ship exemption. Without it the only way to learn
> the rule is to ram a dreadnought at full impulse and lose a hull plate finding out.
>
> `card.spread` is **the only card in the deck with a `cost` line**, and it needs one.
> Every other figure on every other card is a gain, so a rate that *drops* set in the
> same cyan as the line above it reads as a third improvement at a glance — and the
> caveat that used to carry the warning is only printed the first time the card is
> offered, which is the one time you're least likely to be taking it. The cost line
> drops the cyan and takes a ↓ tick, so the direction is carried by a shape as well
> as by the number.

## Defence

| ID | Name | Plain benefit | Figures | Caveat |
|---|---|---|---|---|
| `card.guard` | Deflector Overcharge | Your shields raise themselves. | 5s untouchable / Every {33}s · then: Every {33}s → {26}s | Runs on a timer. Nothing to press. |
| `card.deflector` | Navigational Deflector | Push asteroids away from your bow. | Always on · then: +{30}% wider field | — |
| `card.armour` | Ablative Armour | Survive one extra hit. | Absorbs one hit / Regrows every {37}s · then: Regrows every {37}s → {30}s | — |
| `card.life` | Damage Control | Repair a hull plate right now. | Hull {3} → {4} plates | — |

> `card.deflector`'s level-0 figure slot reads **Always on**. There's no percentage to
> quote before you own it (the range is zero, so the maths divides by zero), and
> "always on" is the fact that separates it from the other two defensive cards, which
> are both on timers. No number or mechanic changed.
>
> `card.life` is only offered when you're below full hull.

## Ship

| ID | Name | Plain benefit | Figures | Caveat |
|---|---|---|---|---|
| `card.thrust` | Impulse Drive | Your ship moves faster and turns quicker. | +{21}% thrust / +{15}% turn rate | — |
| `card.magnet` | Tractor Beam | Pull dilithium in from further out. | +{47}% pull range | — |

> `card.range`, `card.seek` and `hail.flee.d3` are the only figures
> written by hand rather than computed. They're right today. They're the ones that can
> silently go wrong later.

## The three category labels

| Card group | Label on the card | Colour |
|---|---|---|
| `cat:'gun'` | Weapons | amber |
| `cat:'hull'` | Defence | cyan |
| `cat:'ship'` | Ship | violet |

> The category colour is worn by a 11px word and a 30px glyph inside the card. The
> **selected** card is amber too — but that amber is the card's own edge, its 3px lift
> and its filled key cap, which is a different register entirely, and the selection is
> also announced by the lit block in the header bar. Nothing here is carried by colour
> alone.

---

# 07 · All stop

Shown when the tab loses focus or the page is hidden. Not a menu — there's nothing to
decide, it's just an acknowledgement that the game noticed you left.
`partials/game.html`

| ID | Element | Copy |
|---|---|---|
| `pause.t` | Heading | All stop |
| `pause.h` | Hint | Click or press any key to resume |

> Since Sep 2026 the pause card is built like the refit panel: the delta on the left,
> `pause.t` set large in cyan caps hard right, `pause.h` under it. No `:: ::` any more.

---

# 08 · Hull breach

The end of a run. The stat line is assembled from whatever actually happened, so it's
different every death — clauses drop out when their count is zero.
`js/game.js:1605-1612`

| ID | Element | Copy |
|---|---|---|
| `over.t` | Heading | Hull breach |
| `over.s` | Score | Stardate {n} |
| `over.h` | Restart hint, **desktop** | press any key to play again |
| `over.h.touch` | Restart hint, **touch** | tap to play again |

> The delta mark replaced the `:: ::` brackets — don't type them.
>
> **Standardised:** both static markup and JS should use *press any key to **play** again*.

## The stat line

Built left to right. The first two always appear; the rest only when they're non-zero.

| ID | Clause | Copy | Appears when |
|---|---|---|---|
| `over.sub.time` | Time survived | {73}s adrift | Always |
| `over.sub.refit` | Refit reached | · refit {4} | Always |
| `over.sub.kills` | Capital ships | · {2} capital ships destroyed | You killed at least one _(singular: "capital ship")_ |
| `over.sub.fled` | Ships evaded | · {1} evaded | You ran from at least one |
| `over.sub.chain` | Best kill chain | · best chain {7} | Best chain was 5 or more |
| `over.sub.overcharge` | Overcharges used | · {3} overcharges | You used at least one _(singular: "overcharge")_ |

Worst case, all six at once:

> 73s adrift · refit 4 · 2 capital ships destroyed · 1 evaded · best chain 7 · 3 overcharges

That's the line to write against — it has to still scan when everything fires.

---

## Things I noticed while pulling this

1. **`COPY-site.md` § 08 is stale.** Ten cards listed, seventeen in the game; several
   descriptions no longer match. Keep this deck as the source for the game copy and
   fold the updated wording back into the site copy when that file is next edited.
2. **Restart hint is standardised** — `press any key to play again` in both the
   static markup and the JS, so the two sources cannot drift apart.
3. **Hard-typed figures.** `card.range`, `card.seek` and
   `hail.flee.d3` are the only numbers written by hand rather than computed. They're
   right today. They're the ones that can silently go wrong later.
4. **The hull-plate icons still have no text.** Five pixel squares, no label, no
   `aria-label`. That's a UX/accessibility decision rather than copy, so it remains
   flagged rather than silently invented here.
