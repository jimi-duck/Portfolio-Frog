(function(){
  var avail   = document.querySelector('.avail');
  var canvas  = document.getElementById('astroCanvas');
  var ctx     = canvas.getContext('2d');
  var exitBtn = document.getElementById('astroExit');
  var tipEl   = document.getElementById('astroTip');
  var scoreEl = document.getElementById('astroScore');
  var livesEl = document.getElementById('astroLives');
  var shieldEl= document.getElementById('astroShieldBuff');
  var rapidEl = document.getElementById('astroRapidBuff');
  var xpBarEl = document.getElementById('astroXp');
  var xpFillEl= document.getElementById('astroXpFill');
  var xpNumEl = document.getElementById('astroXpVal');
  var lvlNumEl= document.getElementById('astroLevelNum');
  var tipTimer = null;

  var NOSE_OFFSET = 17;

  // Base handling. All timings are in SECONDS and all motion is scaled by a
  // per-frame step factor, so the run plays the same on a 60Hz and a 120Hz
  // screen — and a stalled frame can never teleport the field.
  // SHOT_COOLDOWN was 0.22 before Aug 2026 and briefly 0.255, which is a 16% cut
// to the base rate — not "slight", and it compounds because every cannon level
// and the rapid drop all multiply this one number. 0.235 is ~7% off the
// original: a real reduction that does not quietly rescale the whole run.
var ROT_SPEED = 0.06, THRUST = 0.155, BULLET_SPEED = 11, SHOT_COOLDOWN = 0.235, BOUNCE = 0.4;
  // A hard floor on the automatic gun, applied after every multiplier rather
  // than before one. Rapid fire used to be a x0.4 on top of an already-clamped
  // cooldown, which is how a maxed ship reached 180 bullets a second and simply
  // deleted the field. Nothing may now fire faster than this.
  var MIN_COOLDOWN = 0.075;
  // Extra barrels are no longer free. Each level of Spread Shot multiplies the
  // cooldown, so the fan trades rate for coverage instead of adding both.
  var SPREAD_DRAG = 1.22, RAPID_MULT = 0.55;
  // ── Photon torpedoes ─────────────────────────────────────────────────────
  // The second weapon, and deliberately the opposite of the phaser in every
  // respect: slow to travel, slow to reload, and it does its damage in a
  // radius rather than at a point. Phasers are the answer to one target on the
  // nose; torpedoes are the answer to a wall of rock, which is the situation
  // the phaser handles worst. The bay stays cold until the upgrade is taken.
  var TORP_SPEED = 5.4, TORP_LIFE = 2.6, TORP_R = 5;
  var TORP_COOLDOWN = 3.4, TORP_BLAST = 78, TORP_DMG = 4;
  // Torpedoes seek *ships*. A rock is never a target, only an obstacle, and a
  // torpedo that has a lock flies straight through the field to reach it —
  // which is the whole point: a three-and-a-half second reload spent cracking
  // a rock that the phaser was going to clear anyway is a wasted torpedo, and
  // the bay's real job is the warbird sitting behind the rock.
  //
  // With nothing to lock onto it behaves exactly as it always did: straight
  // line, detonates on the first thing it touches. So it is still the answer
  // to a wall of rock when there is no better answer to be had.
  //
  // TORP_TURN is in radians per second. What it really sets is the turn
  // *circle*: at 324px/s, 2.2 rad/s is a 147px radius, which measured as a
  // torpedo that curves onto a stationary warbird and then sails past it 4px
  // wide. 4.2 gives a 77px circle — it comes round onto a target that holds
  // still, and still loses one that keeps turning, which is the trade the
  // weapon is supposed to have.
  //
  // TORP_FUSE is a proximity fuse in pixels on top of the contact radius. A
  // guided warhead that has to physically touch a 15px saucer is a warhead
  // that misses for reasons the player cannot see.
  // TORP_LEAD is a cap, in frames, on how far ahead of a target a torpedo is
  // allowed to aim. Pure pursuit — steering at where the target *is* — tracks
  // a stationary hull perfectly and tail-chases a moving one forever: measured
  // against a bobbing scout it closed to 35px and then trailed it. Leading by
  // the flight time turns the chase into an intercept. The cap matters because
  // at 400px the raw flight time is 80 frames, and leading a bobbing target by
  // eighty frames aims at somewhere it is never going to be.
  var TORP_SEEK_R = 520, TORP_TURN = 4.2, TORP_FUSE = 13, TORP_LEAD = 30;
  // ── Navigational deflector ───────────────────────────────────────────────
  // Rock is ~70% of all damage taken, and every other defensive card answers
  // it indirectly — this one answers it by name. It is a shove, not a wall:
  // late-run rocks are fast enough to punch through the field, so it lowers
  // the rate you get hit rather than making you immune to the thing.
  var DEFLECT_R = 74, DEFLECT_PUSH = 4.0;
  // ── warp plasma vent ─────────────────────────────────────────────────────
  // Venting drive plasma into the wake behind a pursuer is a real trick out of
  // the shows, and it is the only card in the deck that turns running away
  // into an attack — which is the one thing this ship could not do. It only
  // lays while the impulse engines are actually lit, so the trail is drawn by
  // flying, not by existing: a tight turn under power writes a wall, and
  // coasting writes nothing.
  //
  // Plasma burns *ships*. Rock is inert and sails straight through it, which
  // keeps the card off the 70% of the damage that the deflector answers and
  // stops it quietly becoming a second field-clearer.
  var WAKE_LIFE = 2.4, WAKE_R = 11, WAKE_GAP = 0.055, WAKE_TICK = 0.35;
  var wake = [];
  // ── hull arc ─────────────────────────────────────────────────────────────
  // Every other weapon on this ship rewards standing off. The arc is the one
  // that pays for the opposite, and the price is set by the radius: at 43px a
  // 21px rock is inside the field about thirteen pixels before it is inside
  // the hull, so using this card at all means flying close enough that a
  // mistake is a hull plate. It burns rock as readily as Klingons — the risk
  // is the same either way and the fantasy does not survive an arc that
  // politely ignores the thing about to kill you.
  var ARC_STANDOFF = 34, ARC_DPS = 2.6;
  // ── ramming speed ────────────────────────────────────────────────────────
  // The one card that changes what a collision *is*. Two things keep it from
  // being flat immunity to the field, which is the single most dangerous thing
  // you can hand a player in this game:
  //
  //  · it only arms at nearly full impulse, with the engines lit, against
  //    something you are actually driving at — a rock that clips your flank at
  //    a standstill still takes a hull plate;
  //  · every ram costs you most of your momentum, which disarms it. You cannot
  //    bulldoze a line through the field, because the first rock stops you
  //    dead in the middle of it and you have to build speed again.
  //
  // Capital ships are exempt. A dreadnought is not something you shunt.
  var RAM_BLEED = 0.45, RAM_ARC = 0.95;
  function ramThreshold(){ return 0.86 - 0.06 * (up.ram - 1); }
  function ramDamage(){ return 1 + 3 * up.ram + up.dmg; }
  // terminal speed falls out of thrust against a 0.98-per-frame drag
  function terminalSpeed(){ return thrustPower() / 0.02; }
  function ramArmed(tx, ty){
    if(up.ram <= 0 || !ship.thrusting) return false;
    var sp = Math.hypot(ship.vx, ship.vy);
    if(sp < terminalSpeed() * ramThreshold()) return false;
    // it has to be in front of where you are going, not where you are pointing:
    // a ram is a thing your momentum does
    return Math.abs(angDiff(Math.atan2(ty - ship.y, tx - ship.x),
                            Math.atan2(ship.vy, ship.vx))) < RAM_ARC;
  }
  // 0 to 1, for the renderer: a bow shield that fades in as the speed builds
  // tells the player where the threshold is. A shield that simply appears at
  // 86% tells them nothing until they have already guessed wrong once.
  function ramCharge(){
    if(up.ram <= 0 || !ship.thrusting) return 0;
    var need = terminalSpeed() * ramThreshold();
    return Math.max(0, Math.min(1, Math.hypot(ship.vx, ship.vy) / need));
  }
  function ramBleed(){
    ship.vx *= RAM_BLEED; ship.vy *= RAM_BLEED;
    burst(ship.x, ship.y, 12, '111,232,255');
  }
  var SHIP_RADIUS = 9, INVULN = 1.1, RESPAWN_INVULN = 2.2;
  var START_LIVES = 3, MAX_LIVES = 5;
  var START_ROCKS = 20, MAX_ROCKS = 54;
  var BULLET_LIFE = 1.35, MAX_STEP = 3;
  // how far past each edge of the view the rock field extends, in screens. The
  // population lives in a band of (1 + 2 x BAND_PAD) screens, so roughly 40% of
  // it is in front of the player at any moment.
  var BAND_PAD = 0.75;

  var active = false, raf = null, keys = {}, docH = 0;
  // analog touch input: the stick steers and throttles, and that is the whole
  // touch vocabulary now — the guns look after themselves
  var pad = { angle: 0, mag: 0 };
  var isCoarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  // Reduced motion is honoured on the canvas, not only in the stylesheet. Four
  // things in here strobe, and two of them sit in the band that actually
  // matters: the respawn blink runs at ~6.5Hz and the boss charge telegraph at
  // ~2.9Hz. A CSS media query cannot reach any of them, so the flag is read
  // here and each effect resolves to a steady state instead of being switched
  // off — the information they carry (invulnerable, winding up, low hull) still
  // has to reach the player.
  var motionQ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = !!(motionQ && motionQ.matches);
  if(motionQ && motionQ.addEventListener){
    motionQ.addEventListener('change', function(e){ reduceMotion = e.matches; });
  }
  var ship, bullets, particles, destroyed, asteroids, pickups;
  // torpedoes fly in their own list because they are the only projectile that
  // survives its first contact long enough to detonate, and shockwaves are
  // pure decoration with a damage pass already applied when they were born
  var torpedoes = [], shockwaves = [];

  // ── the run clock ────────────────────────────────────────────────────────
  // gameTime only advances on frames we actually simulate, so switching tabs,
  // sleeping the laptop or opening an upgrade card costs nothing and gains
  // nothing. Everything — score, difficulty, cooldowns, drop timers — reads it.
  var gameTime = 0, lastFrame = 0, autoPaused = false, levelOpen = false;
  function isPaused(){ return autoPaused || levelOpen || hailOpen; }

  // ── Red Alert ────────────────────────────────────────────────────────────
  // Below a third of the hull the ship goes to red alert: the screen edges
  // pulse and the sector gets busier. It is a real risk multiplier, not just a
  // light — but it only ever fires when the run is already going badly, and it
  // clears the moment a repair lands, so it reads as a comeback state rather
  // than a death spiral. RED_ALERT_AT is a fraction of MAX_LIVES so it tracks
  // the hull the player actually has rather than a hard-coded life count.
  // The pressure is deliberately mild. Red alert only ever fires from a losing
  // position, so anything heavier stops being an adrenaline spike and becomes a
  // trapdoor — the run is already at one hull and cannot answer more traffic.
  // Measured hull loss inside the alert runs ~2.8x the rate outside it even
  // with these multipliers set to nothing, so the drama can come from the
  // presentation and the spawn table can stay close to neutral.
  var RED_ALERT_AT = 0.3, RED_ALERT_SPAWN = 0.85, RED_ALERT_ROCKS = 2;
  var redAlert = false;
  function redAlertActive(){ return lives > 0 && lives <= Math.floor(MAX_LIVES * RED_ALERT_AT + 0.001); }

  // ── continuous progression ───────────────────────────────────────────────
  // The field's pressure is a smooth function of gameTime, so it rises every
  // second rather than in visible steps. The player's own power curve is the
  // opposite: it moves in discrete jumps, one per level. The run is the race
  // between the two.
  function speedMultAt(t){ return Math.min(5.4, 1.30 + t * 0.015); }
  function rockTargetAt(t){ return Math.min(MAX_ROCKS, START_ROCKS + Math.floor(t / 9)); }
  function alienInterval(t){ return Math.max(3.4, 17 - t * 0.055); }
  function alienCooldown(t){ return Math.max(0.62, 1.7 - t * 0.009); }
  function alienSpread(t){   return Math.max(0.07, 0.26 - t * 0.0014); }
  function alienBulletSpeed(t){ return Math.min(5.6, 3.1 + t * 0.012); }
  // The warbird count is the one curve with no ceiling. Everything else flattens
  // out inside five minutes, and a run whose pressure stops climbing is a run
  // you can settle into and hold forever — which is what this one was doing.
  function alienMax(t){ return Math.min(6, 1 + Math.floor(t / 60)); }
  function alienHpScale(t){ return 1 + Math.min(1.7, t / 125); }
  // Rocks harden slowly, so Heavy Rounds still earns its slot at minute four
  // instead of one-shotting the entire field from level three onwards.
  function rockHp(r, t){
    return r >= 22 ? Math.min(5, 2 + Math.floor(t / 95)) : (t > 150 ? 2 : 1);
  }

  // ── the warbird roster ───────────────────────────────────────────────
  // Three hulls, unlocked on the clock, so the sky stops being one encounter
  // repeated for the whole run. Scouts strafe past and take pot shots; lancers
  // are slow gun platforms that fire in fans; stalkers steer at the ship and
  // lead their shots, which is the first thing in the run that cannot be
  // handled by flying in a straight line away from it.
  var ALIEN_TYPES = {
    scout:   { r:15, hp:2, speed:1.55, bonus:150, heart:0.28, gems:1, bob:26,
               rgb:'127,227,236', stroke:'#7fe3ec', at:0,  weight:3, cd:1.00, shots:1 },
    lancer:  { r:19, hp:5, speed:0.95, bonus:280, heart:0.36, gems:2, bob:15,
               rgb:'167,139,250', stroke:'#a78bfa', at:85, weight:2, cd:1.55, shots:3 },
    stalker: { r:16, hp:4, speed:1.15, bonus:340, heart:0.40, gems:2, bob:0,
               rgb:'255,122,99',  stroke:'#ff7a63', at:120, weight:2, cd:1.30, shots:1 }
  };
  var ALIEN_FIRST = 7;
  var aliens = [], alienBullets = [], nextAlienAt = ALIEN_FIRST, bonus = 0;

  // ── bosses ───────────────────────────────────────────────────────
  // The one fight in the run that does not drift past. It holds station on the
  // ship, cycles three attacks, calls in escorts, and turns nastier at half
  // hull. It is also where a late run finds the XP for its next upgrade, so
  // the answer to a capital ship is never simply to run away from it.
  var BOSS_FIRST = 110, BOSS_GAP = 68, BOSS_WARN = 2.6, BOSS_R = 44;
  var BOSS_NAMES = ['I.K.S. Vor\u2019cha', 'I.K.S. Negh\u2019Var', 'I.K.S. K\u2019tinga', 'I.K.S. Qu\u2019Vat'];
  var boss = null, bossWarn = 0, bossCount = 0, bossKills = 0, nextBossAt = BOSS_FIRST;
  // ── the engagement hail ──────────────────────────────────────────────
  // A capital ship no longer simply arrives. It is announced, and then the run
  // halts on a two-way choice: hold the sector, or break off. That turns the
  // one scripted event in the run into the only real decision in it — every
  // other panel asks which upgrade, this one asks whether to take the fight at
  // all — and it gives the answer at one hull a name other than "die here".
  //
  // The two sides have to stay genuinely uneven in opposite directions or the
  // choice collapses into a default. Standing pays the biggest bounty on the
  // board, a guaranteed refit and two hull; running costs nothing in damage and
  // everything in tempo — no loot, no XP, and the next contact comes at a
  // little over half the usual gap. What a withdrawal really spends is the
  // level economy: under the current XP curve a late run cannot reach its next
  // refit off rocks alone, so a run that flees every hail slowly stops growing
  // while the field keeps escalating.
  var BOSS_FLEE_GAP = 0.55;      // fraction of a normal gap before the next hail
  var BOSS_FLEE_GRACE = 2.6;     // the evasive burn, in seconds of invulnerability
  var BOSS_KILL_HEARTS = 2;
  function bossBounty(n){ return 1800 + n * 700; }
  var hailOpen = false, bossFled = 0;
  var speedMult = 1.35, rockSpawnAcc = 0;
  var gameOver = false;
  var overEl = document.getElementById('astroOver');
  var bossBarEl  = document.getElementById('astroBoss');
  var bossFillEl = document.getElementById('astroBossFill');
  var bossNameEl = document.getElementById('astroBossName');
  var warnEl     = document.getElementById('astroWarn');
  var hailEl       = document.getElementById('astroHail');
  var hailNameEl   = document.getElementById('astroHailName');
  var hailBountyEl = document.getElementById('astroHailBounty');
  var hailAgainEl  = document.getElementById('astroHailAgain');
  var hailFightEl  = document.getElementById('astroHailFight');
  var hailFleeEl   = document.getElementById('astroHailFlee');
  var finalEl = document.getElementById('astroFinal');
  var finalSubEl = document.getElementById('astroFinalSub');
  var hintEl = document.getElementById('astroRestartHint');

  // ── drops ────────────────────────────────────────────────────────────────
  // XP that evaporates before it can be reached punishes the player for the
  // fight that produced it, so crystals outlive the old coins and the collection
  // radius is generous by default — hoovering loot up is the loop, not a skill
  // check. the Tractor Beam then widens what is already a comfortable baseline.
  var COIN_TTL = 10, HEART_TTL = 9, POWER_TTL = 10;
  var MAGNET_R = 165, PICKUP_R = SHIP_RADIUS + 13;
  var lives = START_LIVES;

  // ── XP and levels ────────────────────────────────────────────────────────
  // Dilithium is the only currency now and they buy exactly one thing: the next
  // upgrade card. The curve is deliberately shallow at the front so the first
  // level lands inside ten seconds and teaches the loop before it can bite.
  var xp = 0, level = 1, pendingLevels = 0;
  // Still deliberately shallow at the front — the first level lands inside ten
  // seconds and teaches the loop before it can bite — but the square term means
  // the late upgrades are earned rather than collected. Under the old linear
  // curve level 10 cost 216 XP; it now costs 385, and a maxed gun 641.
  function xpNeed(l){ return 4 + (l - 1) * 5 + Math.floor(Math.pow(l - 1, 2) * 0.6); }

  // ── timed power-ups ──────────────────────────────────────────────────────
  // These never pause anything: they land on the ship the instant it touches
  // them and run down on the clock in the HUD.
  var POWER_TIME = 10;
  var shieldTime = 0, rapidTime = 0;

  // ── permanent upgrades ───────────────────────────────────────────────────
  var up = { fire:0, thrust:0, spread:0, pierce:0, dmg:0, magnet:0, range:0, guard:0,
             torp:0, seek:0, deflector:0, armour:0, wake:0, arc:0, ram:0 };
  var nextGuard = 0, nextTorp = 0;
  // Ablative armour is a single charge that regrows on a clock, not a pool —
  // one plate, taken off you by the next hit and back a while later. It is
  // stored as a boolean plus the time it returns so nothing has to be
  // decremented every frame.
  var armourReady = false, armourAt = 0;
  var nextWake = 0;

  // Cooldown is assembled in one place, in one order — cannon levels, then the
  // weight of the extra barrels, then the rapid-fire drop, then the clamp — so
  // no combination of the three can outrun MIN_COOLDOWN. cooldownWith() takes
  // its levels as arguments because the upgrade cards quote the figure the
  // player would get *after* picking, and a card must never promise a rate the
  // ship cannot actually reach.
  function rawCooldown(l){ return SHOT_COOLDOWN * Math.pow(0.88, l); }
  function cooldownWith(fireL, spreadL, rapid){
    var c = rawCooldown(fireL) * Math.pow(SPREAD_DRAG, spreadL);
    if(rapid) c *= RAPID_MULT;
    return Math.max(MIN_COOLDOWN, c);
  }
  function shotCooldown(){ return cooldownWith(up.fire, up.spread, rapidTime > 0); }
  function barrels(l){ return 1 + l * 2; }
  // A wider fan with every level: the extra barrels buy the screen in front of
  // you, not a tighter beam, so spread stays a crowd answer and a poor one
  // against a single large target.
  function fanStep(l){ return 0.12 + 0.022 * l; }
  function bulletDamage(){ return 1 + up.dmg; }
  function bulletSpeed(){ return BULLET_SPEED * (1 + 0.12 * up.range); }
  function bulletLife(){  return BULLET_LIFE  * (1 + 0.15 * up.range); }
  function thrustPower(){ return THRUST * (1 + 0.14 * up.thrust); }
  function rotPower(){ return ROT_SPEED * (1 + 0.10 * up.thrust); }
  function magnetRange(){ return MAGNET_R * (1 + 0.35 * up.magnet); }
  // The torpedo bay reloads faster and hits harder with every level, but the
  // travel time never changes — the weapon is supposed to be something you
  // fire into where the field is *going* to be, not where it is.
  function torpCooldown(){ return TORP_COOLDOWN * Math.pow(0.82, Math.max(0, up.torp - 1)); }
  function torpDamage(){ return TORP_DMG + (up.torp - 1) + up.dmg; }
  function torpBlast(){ return TORP_BLAST * (1 + 0.12 * (up.torp - 1)); }
  // Targeting sensors sharpen the lock rather than the warhead: further to see
  // a target, faster to come round onto one. They cannot make a torpedo hit
  // harder — that is the warhead's card, and this one has to stay the pick you
  // take because your torpedoes keep missing.
  function torpSeekRange(){ return TORP_SEEK_R * (1 + 0.30 * up.seek); }
  function torpTurnRate(){  return TORP_TURN   * (1 + 0.45 * up.seek); }
  function deflectRange(){ return up.deflector ? DEFLECT_R * (1 + 0.30 * (up.deflector - 1)) : 0; }
  function armourEvery(l){ return 44 - l * 7; }      // 37s → 30s → 23s
  // levels buy how long the trail hangs and how hard it burns, not how wide it
  // is — a wider trail would start catching things you never flew near
  function wakeLife(){ return WAKE_LIFE * (1 + 0.35 * (up.wake - 1)); }
  function wakeDamageAt(l){ return l + Math.floor(up.dmg / 2); }
  function wakeDamage(){ return wakeDamageAt(up.wake); }
  function arcRangeAt(l){ return l ? SHIP_RADIUS + ARC_STANDOFF + 8 * (l - 1) : 0; }
  function arcRange(){ return arcRangeAt(up.arc); }
  function arcDps(){ return ARC_DPS * up.arc + up.dmg * 0.8; }
  function guardEvery(l){ return 40 - l * 7; }        // 33s → 26s → 19s
  var GUARD_TIME = 5;

  function computeDocHeight(){
    docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  }

  function resize(){
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeDocHeight();
  }

  function resetShip(inv){
    ship = { x: window.innerWidth/2, y: window.scrollY + window.innerHeight/2, vx: 0, vy: 0,
             angle: -Math.PI/2, thrusting: false, invuln: inv || INVULN, lastShot: -99 };
  }

  function burst(x, y, n, col){
    for(var i=0;i<n;i++){
      var a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*3;
      particles.push({ x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1, col: col || null });
    }
  }

  // ── rare rocks ───────────────────────────────────────────────────────────
  // A handful of the field is worth chasing rather than avoiding: bigger, more
  // armoured, lit in their drop's own colour, and carrying a timed power-up
  // instead of gems. Capped at two on the field so they stay an event.
  var SPECIALS = {
    shield: { stroke:'#00c2ff', glow:'#00c2ff', rgb:'0,194,255' },
    rapid:  { stroke:'#ffb347', glow:'#ffa726', rgb:'255,179,71' }
  };
  var SPECIAL_CHANCE = 0.055, MAX_SPECIAL = 2;
  var uid = 0;

  function specialCount(){
    var n = 0;
    for(var i=0;i<asteroids.length;i++) if(asteroids[i].special) n++;
    return n;
  }
  function rollSpecial(){
    if(specialCount() >= MAX_SPECIAL) return null;
    if(Math.random() >= SPECIAL_CHANCE) return null;
    return Math.random() < 0.5 ? 'shield' : 'rapid';
  }

  function makeAsteroid(mode, special){
    var r = special ? 22 + Math.random()*7 : 14 + Math.random()*14;
    var n = 8 + Math.floor(Math.random()*3);
    var pts = [];
    for(var i=0;i<n;i++){
      var a = (i/n)*Math.PI*2;
      var rad = r * (0.7 + Math.random()*0.5);
      pts.push([Math.cos(a)*rad, Math.sin(a)*rad]);
    }
    // sf is the rock's own share of the current speed band; velocity is derived
    // from it every frame, so the whole field speeds up as the run wears on
    // without anyone ever getting a sudden shove. Rare rocks drift slower —
    // they are a prize, and a prize you cannot catch is just a tease.
    var sf = (0.4 + Math.random()*0.8) * (special ? 0.62 : 1);
    var top = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;
    var x, y, ang, entering = false;

    if(mode === 'edge'){
      // drift in from just outside a screen edge, heading across the view —
      // nothing ever blinks into existence in front of the player
      var m = r + 8, side = Math.floor(Math.random()*4);
      if(side === 0){      x = -m;      y = top + Math.random()*vh; }
      else if(side === 1){ x = vw + m;  y = top + Math.random()*vh; }
      else if(side === 2){ x = Math.random()*vw; y = top - m; }
      else {               x = Math.random()*vw; y = top + vh + m; }
      var tx = vw * (0.2 + Math.random()*0.6);
      var ty = top + vh * (0.2 + Math.random()*0.6);
      ang = Math.atan2(ty - y, tx - x) + (Math.random()-0.5)*0.7;
      entering = true;
    } else {
      // opening field: scattered through the band that travels with the camera,
      // but never inside the current view
      var band = vh * BAND_PAD;
      var tries = 0;
      do {
        x = Math.random()*vw;
        y = top - band + Math.random()*(vh + band*2);
        tries++;
      } while(tries < 25 && y > top - 60 && y < top + vh + 60);
      ang = Math.random()*Math.PI*2;
    }

    return { id: ++uid, x:x, y:y, ang:ang, sf:sf,
             vx: Math.cos(ang)*sf*speedMult, vy: Math.sin(ang)*sf*speedMult,
             r:r, pts:pts, hp: special ? 4 : rockHp(r, gameTime), hitT: 0,
             special: special || null, pulse: Math.random()*Math.PI*2,
             rot: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.02,
             entering: entering };
  }

  function spawnSafeAsteroid(){
    // reject openings that send a rock straight down the player's throat
    var special = rollSpecial();
    var a, tries = 0;
    do {
      a = makeAsteroid('edge', special); tries++;
      var len = Math.hypot(a.vx, a.vy) || 1;
      var px = ship.x - a.x, py = ship.y - a.y;
      var t = (px*a.vx + py*a.vy) / (len*len);
      var miss = t > 0 ? Math.hypot(px - a.vx*t, py - a.vy*t) : Math.hypot(px, py);
      if(miss > 110) break;
    } while(tries < 8);
    return a;
  }

  function spawnFieldAsteroid(){
    var a, tries = 0;
    do { a = makeAsteroid('field'); tries++; } while(tries < 10 && Math.hypot(a.x-ship.x, a.y-ship.y) < 180);
    return a;
  }

  function spawnAsteroids(){
    asteroids = [];
    // most of the field sits off-view down the page; a handful fly in from the
    // edges straight away so the opening screen isn't empty
    var EDGE_SEED = 9;
    for(var i=0;i<START_ROCKS-EDGE_SEED;i++) asteroids.push(spawnFieldAsteroid());
    for(var j=0;j<EDGE_SEED;j++) asteroids.push(spawnSafeAsteroid());
  }

  // Weighted draw over whatever the clock has unlocked, so the newer hulls
  // dilute the scouts rather than replacing them.
  function pickAlienKind(t){
    var roster = [], total = 0, k;
    for(k in ALIEN_TYPES) if(t >= ALIEN_TYPES[k].at){ roster.push(k); total += ALIEN_TYPES[k].weight; }
    var r = Math.random() * total;
    for(var i=0;i<roster.length;i++){
      r -= ALIEN_TYPES[roster[i]].weight;
      if(r <= 0) return roster[i];
    }
    return 'scout';
  }

  function spawnAlien(kind){
    kind = kind || pickAlienKind(gameTime);
    var T = ALIEN_TYPES[kind];
    var fromLeft = Math.random() < 0.5;
    var y = window.scrollY + window.innerHeight * (0.2 + Math.random() * 0.6);
    aliens.push({
      id: ++uid, kind: kind, r: T.r,
      x: fromLeft ? -T.r * 2 : window.innerWidth + T.r * 2,
      y: y, baseY: y,
      vx: (fromLeft ? 1 : -1) * T.speed, vy: 0,
      t: Math.random() * Math.PI * 2,
      hp: Math.max(1, Math.round(T.hp * alienHpScale(gameTime))), hitT: 0,
      // a stalker burns fuel to chase; when it runs dry it breaks off and goes
      ttl: kind === 'stalker' ? 24 : 0, fleeing: false,
      nextShot: gameTime + 0.7   // a beat before it opens fire
    });
  }

  // ── drops ────────────────────────────────────────────────────────────────
  // Everything a kill leaves behind is on a timer: grab it or lose it. The last
  // stretch of that timer is spent blinking so the loss never feels arbitrary.
  function pickupTtl(kind){
    if(kind === 'heart') return HEART_TTL;
    if(kind === 'shield' || kind === 'rapid') return POWER_TTL;
    return COIN_TTL;
  }
  function dropPickup(x, y, kind){
    var a = Math.random()*Math.PI*2, sp = 0.4 + Math.random()*0.9;
    var ttl = pickupTtl(kind);
    pickups.push({
      x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, kind:kind,
      value: kind === 'gem' ? 5 : 1,
      life: ttl, max: ttl,
      t: Math.random()*Math.PI*2
    });
  }
  // Rocks pay in XP, with one exception: a ship that has already been hit can
  // turn up a repair. It is deliberately conditional rather than a flat drop —
  // a player who is not losing lives never sees one, so this cannot become the
  // old economy where health arrived faster than the field could take it. It
  // only ever softens a bad run's slide, and never rewards a clean one.
  var ROCK_HEART = 0.013;
  function dropRockLoot(x, y){
    if(lives < MAX_LIVES && Math.random() < ROCK_HEART){ dropPickup(x, y, 'heart'); return; }
    dropPickup(x, y, Math.random() < 0.25 ? 'gem' : 'coin');
  }

  function currentScore(){
    return Math.floor(gameTime * 10) + bonus;
  }

  function heartMarkup(){
    var s = '';
    for(var i=0;i<MAX_LIVES;i++) s += '<i class="px-hull' + (i < lives ? ' on' : '') + '"></i>';
    return s;
  }

  // syncHud runs on every simulated frame, so each field is compared before it
  // is written — the lives row in particular is markup, and rebuilding it 60
  // times a second for a value that changes twice a run is pure layout churn.
  var hudLast = { score:-1, lives:-1, xp:-1, need:-1, level:-1, shield:-1, rapid:-1, boss:-1 };

  // Red alert is derived, never set: anything that moves `lives` — a hit, a
  // repair, a run reset — lands here on the next frame and the class follows.
  // Storing it as a flag that each of those sites had to remember to update is
  // exactly how a screen ends up stuck flashing red after a repair.
  function syncRedAlert(){
    var on = redAlertActive();
    if(on === redAlert) return;
    redAlert = on;
    document.body.classList.toggle('astro-red-alert', on);
  }

  function syncHud(){
    var sc = currentScore();
    syncRedAlert();
    if(scoreEl && sc !== hudLast.score){ scoreEl.textContent = 'Stardate ' + sc; hudLast.score = sc; }
    if(livesEl && lives !== hudLast.lives){ livesEl.innerHTML = heartMarkup(); hudLast.lives = lives; }

    var need = xpNeed(level);
    if(xp !== hudLast.xp || need !== hudLast.need){
      if(xpFillEl) xpFillEl.style.width = Math.max(0, Math.min(100, xp / need * 100)).toFixed(1) + '%';
      if(xpNumEl) xpNumEl.textContent = xp + ' / ' + need;
      hudLast.xp = xp; hudLast.need = need;
    }
    if(lvlNumEl && level !== hudLast.level){ lvlNumEl.textContent = 'REFIT ' + level; hudLast.level = level; }

    // the timers only ever need whole seconds, so they are only touched when
    // that whole second actually ticks over
    var sSec = Math.ceil(shieldTime), rSec = Math.ceil(rapidTime);
    if(shieldEl && sSec !== hudLast.shield){
      shieldEl.textContent = 'Deflector ' + sSec + 's';
      shieldEl.classList.toggle('on', shieldTime > 0);
      hudLast.shield = sSec;
    }
    if(rapidEl && rSec !== hudLast.rapid){
      rapidEl.textContent = 'Phasers ' + rSec + 's';
      rapidEl.classList.toggle('on', rapidTime > 0);
      hudLast.rapid = rSec;
    }

    // the hull bar is the only readout that has to move smoothly, so it is
    // quantised to tenths of a percent rather than compared as a raw float
    if(bossFillEl){
      var bp = boss ? Math.round(Math.max(0, boss.hp) / boss.max * 1000) : -1;
      if(bp !== hudLast.boss){
        if(bp >= 0){
          bossFillEl.style.width = (bp / 10).toFixed(1) + '%';
          bossFillEl.classList.toggle('rage', !!(boss && boss.enraged));
        }
        hudLast.boss = bp;
      }
    }
  }

  // `src` is 'rock' or 'fire' — a rock you flew into, or something a Klingon
  // did to you. Nothing else in here cares, but ablative armour does: it is
  // the plating that vaporises under a disruptor and does nothing at all about
  // a lump of nickel-iron closing at forty metres a second.
  function hitShip(src){
    // a live shield is flat invincibility for its whole ten seconds — it does
    // not burn out on contact, which is the entire point of chasing the rock
    if(gameOver || ship.invuln > 0 || shieldTime > 0) return;
    // Ablative armour is spent before the hull is. It buys a plate and a beat
    // of grace — enough to get clear of whatever just hit you, since taking a
    // free hit and then immediately taking a real one is not a save.
    if(armourReady && src !== 'rock'){
      armourReady = false;
      armourAt = gameTime + armourEvery(up.armour);
      ship.invuln = Math.max(ship.invuln, 1.0);
      burst(ship.x, ship.y, 20, '111,232,255');
      return;
    }
    lives--;
    burst(ship.x, ship.y, 26);
    if(lives > 0){
      resetShip(RESPAWN_INVULN);
      syncHud();
      return;
    }
    lives = 0;
    gameOver = true;                    // loop() paints this frame, then stops
    if(finalEl) finalEl.textContent = currentScore();
    if(finalSubEl) finalSubEl.textContent =
      Math.floor(gameTime) + 's adrift · refit ' + level +
      (bossKills ? ' · ' + bossKills + ' capital ship' + (bossKills > 1 ? 's' : '') + ' destroyed' : '') +
      (bossFled ? ' · ' + bossFled + ' evaded' : '');
    if(hintEl) hintEl.textContent = isCoarse ? 'tap to play again' : 'press any key to play again';
    if(overEl) overEl.classList.add('on');
    // dying mid-fight left the hull bar and the inbound warning stranded on top
    // of the game-over card until the next run reset them
    if(bossBarEl) bossBarEl.classList.remove('on');
    if(warnEl) warnEl.classList.remove('on');
    hailOpen = false;
    if(hailEl) hailEl.classList.remove('on');
    closeLevel(true);
    syncHud();
  }

  // wipe the run back to zero — clock, XP, upgrades, buffs, rocks and warbirds
  function resetRun(){
    bullets = []; particles = []; aliens = []; alienBullets = []; pickups = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
    boss = null; bossWarn = 0; bossCount = 0; bossKills = 0; bossFled = 0; nextBossAt = BOSS_FIRST;
    hailOpen = false;
    if(bossBarEl) bossBarEl.classList.remove('on');
    if(hailEl) hailEl.classList.remove('on');
    if(warnEl) warnEl.classList.remove('on');
    gameTime = 0; lastFrame = performance.now();
    speedMult = speedMultAt(0); rockSpawnAcc = 0;
    lives = START_LIVES;
    xp = 0; level = 1; pendingLevels = 0;
    shieldTime = 0; rapidTime = 0; nextGuard = 0;
    armourReady = false; armourAt = 0;
    for(var k in up) up[k] = 0;
    autoPaused = false;
    torpedoes = []; shockwaves = []; wake = []; arcOn = [];
    nextTorp = 0; nextWake = 0;
    redAlert = true;                 // force syncRedAlert to re-evaluate
    syncRedAlert();
    closeLevel(true);
    resetShip(INVULN);
    spawnAsteroids();
    for(var f in hudLast) hudLast[f] = -1;   // force a full repaint of the HUD
    syncHud();
  }

  function restart(){
    if(!gameOver) return;
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    resetRun();
    raf = requestAnimationFrame(loop);
  }

  // ── the upgrade pool ─────────────────────────────────────────────────────
  // Sixteen entries, three offered per level. Every line a card prints is
  // computed from the live stat functions rather than written out, so a card
  // can never promise a number the ship does not actually get.
  //
  // The pool grew from nine in Sep 2026 and that has a cost worth knowing: a
  // specific card now shows up in roughly a fifth of drafts rather than a
  // third. That is the trade a bigger deck makes — more builds, less control
  // over reaching one — and it is why the two most situational additions are
  // gated rather than always on offer (Targeting Sensors needs a torpedo bay;
  // Damage Control needs a missing hull plate).

  // Both weapon cards move the same underlying number, and Spread Shot moves it
  // the wrong way, so they quote it through one helper. Whole figures read
  // cleaner, but it drops to a decimal when rounding would print the same
  // number twice and make a real change look like a no-op.
  function rateLine(fireL, spreadL){
    var a = 1 / shotCooldown(), b = 1 / cooldownWith(fireL, spreadL, rapidTime > 0);
    var dp = Math.round(a) === Math.round(b) ? 1 : 0;
    return a.toFixed(dp) + ' \u2794 ' + b.toFixed(dp) + ' shots/sec';
  }
  function pct(from, to){ return '+' + Math.round((to / from - 1) * 100) + '%'; }

  // ── the subsystem roster ─────────────────────────────────────────────────
  // Every card carries three things, in this order, because a name alone was
  // never enough: a ROLE so the card can be sorted at a glance against the
  // other two on offer, a plain sentence saying what it actually does in
  // ordinary words, and the figures. The Star Trek naming is the flavour on
  // top — it should never be the only thing telling you what you are picking.
  //
  // The figures are still computed from the live stat functions rather than
  // written out, so a card can never promise a value the ship does not get,
  // and they are quoted in units a player can feel: shots per second, targets
  // hit, seconds of cover. No pixel counts — nobody can see 165px.
  var UPGRADES = [
    { id:'fire', name:'Phaser Array', role:'Rate', max:6,
      what:'Your main gun cycles faster.',
      lines:function(){ return [rateLine(up.fire + 1, up.spread)]; } },

    { id:'ram', name:'Ramming Speed', role:'Impact', max:3,
      // the capital-ship exemption has to be on the card. It is not a detail:
      // without it the only way to learn the rule is to ram a dreadnought at
      // full impulse and lose a hull plate finding out.
      what:'At full impulse the bow shield holds. Fly flat out into rock or a ' +
           'warbird and it breaks, not you \u2014 but the impact kills your speed, ' +
           'and a capital ship is too big to shunt.',
      lines:function(){
        return up.ram
          ? [ramDamage() + ' \u2794 ' + (ramDamage() + 3) + ' impact damage',
             'Arms at ' + Math.round(ramThreshold() * 100) + '% \u2794 ' +
             Math.round((0.86 - 0.06 * up.ram) * 100) + '% of top speed']
          : [ramDamage() + 3 + ' impact damage, at ' +
             Math.round(0.86 * 100) + '% of top speed'];
      } },

    { id:'thrust', name:'Impulse Drive', role:'Handling', max:6,
      what:'Accelerate harder and come about quicker.',
      lines:function(){ return ['+14% thrust \u00b7 +10% turn rate']; } },

    // The one card that costs something. The downside goes in the sentence
    // rather than being buried in the second figure, because a hidden cost on
    // the strongest card in the deck is just a trap.
    { id:'spread', name:'Phaser Array Cone', role:'Coverage', max:3,
      what:'Fires a fan instead of one beam. Covers more sky, cycles slower.',
      lines:function(){ return [barrels(up.spread) + ' \u2794 ' + barrels(up.spread + 1) +
                                ' beams', rateLine(up.fire, up.spread + 1)]; } },

    // The only card that adds a whole weapon rather than moving a number, so
    // it is worth a level of its own before it starts scaling.
    { id:'torp', name:'Photon Torpedo Bay', role:'Warheads', max:4,
      what:'Adds a slow torpedo that hunts the nearest warbird, flying through ' +
           'rock to reach it, and detonates on everything caught in the blast. ' +
           'With no ship in range it flies straight and cracks the field.',
      lines:function(){
        return up.torp
          ? [torpDamage() + ' \u2794 ' + (torpDamage() + 1) + ' blast damage',
             'Reloads every ' + torpCooldown().toFixed(1) + 's \u2794 ' +
             (TORP_COOLDOWN * Math.pow(0.82, up.torp)).toFixed(1) + 's']
          : [TORP_DMG + ' blast damage, every ' + TORP_COOLDOWN.toFixed(1) + 's'];
      },
      apply:function(){ up.torp++; nextTorp = gameTime + 0.8; } },

    { id:'wake', name:'Warp Plasma Vent', role:'Wake', max:4,
      what:'Lays burning drive plasma behind you whenever the engines are lit. ' +
           'Klingons that fly through it cook; rock ignores it. Turning tight ' +
           'under power draws a wall.',
      lines:function(){
        return up.wake
          ? [wakeDamage() + ' \u2794 ' + wakeDamageAt(up.wake + 1) + ' burn damage',
             'Trail lasts ' + wakeLife().toFixed(1) + 's \u2794 ' +
             (WAKE_LIFE * (1 + 0.35 * up.wake)).toFixed(1) + 's']
          : [wakeDamageAt(1) + ' burn damage \u00b7 trail lasts ' +
             WAKE_LIFE.toFixed(1) + 's'];
      } },

    { id:'pierce', name:'Polarised Emitters', role:'Pierce', max:3,
      what:'Beams carry on through whatever they hit instead of stopping dead.',
      lines:function(){ return ['Hits ' + (up.pierce + 1) + ' \u2794 ' + (up.pierce + 2) +
                                ' targets per shot']; } },

    { id:'dmg', name:'Warp Core Output', role:'Damage', max:4,
      what:'Every weapon on the ship hits harder.',
      lines:function(){ return ['Beam damage ' + bulletDamage() + ' \u2794 ' + (bulletDamage() + 1),
                                'Torpedoes scale with it']; } },

    { id:'arc', name:'Hull Arc Coils', role:'Close', max:3,
      what:'The hull sheds a burning field a few metres out. Anything that gets ' +
           'that close cooks \u2014 rock included \u2014 but so does the ship, if ' +
           'you misjudge it.',
      lines:function(){
        return up.arc
          ? [arcDps().toFixed(1) + ' \u2794 ' + (ARC_DPS * (up.arc + 1) + up.dmg * 0.8).toFixed(1) +
             ' damage/sec', pct(arcRange(), arcRangeAt(up.arc + 1)) + ' reach']
          : [ARC_DPS.toFixed(1) + ' damage/sec, at arm\u2019s length'];
      } },

    { id:'range', name:'Long-Range Emitters', role:'Reach', max:3,
      what:'Beams travel faster and stay alive longer before they fade.',
      lines:function(){ return ['+12% beam speed \u00b7 +15% range']; } },

    // The collector. It was always a magnet; as a tractor beam it finally
    // looks like the thing it has been doing all along, and the draw is drawn
    // on the field, so the range is visible rather than a figure on a card.
    { id:'magnet', name:'Tractor Beam', role:'Collect', max:4,
      what:'Hauls dilithium in to you, so you need not fly through the rocks to ' +
           'collect it.',
      lines:function(){ return [pct(magnetRange(), MAGNET_R * (1 + 0.35 * (up.magnet + 1))) +
                                ' pull range']; } },

    { id:'guard', name:'Deflector Overcharge', role:'Defence', max:3,
      what:'Raises a shield by itself, over and over, for the rest of the run.',
      lines:function(){
        return up.guard
          ? [GUARD_TIME + 's untouchable, every ' + guardEvery(up.guard) +
             's \u2794 ' + guardEvery(up.guard + 1) + 's']
          : [GUARD_TIME + 's untouchable, every ' + guardEvery(1) + 's'];
      },
      // the first one should land while the choice is still fresh in mind
      apply:function(){ up.guard++; nextGuard = gameTime + 2; } },

    // Only on offer once there is a bay to point. A tracking card in a deck
    // where the player has no torpedoes is a wasted third of a draft.
    { id:'seek', name:'Targeting Sensors', role:'Tracking', max:3,
      avail:function(){ return up.torp > 0; },
      what:'Torpedoes come round harder and pick up a target from further out, ' +
           'so fewer of them sail past a warbird that turned.',
      lines:function(){ return ['+45% turn rate \u00b7 +30% lock range']; } },

    // The card that answers rock directly. Everything else defensive in this
    // deck answers "getting hit"; this one answers the thing doing ~70% of it.
    { id:'deflector', name:'Navigational Deflector', role:'Screen', max:3,
      what:'Pushes rock off the bow before it reaches you. It does nothing to a ' +
           'warbird, and a fast enough rock still gets through.',
      lines:function(){
        return up.deflector
          ? [pct(deflectRange(), DEFLECT_R * (1 + 0.30 * up.deflector)) + ' wider field']
          : ['Rock slides off the hull instead of hitting it'];
      } },

    // Deliberately the other half of the Navigational Deflector: that card
    // answers rock, which is ~70% of the damage in this game, and this one
    // answers the Klingons, which is the rest. Measured as a plate that
    // stopped *everything* it was worth a whole extra hull — +22s on a 73s
    // baseline, against +10s for a maxed Deflector Overcharge — because a life
    // in this run is worth about 24 seconds and a free hit is a whole life.
    { id:'armour', name:'Ablative Armour', role:'Armour', max:3,
      what:'Plating that vaporises under one disruptor hit and then grows back. ' +
           'It does nothing about rock \u2014 that is the deflector\u2019s job.',
      lines:function(){
        return up.armour
          ? ['Regrows every ' + armourEvery(up.armour) + 's \u2794 ' +
             armourEvery(up.armour + 1) + 's']
          : ['Absorbs one hit \u00b7 regrows every ' + armourEvery(1) + 's'];
      },
      apply:function(){ up.armour++; armourReady = true; } },

    { id:'life', name:'Damage Control', role:'Repair', max:99,
      avail:function(){ return lives < MAX_LIVES; },
      what:'Patches a hull plate back on, the moment you take it.',
      lines:function(){ return ['Hull ' + lives + ' \u2794 ' + (lives + 1)]; },
      apply:function(){ lives = Math.min(MAX_LIVES, lives + 1); } }
  ];

  function upgradeOpen(u){
    if(u.avail && !u.avail()) return false;
    if(u.id in up) return up[u.id] < u.max;
    return true;
  }

  // Fisher-Yates over what is still on offer, then take the first three. A
  // maxed-out line simply stops appearing rather than showing up greyed.
  function rollChoices(){
    var pool = UPGRADES.filter(upgradeOpen);
    for(var i=pool.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1)), t = pool[i];
      pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, 3);
  }

  // ── level up overlay ─────────────────────────────────────────────────────
  var levelEl     = document.getElementById('astroLevel');
  var levelGridEl = document.getElementById('astroLevelGrid');
  var levelKindEl = document.getElementById('astroLevelKind');
  var levelSubEl  = document.getElementById('astroLevelSub');
  var levelChoices = [];
  // Where this card came from. A card the XP rail paid for is a refit and is
  // numbered; a card a capital ship paid for is salvage and is not, because
  // beating a boss does not move `level` — the XP curve owns that number, and
  // quietly bumping it would make the *next* refit dearer, which is a hidden
  // penalty dressed as a reward. So the header tells the truth instead.
  var levelKind = '';

  function renderLevelHeader(){
    var salvage = levelKind === 'salvage';
    if(levelKindEl) levelKindEl.textContent = salvage ? 'Battle salvage' : 'Field refit';
    if(levelSubEl) levelSubEl.innerHTML = salvage
      ? 'Hull broken \u00b7 authorise one subsystem'
      : 'Refit <b>' + level + '</b> \u00b7 authorise one subsystem';
  }

  function renderChoices(){
    if(!levelGridEl) return;
    levelChoices = rollChoices();
    levelGridEl.innerHTML = '';
    levelChoices.forEach(function(u, i){
      var lvl = (u.id in up) ? up[u.id] : 0;
      var stacked = u.id in up;
      var badge = !stacked ? 'Instant' : (lvl === 0 ? 'New' : 'Lv ' + lvl + ' \u2794 ' + (lvl + 1));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'au-opt';
      // role and level share one row; the sentence and the figures are separate
      // tiers below the name, so the eye can stop at whichever it needs
      btn.innerHTML =
        '<span class="au-l"><em>' + u.role + '</em>' +
          '<b' + (lvl === 0 && stacked ? ' class="is-new"' : '') + '>' + badge + '</b></span>' +
        '<span class="au-n">' + u.name + '</span>' +
        '<span class="au-w">' + u.what + '</span>' +
        '<span class="au-d">' + u.lines().map(function(s){ return '<span>' + s + '</span>'; }).join('') + '</span>' +
        '<span class="au-k">Press ' + (i + 1) + '</span>';
      // pointerdown, not click: on a phone the 300ms a synthetic click can cost
      // is 300ms of a frozen field, and the overlay is the only thing on screen
      btn.addEventListener('pointerdown', function(e){ e.preventDefault(); choose(i); });
      levelGridEl.appendChild(btn);
    });
  }

  function openLevelUp(kind){
    if(!active || gameOver || levelOpen) return;
    levelKind = kind || '';
    // everything is maxed and health is full: there is nothing to offer, so
    // bank the level as score instead of showing an empty card
    if(rollChoices().length === 0){ pendingLevels = 0; bonus += 400; return; }
    levelOpen = true;
    keys = {}; pad.mag = 0;
    homeStick();
    renderLevelHeader();
    renderChoices();
    if(levelEl) levelEl.classList.add('on');
    document.body.classList.add('astro-paused');
    // Move focus into the panel. Without this the cards are tabbable but never
    // reached — focus is still parked on whatever launched the game, so a
    // keyboard user gets a modal they cannot see the edges of. preventScroll is
    // required: the run drives window.scrollY every frame and a focus-induced
    // scroll would fight the camera.
    var first = levelGridEl && levelGridEl.querySelector('.au-opt');
    if(first) try { first.focus({ preventScroll:true }); } catch(e){ first.focus(); }
  }

  function choose(i){
    if(!levelOpen) return;
    var u = levelChoices[i];
    if(!u) return;
    if(u.apply) u.apply(); else up[u.id]++;
    pendingLevels--;
    // enough gems can arrive in one frame to clear two bars; deal them out one
    // card at a time rather than silently dropping the second level
    if(pendingLevels > 0 && rollChoices().length > 0){
      // the salvage card is spent; anything stacked behind it is an ordinary
      // refit and has to be labelled as one
      levelKind = '';
      renderLevelHeader();
      renderChoices();
      syncHud();
      return;
    }
    pendingLevels = 0;
    levelKind = '';
    closeLevel();
    syncHud();
  }

  function closeLevel(silent){
    if(levelEl) levelEl.classList.remove('on');
    if(!levelOpen){
      if(!autoPaused) document.body.classList.remove('astro-paused');
      return;
    }
    levelOpen = false;
    if(!autoPaused) document.body.classList.remove('astro-paused');
    // drop focus off the card that is about to be removed, or the browser
    // scrolls the page hunting for whatever inherits it
    if(levelGridEl && levelGridEl.contains(document.activeElement)){
      document.activeElement.blur();
    }
    lastFrame = performance.now();
    // a beat of grace so you aren't dropped straight back onto a rock
    if(!silent && ship) ship.invuln = Math.max(ship.invuln, 1.4);
  }

  // ── the engagement hail ──────────────────────────────────────────────────
  // Opens where the capital ship used to simply appear: the inbound warning
  // flashes for its full beat, and then this takes the screen instead of a
  // warbird taking the sector. It halts the field exactly the way a refit card
  // does — same pause, same focus handling, same digit keys — because the
  // player has already learned that a panel means the run has stopped and a
  // decision is owed.
  function openHail(){
    // a dead or dismissed run gets nothing at all; a live run with no panel
    // to show falls back to the old behaviour and lets her decloak
    if(!active || gameOver) return;
    if(!hailEl || !hailFightEl){ spawnBoss(); return; }
    hailOpen = true;
    keys = {}; pad.mag = 0;
    homeStick();
    // the figures on the cards are the real ones for *this* contact — a panel
    // that quotes a round number the run does not actually pay is worse than a
    // panel with no numbers on it
    if(hailNameEl) hailNameEl.textContent = bossName(bossCount);
    if(hailBountyEl) hailBountyEl.textContent = '+' + bossBounty(bossCount) + ' stardate';
    if(hailAgainEl) hailAgainEl.textContent =
      'Next contact in ' + Math.round(bossGapFor(bossCount) * BOSS_FLEE_GAP) + 's';
    hailEl.classList.add('on');
    document.body.classList.add('astro-paused');
    // focus lands on Engage, not because it is the recommended answer but
    // because it is the first card; preventScroll for the same reason the refit
    // card needs it — the run drives window.scrollY every frame
    try { hailFightEl.focus({ preventScroll:true }); } catch(e){ hailFightEl.focus(); }
  }

  function closeHail(fight){
    if(!hailOpen) return;
    hailOpen = false;
    if(hailEl) hailEl.classList.remove('on');
    if(!autoPaused) document.body.classList.remove('astro-paused');
    // drop focus off the card that is about to be hidden, or the browser goes
    // hunting for whatever inherits it and scrolls the page doing it
    if(hailEl && hailEl.contains(document.activeElement)) document.activeElement.blur();
    lastFrame = performance.now();
    if(fight){
      spawnBoss();
      // a beat of grace on the way back in, the same one the refit card gives:
      // the field is exactly where it was when the panel opened
      if(ship) ship.invuln = Math.max(ship.invuln, 1.4);
    } else {
      fleeBoss();
    }
  }

  // Breaking off is free of damage and expensive in everything else. The
  // contact keeps its index, so running never makes the next one stronger —
  // only sooner. The cost is the whole of what was in it: the bounty, the
  // dilithium, the refit and the hull.
  function fleeBoss(){
    bossFled++;
    nextBossAt = gameTime + bossGapFor(bossCount) * BOSS_FLEE_GAP;
    // the sector does not go quiet just because the capital ship broke off
    nextAlienAt = gameTime + alienInterval(gameTime) * 0.5;
    if(ship){
      ship.invuln = Math.max(ship.invuln, BOSS_FLEE_GRACE);
      burst(ship.x, ship.y, 26, '0,240,255');
    }
    if(warnEl) warnEl.classList.remove('on');
  }

  if(hailFightEl) hailFightEl.addEventListener('pointerdown', function(e){ e.preventDefault(); closeHail(true); });
  if(hailFleeEl)  hailFleeEl.addEventListener('pointerdown', function(e){ e.preventDefault(); closeHail(false); });

  function addXp(n){
    xp += n;
    bonus += n * 10;
    var need = xpNeed(level);
    while(xp >= need){
      xp -= need;
      level++;
      pendingLevels++;
      need = xpNeed(level);
    }
    if(pendingLevels > 0){
      // a one-frame flare on the rail, so the level reads even if the player's
      // eyes never leave the field
      if(xpBarEl){
        xpBarEl.classList.add('pop');
        setTimeout(function(){ xpBarEl.classList.remove('pop'); }, 160);
      }
      openLevelUp();
    }
    syncHud();
  }

  // ── tab / focus handling ─────────────────────────────────────────────────
  // Leaving the tab used to keep the wall-clock score ticking while the frames
  // stopped, so you came back to a jumped score and a field that lurched. Now
  // the run halts the moment focus goes and waits for a deliberate resume.
  var pauseEl = document.getElementById('astroPause');

  function autoPause(){
    // a level-up card is already a halt of its own — stacking a second pause
    // under it would leave the choice closing into a still-frozen field
    if(!active || gameOver || autoPaused || levelOpen || hailOpen) return;
    autoPaused = true;
    keys = {}; pad.mag = 0;
    homeStick();
    if(pauseEl) pauseEl.classList.add('on');
    document.body.classList.add('astro-paused');
  }

  function autoResume(){
    if(!autoPaused) return;
    autoPaused = false;
    if(pauseEl) pauseEl.classList.remove('on');
    if(!levelOpen && !hailOpen) document.body.classList.remove('astro-paused');
    lastFrame = performance.now();
    if(ship) ship.invuln = Math.max(ship.invuln, 0.9);
    if(!raf) raf = requestAnimationFrame(loop);
  }

  function onVisibility(){
    if(document.hidden) autoPause();
    else lastFrame = performance.now();   // stays paused until the player acts
  }

  function blockClicks(e){
    if(e.target.closest('#astroExit') || e.target.closest('#astroOver') ||
       e.target.closest('#astroLevel') || e.target.closest('#astroPause') ||
       e.target.closest('#astroHail')) return;
    e.preventDefault(); e.stopPropagation();
  }

  function onKeyDown(e){
    if(e.code === 'Escape'){ stop(); return; }
    if(gameOver){ e.preventDefault(); restart(); return; }
    if(hailOpen){
      // like the refit card this is a decision rather than a dialog, so only
      // the keys that answer it mean anything — nothing here can dismiss it.
      // F and E are here because they are what the two cards are actually
      // called, and a player reading "Engage" should not have to count.
      e.preventDefault();
      if(e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'KeyF') closeHail(true);
      else if(e.code === 'Digit2' || e.code === 'Numpad2' || e.code === 'KeyE') closeHail(false);
      return;
    }
    if(levelOpen){
      // the card is a decision, not a dialog: the only keys that mean anything
      // are the three that pick, so nothing else can dismiss it
      e.preventDefault();
      if(e.code === 'Digit1' || e.code === 'Numpad1') choose(0);
      else if(e.code === 'Digit2' || e.code === 'Numpad2') choose(1);
      else if(e.code === 'Digit3' || e.code === 'Numpad3') choose(2);
      return;
    }
    if(autoPaused){ e.preventDefault(); autoResume(); return; }
    if(e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='Space'){
      e.preventDefault();   // space no longer fires, but it must not scroll either
      keys[e.code] = true;
    }
  }
  function onKeyUp(e){ keys[e.code] = false; }

  // ── touch: one floating thumbstick ───────────────────────────────────────
  // With the guns automatic there is nothing else a thumb has to do, so the
  // whole screen is the stick's catchment: press anywhere and the ring comes
  // to the thumb instead of the thumb hunting for a ring in the corner.
  var touchEl = document.getElementById('astroTouch');
  var stickEl = document.getElementById('astroStick');
  var knobEl  = document.getElementById('astroKnob');
  var stickId = null;

  function homeStick(){
    stickId = null;
    pad.mag = 0;
    if(!stickEl) return;
    stickEl.classList.remove('on', 'free');
    stickEl.style.left = '';
    stickEl.style.top = '';
    if(knobEl) knobEl.style.transform = '';
  }

  function stickTo(e){
    var r = stickEl.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var max = r.width / 2 - 14;
    var dist = Math.hypot(dx, dy);
    pad.angle = Math.atan2(dy, dx);
    pad.mag = max > 0 ? Math.min(1, dist / max) : 0;
    var kx = Math.cos(pad.angle) * pad.mag * max;
    var ky = Math.sin(pad.angle) * pad.mag * max;
    // the knob is centred by a transform of its own, so its offset has to ride
    // on top of that rather than replace it
    knobEl.style.transform = 'translate(-50%,-50%) translate(' +
      kx.toFixed(1) + 'px,' + ky.toFixed(1) + 'px)';
  }

  function stickDown(e){
    if(gameOver){ e.preventDefault(); restart(); return; }
    if(autoPaused){ e.preventDefault(); autoResume(); return; }
    if(levelOpen || hailOpen) return;
    if(stickId !== null) return;
    stickId = e.pointerId;
    e.preventDefault();
    // anchor the ring on the thumb, kept far enough from the edges that the
    // full throw is still reachable in every direction
    var half = stickEl.offsetWidth / 2 || 70;
    var px = Math.max(half + 6, Math.min(window.innerWidth  - half - 6, e.clientX));
    var py = Math.max(half + 6, Math.min(window.innerHeight - half - 6, e.clientY));
    stickEl.classList.add('free', 'on');
    stickEl.style.left = px + 'px';
    stickEl.style.top  = py + 'px';
    try { touchEl.setPointerCapture(e.pointerId); } catch(err){}
    stickTo(e);
  }
  function stickMove(e){ if(e.pointerId !== stickId) return; e.preventDefault(); stickTo(e); }
  function stickUp(e){ if(e.pointerId !== stickId) return; homeStick(); }

  if(overEl) overEl.addEventListener('pointerdown', function(e){ e.preventDefault(); restart(); });
  if(pauseEl) pauseEl.addEventListener('pointerdown', function(e){ e.preventDefault(); autoResume(); });

  if(touchEl && stickEl && knobEl){
    touchEl.addEventListener('pointerdown', stickDown);
    touchEl.addEventListener('pointermove', stickMove);
    touchEl.addEventListener('pointerup', stickUp);
    touchEl.addEventListener('pointercancel', stickUp);
  }

  function killAsteroid(k){
    var ax = asteroids[k];
    if(ax.special){
      // a rare rock pays in a timed power-up rather than gems, and says so with
      // a burst in the colour of whatever it just dropped
      var sp = SPECIALS[ax.special];
      burst(ax.x, ax.y, 22, sp.rgb);
      dropPickup(ax.x, ax.y, ax.special);
      bonus += 60;
    } else {
      burst(ax.x, ax.y, 10);
      dropRockLoot(ax.x, ax.y);
      bonus += 15;
    }
    asteroids.splice(k, 1);
  }

  function killAlien(m){
    var al = aliens[m];
    var T = ALIEN_TYPES[al.kind];
    burst(al.x, al.y, 18, T.rgb);
    // A warbird used to be a guaranteed extra life, and with three of them in
    // the sky that was more health than the field could ever take back — most
    // of the reason a careless run never actually ended. Health is a roll now;
    // crystals are the reliable prize, which keeps warbirds worth hunting.
    if(Math.random() < T.heart) dropPickup(al.x, al.y, 'heart');
    else for(var g=0; g<T.gems; g++) dropPickup(al.x, al.y, 'gem');
    aliens.splice(m, 1);
    bonus += T.bonus;
  }

  // ── the capital ships ────────────────────────────────────────────────
  // Hull and cadence both scale with how many have already been beaten, so the
  // fourth one is a genuinely different fight from the first rather than the
  // same fight with a longer bar.
  function bossHpFor(n){ return 180 + n * 110; }
  // Shots land on the armoured core rather than the full silhouette, so a wide
  // fan no longer connects with every barrel at once.
  function bossHitR(){ return BOSS_R * 0.82; }
  // If a build cannot break the hull inside this, the capital ship breaks off
  // instead: no reward, no death spiral, and the next one arrives sooner.
  var BOSS_FUSE = 42;
  function bossGapFor(n){ return Math.max(44, BOSS_GAP - n * 4); }
  function bossName(n){
    var base = BOSS_NAMES[n % BOSS_NAMES.length];
    var mk = Math.floor(n / BOSS_NAMES.length);
    return mk ? base + ' MK' + (mk + 1) : base;
  }

  function spawnBoss(){
    var hp = bossHpFor(bossCount);
    boss = {
      id: ++uid, x: window.innerWidth / 2, y: window.scrollY - BOSS_R * 2, r: BOSS_R,
      vx: 0, vy: 0, hp: hp, max: hp, hitT: 0, t: 0, rot: 0,
      // it drifts in for a beat and a half before it is allowed to shoot
      phase: 'entry', phaseT: 1.4, next: 0, shots: 0, charged: false,
      escortAt: gameTime + 9, enraged: false, index: bossCount, fuse: BOSS_FUSE, leaving: false
    };
    bossCount++;
    if(bossNameEl) bossNameEl.textContent = bossName(boss.index);
    if(bossBarEl) bossBarEl.classList.add('on');
    hudLast.boss = -1;
  }

  var BOSS_CYCLE = ['ring', 'volley', 'charge'];

  // Each attack is a phase with its own budget of sub-shots; bossNextPhase
  // stocks that budget and the update loop spends it on a cadence.
  function bossNextPhase(t, rage){
    var b = boss;
    b.phase = b.phase === 'entry'
      ? 'ring'
      : BOSS_CYCLE[(BOSS_CYCLE.indexOf(b.phase) + 1) % BOSS_CYCLE.length];
    b.charged = false;
    if(b.phase === 'ring'){
      b.phaseT = 2.0 / rage; b.shots = b.enraged ? 3 : 2; b.next = t + 0.25;
    } else if(b.phase === 'volley'){
      b.phaseT = 2.2 / rage; b.shots = b.enraged ? 4 : 3; b.next = t + 0.3;
    } else {
      // the charge telegraphs for most of a second before it commits, so it is
      // always dodged rather than suffered
      b.phaseT = 2.4 / rage; b.shots = 0; b.next = t + 0.85 / rage;
    }
  }

  function bossShoot(x, y, ang, speed, r){
    alienBullets.push({ x:x, y:y, vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
                        life: 3.6, r: r || 4, rgb: '255,122,99' });
  }

  function bossRing(rage){
    var b = boss;
    var n = Math.min(16, 9 + b.index * 2) + (b.enraged ? 4 : 0);
    var off = Math.random() * Math.PI * 2;
    var sp = 2.5 + b.index * 0.12;
    for(var i=0;i<n;i++) bossShoot(b.x, b.y, off + i / n * Math.PI * 2, sp * rage, 4);
    burst(b.x, b.y, 8, '255,122,99');
  }

  function bossVolley(t, rage){
    var b = boss;
    var sp = alienBulletSpeed(t) * 1.05 * rage;
    var aim = Math.atan2(ship.y - b.y, ship.x - b.x);
    for(var i=-1;i<=1;i++) bossShoot(b.x, b.y, aim + i * 0.17, sp, 4);
  }

  function killBoss(){
    var b = boss;
    burst(b.x, b.y, 60, '255,209,102');
    burst(b.x, b.y, 34, '255,77,109');
    // The payout is the point, and since the hail it is the payout for a
    // decision rather than for an event: the player was offered a way out of
    // this fight and turned it down, so beating it has to be the best thing
    // that can happen in a run. A late run cannot reach its next refit off
    // rocks alone under the current XP curve, and this is the way back into the
    // level economy — which is exactly what a withdrawal gives up.
    for(var i=0; i<5 + Math.min(5, b.index); i++) dropPickup(b.x, b.y, 'gem');
    for(var h=0; h<BOSS_KILL_HEARTS; h++) dropPickup(b.x, b.y, 'heart');
    dropPickup(b.x, b.y, Math.random() < 0.5 ? 'shield' : 'rapid');
    bonus += bossBounty(b.index);
    bossKills++;
    boss = null;
    nextBossAt = gameTime + bossGapFor(bossCount);
    nextAlienAt = gameTime + alienInterval(gameTime) * 0.6;
    if(bossBarEl) bossBarEl.classList.remove('on');
    // The refit is granted, not dropped. It is the half of the bounty that was
    // promised on the card, and a promised reward must not be something a stray
    // rock can take off you in the two seconds between the kill and the
    // crystals landing. The dilithium on the floor is the bonus on top.
    pendingLevels++;
    openLevelUp('salvage');
  }

  function updateBoss(dt, sf, t){
    var b = boss;
    b.t += dt;
    b.rot += 0.004 * sf;
    if(b.hitT > 0) b.hitT = Math.max(0, b.hitT - dt);

    // out of patience: it stops fighting, climbs away and is gone
    if(!b.leaving){
      b.fuse -= dt;
      if(b.fuse <= 0){
        b.leaving = true;
        b.vy = -5.5; b.vx *= 0.3;
        if(bossBarEl) bossBarEl.classList.remove('on');
        nextBossAt = t + bossGapFor(bossCount) * 0.55;
      }
    }
    if(b.leaving){
      b.y += b.vy * sf; b.x += b.vx * sf;
      if(b.y < window.scrollY - b.r * 4){ boss = null; nextAlienAt = t + 1.5; }
      return;
    }

    // half hull: it speeds up, fires wider rings and calls escorts more often
    if(!b.enraged && b.hp <= b.max * 0.5){
      b.enraged = true;
      burst(b.x, b.y, 34, '255,77,109');
      b.phase = 'volley'; b.phaseT = 0.15;
    }
    var rage = b.enraged ? 1.45 : 1;

    // station-keeping: sit above the ship and slide across to stay on it,
    // clamped inside the view so the fight can never wander off-screen
    if(!(b.phase === 'charge' && b.charged)){
      var tx = ship.x;
      var ty = Math.max(window.scrollY + b.r + 20,
               Math.min(window.scrollY + window.innerHeight - b.r - 20,
                        ship.y - window.innerHeight * 0.26));
      b.vx += Math.max(-0.07, Math.min(0.07, (tx - b.x) * 0.0024)) * sf * rage;
      b.vy += Math.max(-0.07, Math.min(0.07, (ty - b.y) * 0.0024)) * sf * rage;
      var bd = Math.pow(0.965, sf);
      b.vx *= bd; b.vy *= bd;
    } else {
      var cd2 = Math.pow(0.985, sf);
      b.vx *= cd2; b.vy *= cd2;
    }
    b.x += b.vx * sf; b.y += b.vy * sf;

    b.phaseT -= dt;
    if(b.phaseT <= 0){ bossNextPhase(t, rage); }
    else if(b.phase === 'ring' && b.shots > 0 && t >= b.next){
      b.shots--; b.next = t + 0.7 / rage; bossRing(rage);
    } else if(b.phase === 'volley' && b.shots > 0 && t >= b.next){
      b.shots--; b.next = t + 0.42 / rage; bossVolley(t, rage);
    } else if(b.phase === 'charge' && !b.charged && t >= b.next){
      b.charged = true;
      var chd = Math.hypot(ship.x - b.x, ship.y - b.y) || 1;
      var chs = 6.2 * rage;
      b.vx = (ship.x - b.x) / chd * chs;
      b.vy = (ship.y - b.y) / chd * chs;
      burst(b.x, b.y, 18, '255,209,102');
    }

    if(t >= b.escortAt && aliens.length < alienMax(t) + 1){
      b.escortAt = t + (b.enraged ? 9 : 13);
      spawnAlien('scout');
    }

    if(Math.hypot(ship.x - b.x, ship.y - b.y) < b.r + SHIP_RADIUS){
      // a shield turns the ram into a shove and a broken shield, not a free kill
      if(shieldTime > 0){
        shieldTime = 0;
        burst(ship.x, ship.y, 22, '0,194,255');
        var rdx = ship.x - b.x, rdy = ship.y - b.y, rd = Math.hypot(rdx, rdy) || 1;
        ship.vx += rdx / rd * 7; ship.vy += rdy / rd * 7;
        ship.invuln = Math.max(ship.invuln, 0.8);
      } else hitShip('fire');
    }
  }

  function collect(p){
    if(p.kind === 'heart'){
      if(lives < MAX_LIVES){ lives++; }
      else bonus += 200;                 // already at full health: bank it
      burst(p.x, p.y, 10, '255,77,109');
      syncHud();
    } else if(p.kind === 'shield' || p.kind === 'rapid'){
      // instant, and deliberately not a pause: the run never stops for these
      if(p.kind === 'shield') shieldTime = POWER_TIME;
      else rapidTime = POWER_TIME;
      burst(p.x, p.y, 20, SPECIALS[p.kind].rgb);
      bonus += 50;
      syncHud();
    } else {
      // dilithium is XP, and XP is the only thing that opens a refit card
      burst(p.x, p.y, p.value > 1 ? 10 : 5, '255,209,102');
      addXp(p.value);
    }
  }

  function fireShot(){
    // spread fans the barrels around the nose; with no spread this is the one
    // shot it always was.
    //
    // Shots carry the ship's own velocity. A ship at full throttle travels at
    // roughly 7.8px a frame against a muzzle speed of 11, so without this a
    // thrusting player's bullets crawl away from the nose and the gun stops
    // working exactly when the player is moving — which, with the trigger held
    // down permanently, is most of the run.
    var n = barrels(up.spread), step = fanStep(up.spread);
    var base = ship.angle - step * (n - 1) / 2;
    var sp = bulletSpeed(), lf = bulletLife(), dmg = bulletDamage();
    for(var i=0;i<n;i++){
      var a = base + step * i;
      bullets.push({
        x: ship.x + Math.cos(a)*NOSE_OFFSET, y: ship.y + Math.sin(a)*NOSE_OFFSET,
        vx: Math.cos(a)*sp + ship.vx, vy: Math.sin(a)*sp + ship.vy,
        dmg: dmg, life: lf,
        pierce: up.pierce, hits: null
      });
    }
  }

  // shortest signed angle from b to a, in (-PI, PI]
  function angDiff(a, b){
    var d = (a - b) % (Math.PI*2);
    if(d > Math.PI) d -= Math.PI*2;
    if(d < -Math.PI) d += Math.PI*2;
    return d;
  }

  // A lock is only ever held on something that is still there to be hit. The
  // boss is checked by identity because it is a single slot rather than a list,
  // and `leaving` means she has broken off and is no longer a legal target.
  function torpTargetLive(o){
    if(!o) return false;
    if(o === boss) return !!boss && !boss.leaving && boss.hp > 0;
    return o.hp > 0 && aliens.indexOf(o) !== -1;
  }

  // Nearest ship, with a penalty for how far off the nose it sits — a target
  // directly behind the launcher costs the torpedo most of its fuel in the
  // turn, so it is scored as if it were further away rather than ruled out.
  // A capital ship is worth going after even from further out, because that is
  // the fight where a torpedo is worth the most.
  function acquireTorpTarget(x, y, ang){
    var best = null, bestScore = Infinity, R = torpSeekRange();
    function consider(o, bias){
      var dx = o.x - x, dy = o.y - y, d = Math.hypot(dx, dy);
      if(d > R) return;
      var off = Math.abs(angDiff(Math.atan2(dy, dx), ang));
      var score = d * (1 + off * 0.55) * bias;
      if(score < bestScore){ bestScore = score; best = o; }
    }
    for(var i=0;i<aliens.length;i++) consider(aliens[i], 1);
    if(boss && !boss.leaving) consider(boss, 0.6);
    return best;
  }

  function fireTorpedo(){
    var a = ship.angle, sp = TORP_SPEED;
    torpedoes.push({
      x: ship.x + Math.cos(a)*NOSE_OFFSET, y: ship.y + Math.sin(a)*NOSE_OFFSET,
      // a torpedo inherits the ship's velocity for the same reason a phaser
      // does — at full impulse the hull outruns a 5.4px shell otherwise
      vx: Math.cos(a)*sp + ship.vx, vy: Math.sin(a)*sp + ship.vy,
      life: TORP_LIFE, r: TORP_R, t: 0,
      // launched on the nose either way; the lock is what it does afterwards
      target: acquireTorpTarget(ship.x, ship.y, a)
    });
  }

  // The detonation is the weapon. One damage pass over everything inside the
  // blast, then a shockwave ring that is pure decoration — the ring expands
  // after the fact and never touches anything, so what the player sees can be
  // generous without the hitbox following it outward.
  function detonate(x, y){
    var R = torpBlast(), dmg = torpDamage(), R2 = R * R;
    shockwaves.push({ x:x, y:y, r: R * 0.18, max: R, life: 1 });
    burst(x, y, 26, '255,45,120');
    burst(x, y, 12, '255,209,102');

    for(var k=asteroids.length-1;k>=0;k--){
      var rk = asteroids[k];
      var dx = rk.x - x, dy = rk.y - y;
      if(dx*dx + dy*dy > R2) continue;
      rk.hp -= dmg; rk.hitT = 0.14;
      if(rk.hp <= 0) killAsteroid(k);
    }
    for(var m=aliens.length-1;m>=0;m--){
      var al = aliens[m];
      var ax = al.x - x, ay = al.y - y;
      if(ax*ax + ay*ay > R2) continue;
      al.hp -= dmg; al.hitT = 0.14;
      if(al.hp <= 0) killAlien(m);
    }
    if(boss && !boss.leaving){
      var bx = boss.x - x, by = boss.y - y;
      if(bx*bx + by*by <= R2){
        boss.hp -= dmg; boss.hitT = 0.14;
        if(boss.hp <= 0) killBoss();
      }
    }
    // the blast clears incoming plasma, which is most of why flying into a
    // crowd behind a torpedo is survivable at all
    for(var q=alienBullets.length-1;q>=0;q--){
      var ab = alienBullets[q];
      var qx = ab.x - x, qy = ab.y - y;
      if(qx*qx + qy*qy <= R2) alienBullets.splice(q,1);
    }
  }

  // The trail is a string of overlapping blobs dropped on a fixed interval, so
  // its density is the same at any speed — dropping one per frame would make a
  // fast ship's wall thinner than a slow one's, which is exactly backwards.
  // Each blob damages a given ship at most every WAKE_TICK, tracked on the
  // blob rather than the ship, so flying a long trail across a warbird burns
  // it repeatedly and clipping one corner of it does not.
  function updateWake(dt, t){
    if(up.wake > 0 && ship.thrusting && t >= nextWake){
      nextWake = t + WAKE_GAP;
      wake.push({ x: ship.x - Math.cos(ship.angle) * NOSE_OFFSET * 0.8,
                  y: ship.y - Math.sin(ship.angle) * NOSE_OFFSET * 0.8,
                  life: wakeLife(), max: wakeLife(), hits: {} });
    }
    var dmg = wakeDamage();
    for(var i=wake.length-1;i>=0;i--){
      var w = wake[i];
      w.life -= dt;
      if(w.life <= 0){ wake.splice(i,1); continue; }
      if(!up.wake) continue;
      for(var a=aliens.length-1;a>=0;a--){
        var al = aliens[a];
        if(Math.hypot(al.x-w.x, al.y-w.y) > al.r + WAKE_R) continue;
        if(w.hits[al.id] > t) continue;
        w.hits[al.id] = t + WAKE_TICK;
        al.hp -= dmg; al.hitT = 0.12;
        burst(al.x, al.y, 3, '255,140,60');
        if(al.hp <= 0) killAlien(a);
      }
      if(boss && !boss.leaving && Math.hypot(boss.x-w.x, boss.y-w.y) < bossHitR() + WAKE_R &&
         !(w.hits[boss.id] > t)){
        w.hits[boss.id] = t + WAKE_TICK;
        boss.hp -= dmg; boss.hitT = 0.12;
        if(boss.hp <= 0) killBoss();
      }
    }
  }

  // Damage per second rather than per hit, so it does not care about the frame
  // rate and a rock that clips the field for a tenth of a second takes a tenth
  // of a second's worth. `arcOn` is what the renderer draws, collected here so
  // the burn and the lightning can never disagree about what is being hit.
  var arcOn = [];
  function updateArc(dt){
    arcOn.length = 0;
    if(up.arc <= 0) return;
    var R = arcRange(), hit = arcDps() * dt;
    for(var k=asteroids.length-1;k>=0;k--){
      var rk = asteroids[k];
      if(Math.hypot(rk.x-ship.x, rk.y-ship.y) > R + rk.r) continue;
      rk.hp -= hit; rk.hitT = 0.1;
      arcOn.push(rk);
      if(rk.hp <= 0) killAsteroid(k);
    }
    for(var m=aliens.length-1;m>=0;m--){
      var al = aliens[m];
      if(Math.hypot(al.x-ship.x, al.y-ship.y) > R + al.r) continue;
      al.hp -= hit; al.hitT = 0.1;
      arcOn.push(al);
      if(al.hp <= 0) killAlien(m);
    }
    if(boss && !boss.leaving && Math.hypot(boss.x-ship.x, boss.y-ship.y) < R + bossHitR()){
      boss.hp -= hit; boss.hitT = 0.1;
      arcOn.push(boss);
      if(boss.hp <= 0) killBoss();
    }
  }

  function updateTorpedoes(dt, sf){
    for(var i=torpedoes.length-1;i>=0;i--){
      var tp = torpedoes[i];

      // A dead target frees the lock and the torpedo goes looking for another
      // rather than sailing on into empty space — a warbird killed by phaser
      // fire mid-flight used to strand its torpedo.
      if(!torpTargetLive(tp.target)) tp.target = acquireTorpTarget(tp.x, tp.y, Math.atan2(tp.vy, tp.vx));

      if(tp.target){
        // Where to aim: the target's own position, pushed forward along
        // whatever it did last frame. The velocity is measured here rather
        // than read off the target because a bobbing warbird's `vy` is zero —
        // its y comes from a sine on baseY — so the field would lie.
        var tx = tp.target.x, ty = tp.target.y;
        if(tp.tid === tp.target && sf > 0.001){
          var tvx = (tx - tp.tpx) / sf, tvy = (ty - tp.tpy) / sf;
          var td = Math.hypot(tx - tp.x, ty - tp.y);
          var lead = Math.min(TORP_LEAD, td / TORP_SPEED);
          tx += tvx * lead; ty += tvy * lead;
        }
        // remembered against the target itself, so a re-lock starts clean
        tp.tid = tp.target; tp.tpx = tp.target.x; tp.tpy = tp.target.y;

        // Steer by turning the velocity, not by re-pointing it: the turn is
        // rate-limited, so the track curves and a target that keeps moving can
        // still get outside the arc. Speed eases back to the bay's own figure
        // at the same time, which sheds whatever the hull lent it at launch.
        var aim = Math.atan2(ty - tp.y, tx - tp.x);
        var cur = Math.atan2(tp.vy, tp.vx);
        var turn = torpTurnRate() * dt, d = angDiff(aim, cur);
        cur += Math.max(-turn, Math.min(turn, d));
        var sp = Math.hypot(tp.vx, tp.vy) || TORP_SPEED;
        sp += (TORP_SPEED - sp) * (1 - Math.pow(0.90, sf));
        tp.vx = Math.cos(cur) * sp; tp.vy = Math.sin(cur) * sp;
      }

      tp.x += tp.vx * sf; tp.y += tp.vy * sf; tp.life -= dt; tp.t += dt;
      if(tp.x < 0 || tp.x > window.innerWidth || tp.y < 0 || tp.y > docH){
        torpedoes.splice(i,1); continue;
      }
      if(tp.life <= 0){ detonate(tp.x, tp.y); torpedoes.splice(i,1); continue; }

      var hit = false, j;
      // Rock only arms the fuse when there is nothing better to hit. This is
      // the line that stops a torpedo being spent on the first pebble between
      // it and the warbird it was launched at; the blast still catches the rock
      // on the way past when it goes off at the target.
      if(!tp.target) for(j=0;j<asteroids.length;j++){
        if(Math.hypot(tp.x-asteroids[j].x, tp.y-asteroids[j].y) < asteroids[j].r + tp.r){ hit = true; break; }
      }
      // the fuse is only generous toward the thing it is actually chasing;
      // everything else still has to be touched
      if(!hit && tp.target && tp.target !== boss &&
         Math.hypot(tp.x-tp.target.x, tp.y-tp.target.y) < tp.target.r + tp.r + TORP_FUSE) hit = true;
      if(!hit) for(j=0;j<aliens.length;j++){
        if(Math.hypot(tp.x-aliens[j].x, tp.y-aliens[j].y) < aliens[j].r + tp.r){ hit = true; break; }
      }
      if(!hit && boss && !boss.leaving &&
         Math.hypot(tp.x-boss.x, tp.y-boss.y) <
           bossHitR() + tp.r + (tp.target === boss ? TORP_FUSE : 0)) hit = true;
      if(hit){ detonate(tp.x, tp.y); torpedoes.splice(i,1); }
    }

    for(var w=shockwaves.length-1;w>=0;w--){
      var sw = shockwaves[w];
      sw.r += (sw.max - sw.r) * (1 - Math.pow(0.82, sf));
      sw.life -= 2.6 * dt;
      if(sw.life <= 0) shockwaves.splice(w,1);
    }
  }

  function update(dt){
    var t = gameTime;
    var sf = dt * 60; if(sf > MAX_STEP) sf = MAX_STEP;
    speedMult = speedMultAt(t);

    if(shieldTime > 0) shieldTime = Math.max(0, shieldTime - dt);
    if(rapidTime > 0)  rapidTime  = Math.max(0, rapidTime  - dt);
    if(up.armour > 0 && !armourReady && t >= armourAt) armourReady = true;
    // Auto Aegis: a free shield on a fixed cadence once it has been picked
    if(up.guard > 0 && t >= nextGuard){
      nextGuard = t + guardEvery(up.guard);
      shieldTime = Math.max(shieldTime, GUARD_TIME);
      burst(ship.x, ship.y, 14, '0,194,255');
    }
    syncHud();

    // the field thickens continuously, and kills are topped back up on a short
    // stagger rather than instantly, so a cleared pocket stays cleared a moment
    // red alert is a real risk multiplier, not just a light: the field carries
    // more rock and the warbirds come in closer together. Both are folded in
    // here rather than into the curves themselves, so the underlying
    // escalation stays readable and the alert stays a modifier on top of it.
    var target = rockTargetAt(t) + (redAlert ? RED_ALERT_ROCKS : 0);
    if(target > MAX_ROCKS + RED_ALERT_ROCKS) target = MAX_ROCKS + RED_ALERT_ROCKS;
    rockSpawnAcc += dt;
    if(asteroids.length < target && rockSpawnAcc > (boss ? 1.5 : 0.35)){
      rockSpawnAcc = 0;
      asteroids.push(spawnSafeAsteroid());
    }

    if(keys.ArrowLeft) ship.angle -= rotPower() * sf;
    if(keys.ArrowRight) ship.angle += rotPower() * sf;

    // joystick: rotate toward the stick direction rather than snapping to it,
    // so the ship still feels like it turns
    if(pad.mag > 0.18){
      var da = pad.angle - ship.angle;
      while(da >  Math.PI) da -= Math.PI * 2;
      while(da < -Math.PI) da += Math.PI * 2;
      var step = rotPower() * 1.7 * sf;
      ship.angle += Math.max(-step, Math.min(step, da));
    }

    // throttle is proportional to how far the stick is pushed
    var thrustAmt = 0;
    if(keys.ArrowUp) thrustAmt = 1;
    else if(pad.mag > 0.3) thrustAmt = Math.min(1, (pad.mag - 0.3) / 0.55);
    ship.thrusting = thrustAmt > 0;
    if(ship.thrusting){
      ship.vx += Math.cos(ship.angle) * thrustPower() * thrustAmt * sf;
      ship.vy += Math.sin(ship.angle) * thrustPower() * thrustAmt * sf;
    }
    var drag = Math.pow(0.98, sf);
    ship.vx *= drag; ship.vy *= drag;

    var nx = ship.x + ship.vx * sf, ny = ship.y + ship.vy * sf;
    if(nx < 0){ nx = 0; ship.vx = -ship.vx*BOUNCE; }
    else if(nx > window.innerWidth){ nx = window.innerWidth; ship.vx = -ship.vx*BOUNCE; }
    if(ny < 0){ ny = 0; ship.vy = -ship.vy*BOUNCE; }
    else if(ny > docH){ ny = docH; ship.vy = -ship.vy*BOUNCE; }
    ship.x = nx; ship.y = ny;
    if(ship.invuln > 0) ship.invuln = Math.max(0, ship.invuln - dt);

    for(var r=asteroids.length-1; r>=0; r--){
      var ax = asteroids[r];
      ax.vx = Math.cos(ax.ang) * ax.sf * speedMult;
      ax.vy = Math.sin(ax.ang) * ax.sf * speedMult;
      ax.x += ax.vx * sf; ax.y += ax.vy * sf; ax.rot += ax.rotSpeed * sf;
      if(ax.hitT > 0) ax.hitT = Math.max(0, ax.hitT - dt);
      if(ax.entering){
        // hold off wrapping until it has actually made it onto the screen
        if(ax.x >= -ax.r && ax.x <= window.innerWidth + ax.r) ax.entering = false;
      } else {
        // The field travels with the camera. Wrapping against docH spread forty
        // rocks down thirteen thousand pixels, which left two or three on screen
        // at a time — survivable, but it starved the XP loop that the whole run
        // now hangs on. Wrapping against a band a little taller than the view
        // makes on-screen density the thing that is actually governed.
        var band = window.innerHeight * BAND_PAD;
        var bTop = window.scrollY - band - ax.r;
        var bBot = window.scrollY + window.innerHeight + band + ax.r;
        if(ax.x < -ax.r) ax.x = window.innerWidth + ax.r;
        else if(ax.x > window.innerWidth + ax.r) ax.x = -ax.r;
        if(ax.y < bTop) ax.y = bBot;
        else if(ax.y > bBot) ax.y = bTop;
      }
      // The deflector shoves rock aside by moving it, not by pushing on its
      // velocity: vx/vy are re-derived from ax.ang at the top of this loop
      // every frame, so any impulse written to them is gone before it is read.
      if(up.deflector > 0){
        var ddx = ax.x - ship.x, ddy = ax.y - ship.y;
        var dd = Math.hypot(ddx, ddy) || 1, dR = deflectRange() + ax.r;
        if(dd < dR){
          var push = DEFLECT_PUSH * (1 - dd / dR) * sf;
          ax.x += ddx / dd * push; ax.y += ddy / dd * push;
        }
      }
      if(Math.hypot(ship.x-ax.x, ship.y-ax.y) < ax.r + SHIP_RADIUS){
        if(ramArmed(ax.x, ax.y)){
          ax.hp -= ramDamage(); ax.hitT = 0.14;
          burst(ax.x, ax.y, 14, '111,232,255');
          if(ax.hp <= 0) killAsteroid(r);
          ramBleed();
        } else hitShip('rock');
      }
    }

    // camera follow — keep the ship near the middle; start scrolling well before it reaches an edge
    var margin = window.innerHeight * 0.4;
    var viewY = ship.y - window.scrollY;
    var maxScroll = Math.max(0, docH - window.innerHeight);
    var camTarget = window.scrollY;
    if(viewY < margin) camTarget = ship.y - margin;
    else if(viewY > window.innerHeight - margin) camTarget = ship.y - window.innerHeight + margin;
    camTarget = Math.max(0, Math.min(camTarget, maxScroll));
    if(Math.abs(camTarget - window.scrollY) > 0.5){
      var ease = 1 - Math.pow(1 - 0.22, sf);
      window.scrollTo(window.scrollX, window.scrollY + (camTarget - window.scrollY) * ease);
    }

    // both weapons run themselves — there is no fire input on any device.
    // They are on separate clocks on purpose: the phaser's chatter and the
    // torpedo's slow thump are meant to be heard as two different weapons.
    if(t - ship.lastShot > shotCooldown()){
      ship.lastShot = t;
      fireShot();
    }
    if(up.torp > 0 && t >= nextTorp){
      nextTorp = t + torpCooldown();
      fireTorpedo();
    }
    updateTorpedoes(dt, sf);
    updateWake(dt, t);
    updateArc(dt);

    for(var i=bullets.length-1;i>=0;i--){
      var b = bullets[i];
      b.x += b.vx * sf; b.y += b.vy * sf; b.life -= dt;
      if(b.life<=0 || b.x<0 || b.x>window.innerWidth || b.y<0 || b.y>docH){
        bullets.splice(i,1); continue;
      }
      if(boss && !boss.leaving && Math.hypot(b.x-boss.x, b.y-boss.y) < bossHitR()){
        boss.hp -= b.dmg; boss.hitT = 0.1;
        burst(b.x, b.y, 3, '255,209,102');
        if(boss.hp <= 0){ killBoss(); bullets.splice(i,1); continue; }
        if(!spendBullet(b, i, boss.id)) continue;
      }

      var spent = false;
      for(var m=aliens.length-1;m>=0;m--){
        var al2 = aliens[m];
        if(b.hits && b.hits.indexOf(al2.id) !== -1) continue;
        if(Math.hypot(b.x-al2.x, b.y-al2.y) < al2.r){
          al2.hp -= b.dmg; al2.hitT = 0.12;
          burst(b.x, b.y, 4, '127,227,236');
          if(al2.hp <= 0) killAlien(m);
          spent = !spendBullet(b, i, al2.id);
          break;
        }
      }
      if(spent) continue;

      for(var k=asteroids.length-1;k>=0;k--){
        var rock = asteroids[k];
        if(b.hits && b.hits.indexOf(rock.id) !== -1) continue;
        if(Math.hypot(b.x-rock.x, b.y-rock.y) < rock.r){
          rock.hp -= b.dmg; rock.hitT = 0.12;
          if(rock.hp <= 0) killAsteroid(k);
          else burst(b.x, b.y, 4);
          spendBullet(b, i, rock.id);
          break;
        }
      }
      // bullets pass over the page — the game no longer affects content
    }

    // A capital ship is announced before it decloaks, and while one is inbound
    // or alive the ordinary warbird timer holds — it brings its own escorts,
    // and the fight should be legible rather than buried under traffic.
    if(!boss && bossWarn <= 0 && t >= nextBossAt){
      bossWarn = BOSS_WARN;
      // "closing", not "decloaking": since the hail she might never decloak at
      // all, and a warning that announces something the player can still
      // prevent is a warning that lies about half the time
      if(warnEl){ warnEl.textContent = bossName(bossCount) + ' closing'; warnEl.classList.add('on'); }
    }
    if(bossWarn > 0){
      bossWarn -= dt;
      if(bossWarn <= 0){
        if(warnEl) warnEl.classList.remove('on');
        // the warning runs its full beat and then hands over to the hail — the
        // capital ship only decloaks if the answer is to let her
        openHail();
      }
    }
    if(boss) updateBoss(dt, sf, t);
    else if(bossWarn <= 0 && t >= nextAlienAt && aliens.length < alienMax(t)){
      spawnAlien();
      nextAlienAt = t + alienInterval(t) * (redAlert ? RED_ALERT_SPAWN : 1);
    }

    for(var ai=aliens.length-1; ai>=0; ai--){
      var al = aliens[ai];
      var AT = ALIEN_TYPES[al.kind];
      al.t += 0.03 * sf;
      if(al.hitT > 0) al.hitT = Math.max(0, al.hitT - dt);

      if(al.kind === 'stalker'){
        al.ttl -= dt;
        if(al.ttl > 0){
          // steers at the ship under thrust and drag rather than tracking it
          // exactly, so it overshoots and swings back — dodgeable, but only if
          // you keep turning
          var sdx = ship.x - al.x, sdy = ship.y - al.y, sd = Math.hypot(sdx, sdy) || 1;
          al.vx += (sdx / sd) * 0.06 * sf;
          al.vy += (sdy / sd) * 0.06 * sf;
        } else if(!al.fleeing){
          // out of fuel: turn away once, at speed, and leave for good
          al.fleeing = true;
          var fdx = al.x - ship.x, fdy = al.y - ship.y, fd = Math.hypot(fdx, fdy) || 1;
          al.vx = fdx / fd * AT.speed * 2.4;
          al.vy = fdy / fd * AT.speed * 2.4;
        }
        if(!al.fleeing){
          var sdrag = Math.pow(0.975, sf);
          al.vx *= sdrag; al.vy *= sdrag;
          var spd = Math.hypot(al.vx, al.vy), cap = AT.speed * 1.9;
          if(spd > cap){ al.vx = al.vx / spd * cap; al.vy = al.vy / spd * cap; }
        }
        al.x += al.vx * sf; al.y += al.vy * sf;
      } else {
        al.x += al.vx * sf;
        al.y = al.baseY + Math.sin(al.t) * AT.bob;
      }

      // gone: strafers off the far side, stalkers once they are clear of the band
      var gone = al.kind === 'stalker'
        ? (al.fleeing && (al.x < -al.r*3 || al.x > window.innerWidth + al.r*3 ||
                          al.y < window.scrollY - window.innerHeight*0.7 ||
                          al.y > window.scrollY + window.innerHeight*1.7))
        : (al.vx > 0 ? al.x > window.innerWidth + al.r*3 : al.x < -al.r*3);
      if(gone){ aliens.splice(ai,1); continue; }

      if(Math.hypot(ship.x-al.x, ship.y-al.y) < al.r + SHIP_RADIUS){
        // A shield used to ram straight through anything for free. It still
        // shrugs off a scout, but the armoured hulls only take a dent and are
        // shoved clear, so a live shield is no longer a licence to fly at
        // everything on the screen.
        if(shieldTime > 0){
          burst(al.x, al.y, 14, '0,194,255');
          al.hp -= 4; al.hitT = 0.12;
          if(al.hp <= 0){ killAlien(ai); continue; }
          var kdx = al.x - ship.x, kdy = al.y - ship.y, kd = Math.hypot(kdx, kdy) || 1;
          al.x += kdx / kd * (al.r + SHIP_RADIUS + 4);
          al.y += kdy / kd * (al.r + SHIP_RADIUS + 4);
          al.baseY = al.y;
          continue;
        }
        if(ship.invuln > 0) continue;
        if(ramArmed(al.x, al.y)){
          al.hp -= ramDamage(); al.hitT = 0.14;
          burst(al.x, al.y, 16, '111,232,255');
          ramBleed();
          if(al.hp <= 0){ killAlien(ai); continue; }
          // survived the shunt: shoved clear so it is not still inside you
          var sdx = al.x - ship.x, sdy = al.y - ship.y, sd = Math.hypot(sdx, sdy) || 1;
          al.x += sdx / sd * (al.r + SHIP_RADIUS + 6);
          al.y += sdy / sd * (al.r + SHIP_RADIUS + 6);
          al.baseY = al.y;
          continue;
        }
        burst(al.x, al.y, 14, AT.rgb); aliens.splice(ai,1); hitShip('fire'); continue;
      }

      if(t > al.nextShot){
        al.nextShot = t + alienCooldown(t) * AT.cd;
        var asp = alienBulletSpeed(t);
        // a stalker leads its target, which is what stops a long straight
        // burn away from it being the whole answer
        var tx = ship.x, ty = ship.y;
        if(al.kind === 'stalker'){
          var lead = Math.hypot(ship.x-al.x, ship.y-al.y) / asp;
          tx += ship.vx * lead * 0.55; ty += ship.vy * lead * 0.55;
        }
        var aimA = Math.atan2(ty-al.y, tx-al.x) + (Math.random()-0.5) * 2 * alienSpread(t);
        for(var sh=0; sh<AT.shots; sh++){
          var sa = aimA + (sh - (AT.shots - 1) / 2) * 0.2;
          alienBullets.push({
            x: al.x, y: al.y,
            vx: Math.cos(sa) * asp, vy: Math.sin(sa) * asp,
            life: 2.9, r: 3, rgb: AT.rgb
          });
        }
      }
    }

    for(var q=alienBullets.length-1; q>=0; q--){
      var ab = alienBullets[q];
      ab.x += ab.vx * sf; ab.y += ab.vy * sf; ab.life -= dt;
      if(ab.life<=0 || ab.x<0 || ab.x>window.innerWidth || ab.y<0 || ab.y>docH){ alienBullets.splice(q,1); continue; }
      if(Math.hypot(ab.x-ship.x, ab.y-ship.y) < SHIP_RADIUS + (ab.r || 3)){
        if(shieldTime > 0){ alienBullets.splice(q,1); burst(ab.x, ab.y, 6, '0,194,255'); continue; }
        alienBullets.splice(q,1); hitShip('fire');
      }
    }

    // loot: drifts, gets pulled in once you're close, and expires on its timer
    var mag = magnetRange();
    for(var pi=pickups.length-1; pi>=0; pi--){
      var pk = pickups[pi];
      pk.life -= dt;
      if(pk.life <= 0){ pickups.splice(pi,1); continue; }
      pk.t += 3 * dt;
      var dx = ship.x - pk.x, dy = ship.y - pk.y, dist = Math.hypot(dx, dy) || 1;
      if(dist < mag){
        var pull = 0.55 * (1 - dist / mag) * sf;
        pk.vx += dx / dist * pull * 3;
        pk.vy += dy / dist * pull * 3;
      }
      var pdrag = Math.pow(0.965, sf);
      pk.vx *= pdrag; pk.vy *= pdrag;
      pk.x += pk.vx * sf; pk.y += pk.vy * sf;
      if(dist < PICKUP_R){ collect(pk); pickups.splice(pi,1); }
    }

    for(var j=particles.length-1;j>=0;j--){
      var p = particles[j];
      p.x += p.vx * sf; p.y += p.vy * sf;
      var pd = Math.pow(0.94, sf);
      p.vx *= pd; p.vy *= pd;
      p.life -= 2.4 * dt;
      if(p.life<=0) particles.splice(j,1);
    }
  }

  // A piercing shot survives its hit and remembers what it already went
  // through, so it can never spend two frames chewing the same rock. Returns
  // true if the bullet lives on.
  function spendBullet(b, idx, targetId){
    if(b.pierce > 0){
      b.pierce--;
      (b.hits || (b.hits = [])).push(targetId);
      return true;
    }
    bullets.splice(idx, 1);
    return false;
  }

  // ── loot sprites ─────────────────────────────────────────────────────────
  // Drawn as honest pixel art: a fixed cell grid stamped out with fillRect, so
  // the drops read as 2D sprites against the vector rocks rather than blending
  // into them. A soft radial glow sits behind so they still carry on a dark page.
  var SPR = {
    // Dilithium. Both grades are the same bipyramid cut so they read as one
    // substance at a glance — the rich one is simply drawn a cell larger and
    // with a brighter core, which is the only difference the player needs.
    coin: {
      cell: 2,
      pal: { o:'#1b4a7a', h:'#e9fbff', c:'#6fe8ff', d:'#2f8fc7' },
      glow: '111,232,255',
      rows: ['...o...',
             '..oho..',
             '.ohcco.',
             'ohccddo',
             '.occdo.',
             '..odo..',
             '...o...']
    },
    gem: {
      cell: 3,
      pal: { o:'#3b1b7a', h:'#ffffff', c:'#9d7bff', d:'#5b3fd6' },
      glow: '157,123,255',
      rows: ['...o...',
             '..oho..',
             '.ohhco.',
             'ohhccdo',
             'ohccddo',
             '.occdo.',
             '..odo..']
    },
    // Hull repair. A cross, not a heart: the row it tops up is a hull-integrity
    // readout drawn as damaged plating, and a heart there would be the same
    // borrowed-from-another-game vocabulary the HUD icons were changed to shed.
    // (The pickup key stays 'heart' — it is internal, and renaming it would
    // touch nine call sites for nothing the player can see.)
    heart: {
      cell: 3,
      pal: { o:'#c01a41', h:'#ffb3c1', r:'#ff4d6d' },
      glow: '255,77,109',
      rows: ['..ooo..',
             '.ohrho.',
             'oohrhoo',
             'ohrrrho',
             'oohrhoo',
             '.ohrho.',
             '..ooo..']
    },
    // the two timed drops are drawn a cell larger than the gems, because they
    // are worth crossing the screen for and should look like it
    // deflector: a dish seen edge-on
    shield: {
      cell: 4,
      pal: { o:'#06456e', h:'#dcf4ff', c:'#00c2ff' },
      glow: '0,194,255',
      rows: ['.ooooo.',
             'ohhhhho',
             'ohcccco',
             'ohcccco',
             '.occco.',
             '..oco..',
             '...o...']
    },
    // overload: a charged emitter bolt
    rapid: {
      cell: 4,
      pal: { o:'#8a4a05', h:'#fff0cf', b:'#ffb347' },
      glow: '255,179,71',
      rows: ['...oo..',
             '..ohbo.',
             '.obbbo.',
             'obbbbbo',
             '..obbo.',
             '..obo..',
             '..oo...']
    }
  };

  function drawSprite(spr, cx, cy){
    var cell = spr.cell;
    var w = spr.rows[0].length * cell, h = spr.rows.length * cell;
    var x0 = Math.round(cx - w/2), y0 = Math.round(cy - h/2);

    // one cheap glow pass behind the sprite instead of shadowing every cell
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.75);
    g.addColorStop(0, 'rgba(' + spr.glow + ',.38)');
    g.addColorStop(1, 'rgba(' + spr.glow + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - w, cy - w, w*2, w*2);

    for(var r=0; r<spr.rows.length; r++){
      var row = spr.rows[r];
      for(var c=0; c<row.length; c++){
        var col = spr.pal[row[c]];
        if(!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x0 + c*cell, y0 + r*cell, cell, cell);
      }
    }
  }

  function drawPickup(p, camY){
    // last stretch of the timer is spent blinking, so nothing vanishes unwarned
    var fading = p.life < 1.6;
    if(fading){
      if(reduceMotion) ctx.globalAlpha = 0.4;        // dim rather than strobe
      else if(Math.floor(p.life * 9) % 2 === 0) return;
    }
    var spr = SPR[p.kind] || SPR.coin;
    drawSprite(spr, p.x, p.y - camY + Math.round(Math.sin(p.t) * 2));
    ctx.globalAlpha = 1;
  }

  // ── the flagship ─────────────────────────────────────────────────────────
  // Saucer, neck, engineering hull and two nacelles, drawn nose-along-+x so
  // the whole thing rotates with ship.angle. It is a silhouette rather than a
  // detailed hull on purpose: at this size, on a moving field, the only thing
  // that survives is the outline — a disc up front and two bars out back is
  // legible at a glance and unmistakably not an asteroid.
  // The hull is drawn a little larger than SHIP_RADIUS, which is deliberate
  // and the usual way round for this genre: the silhouette needs the room to
  // be legible, and a hitbox tighter than the art always reads as generous
  // rather than as a cheat.
  function shipShape(){
    // primary hull: the saucer, slightly wider across the beam than it is long
    ctx.beginPath(); ctx.ellipse(8.5, 0, 7.4, 8.8, 0, 0, Math.PI*2); ctx.stroke();
    // dorsal neck back to the secondary hull
    ctx.beginPath();
    ctx.moveTo(3.6, -2.6); ctx.lineTo(-3.4, -3.0);
    ctx.moveTo(3.6,  2.6); ctx.lineTo(-3.4,  3.0);
    ctx.stroke();
    // secondary hull, kept narrow so it does not crowd the nacelles
    ctx.beginPath(); ctx.ellipse(-8.5, 0, 5.8, 2.9, 0, 0, Math.PI*2); ctx.stroke();
    // pylons: the one part that has to stay visible for the hull to read as
    // three bodies rather than one mass, so they are long and well separated
    ctx.beginPath();
    ctx.moveTo(-8.2, -2.3); ctx.lineTo(-5.2, -9.6);
    ctx.moveTo(-8.2,  2.3); ctx.lineTo(-5.2,  9.6);
    ctx.stroke();
    // warp nacelles
    ctx.beginPath(); ctx.ellipse(-4.2, -11.2, 8.6, 2.0, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-4.2,  11.2, 8.6, 2.0, 0, 0, Math.PI*2); ctx.stroke();
  }

  // ── the warbirds ─────────────────────────────────────────────────────────
  // Three hulls, three silhouettes, not three tints: at speed, in a field of
  // forty rocks, shape is the only thing that reads. Each is drawn twice — a
  // dark outline, then the neon pass — the same treatment the asteroids get,
  // so they sit in the same world.
  function alienShape(al, AT){
    var R = al.r;
    // Wings are closed planes, never open polylines. An unclosed V reads as a
    // scribble at this size — the shape only becomes a wing once it has an
    // outline the eye can fill in.
    if(al.kind === 'lancer'){
      // battlecruiser: a command pod thrown forward on a boom, main hull aft,
      // and two broad wings carrying the pods it fires its fans from
      ctx.beginPath(); ctx.ellipse(R*0.82, 0, R*0.40, R*0.29, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R*0.45, -1.5); ctx.lineTo(-R*0.3, -2.1);
      ctx.moveTo(R*0.45,  1.5); ctx.lineTo(-R*0.3,  2.1);
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-R*0.7, 0, R*0.52, R*0.3, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-R*0.25, -R*0.2); ctx.lineTo(-R*0.35, -R*1.0);
      ctx.lineTo(-R*1.2, -R*0.85); ctx.lineTo(-R*1.0, -R*0.18); ctx.closePath();
      ctx.moveTo(-R*0.25,  R*0.2); ctx.lineTo(-R*0.35,  R*1.0);
      ctx.lineTo(-R*1.2,  R*0.85); ctx.lineTo(-R*1.0,  R*0.18); ctx.closePath();
      ctx.stroke();
    } else if(al.kind === 'stalker'){
      // bird-of-prey with the wings dropped into attack position: they rake
      // forward rather than back, which is the tell that this is the hull that
      // chases — readable a second before it arrives
      ctx.beginPath();
      ctx.moveTo(R, 0); ctx.lineTo(R*0.3, -R*0.24);
      ctx.lineTo(-R*0.55, -R*0.26); ctx.lineTo(-R*0.55, R*0.26);
      ctx.lineTo(R*0.3, R*0.24); ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R*0.18, -R*0.26); ctx.lineTo(R*0.02, -R*1.15);
      ctx.lineTo(-R*0.85, -R*0.92); ctx.lineTo(-R*0.55, -R*0.24); ctx.closePath();
      ctx.moveTo(R*0.18,  R*0.26); ctx.lineTo(R*0.02,  R*1.15);
      ctx.lineTo(-R*0.85,  R*0.92); ctx.lineTo(-R*0.55,  R*0.24); ctx.closePath();
      ctx.stroke();
    } else {
      // scout bird-of-prey, wings level for cruise
      ctx.beginPath();
      ctx.moveTo(R*0.95, 0); ctx.lineTo(R*0.28, -R*0.22);
      ctx.lineTo(-R*0.55, -R*0.24); ctx.lineTo(-R*0.55, R*0.24);
      ctx.lineTo(R*0.28, R*0.22); ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R*0.05, -R*0.24); ctx.lineTo(-R*0.18, -R*0.92);
      ctx.lineTo(-R*0.95, -R*0.86); ctx.lineTo(-R*0.58, -R*0.22); ctx.closePath();
      ctx.moveTo(R*0.05,  R*0.24); ctx.lineTo(-R*0.18,  R*0.92);
      ctx.lineTo(-R*0.95,  R*0.86); ctx.lineTo(-R*0.58,  R*0.22); ctx.closePath();
      ctx.stroke();
    }
  }

  // The tractor beam is the one upgrade whose effect was previously invisible
  // — loot simply drifted and you had to take it on trust. Drawing the lock
  // makes the range legible on the field, so the card's px figure stops being
  // the only way to know what you bought. Beams are drawn first, under the
  // whole field, so they never compete with a rock for attention.
  function drawTractor(camY){
    if(up.magnet <= 0 || !pickups.length) return;
    var mag = magnetRange(), pulse = 0.5 + 0.5 * Math.sin(gameTime * 5);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -gameTime * 34;
    for(var i=0;i<pickups.length;i++){
      var pk = pickups[i];
      var d = Math.hypot(ship.x - pk.x, ship.y - pk.y);
      if(d >= mag || d < PICKUP_R) continue;
      // fades in as the lock tightens, so the beam is strongest on the crystal
      // that is actually about to arrive
      var a = (1 - d / mag) * 0.5 * (0.6 + 0.4 * pulse);
      ctx.strokeStyle = 'rgba(111,232,255,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - camY);
      ctx.lineTo(pk.x, pk.y - camY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // the emitter ring itself, so the radius reads even with nothing in range
    ctx.strokeStyle = 'rgba(111,232,255,' + (0.05 + 0.04 * pulse).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(ship.x, ship.y - camY, mag, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // The trail is drawn oldest-first as overlapping soft blobs that shrink and
  // fade together, which is what makes a string of circles read as one cooling
  // ribbon of plasma rather than as a row of dots. Orange, the torpedo's
  // colour: both of them are ordnance, and neither is the pink that means
  // alert or the cyan that means you.
  // One gradient, baked into an offscreen sprite the first time it is needed
  // and then blitted per blob. A maxed vent holds ~90 blobs, and building 90
  // radial gradients every frame is real work on a phone — the sprite turns
  // the whole trail into 90 drawImage calls, which is not.
  // null = not built yet, false = this environment cannot build one. Nothing
  // in here may throw: it runs inside draw(), and an exception there takes the
  // whole frame loop down with it.
  var wakeSprite = null;
  function getWakeSprite(){
    if(wakeSprite !== null) return wakeSprite;
    wakeSprite = false;
    try {
      var S = 64, c = document.createElement('canvas');
      if(!c || !c.getContext) return wakeSprite;
      c.width = c.height = S;
      var g2 = c.getContext('2d');
      if(!g2 || !g2.createRadialGradient) return wakeSprite;
      var grd = g2.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
      grd.addColorStop(0,    'rgba(255,209,168,0.50)');
      grd.addColorStop(0.55, 'rgba(255,140,60,0.32)');
      grd.addColorStop(1,    'rgba(255,80,20,0)');
      g2.fillStyle = grd;
      g2.fillRect(0, 0, S, S);
      wakeSprite = c;
    } catch(e){ /* falls back to flat blobs below */ }
    return wakeSprite;
  }

  function drawWake(camY){
    if(!wake.length) return;
    var spr = getWakeSprite(), vh = window.innerHeight;
    ctx.save();
    for(var i=0;i<wake.length;i++){
      var w = wake[i], y = w.y - camY;
      // the trail runs off behind the camera on a long burn; skipping what is
      // not on screen is most of the cost on a maxed vent
      if(y < -WAKE_R * 2 || y > vh + WAKE_R * 2) continue;
      var f = w.life / w.max;
      var r = WAKE_R * (0.45 + 0.55 * f);
      ctx.globalAlpha = f;
      if(spr){
        ctx.drawImage(spr, w.x - r, y - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = 'rgba(255,140,60,.28)';
        ctx.beginPath(); ctx.arc(w.x, y, r, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // The deflector has the same problem the tractor beam had: an upgrade whose
  // whole effect is that something did not happen to you is invisible. Drawing
  // the field, and lighting the arc that is actually doing the shoving, makes
  // it legible without a HUD chip. Cyan, because it is the player's own hull.
  function drawDeflector(camY){
    if(up.deflector <= 0) return;
    var R = deflectRange(), y = ship.y - camY;
    var pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(gameTime * 3.2);
    ctx.save();
    ctx.strokeStyle = 'rgba(111,232,255,' + (0.07 + 0.05 * pulse).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ship.x, y, R, 0, Math.PI*2); ctx.stroke();
    // the arc facing whatever is currently inside the field brightens, so the
    // push reads as a contact rather than as a decorative circle
    for(var i=0;i<asteroids.length;i++){
      var ax = asteroids[i];
      var dx = ax.x - ship.x, dy = ax.y - ship.y, d = Math.hypot(dx, dy);
      var dR = R + ax.r;
      if(d >= dR) continue;
      var a = Math.atan2(dy, dx), w = 0.45;
      ctx.strokeStyle = 'rgba(125,249,255,' + ((1 - d / dR) * 0.55).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ship.x, y, R, a - w, a + w); ctx.stroke();
    }
    ctx.restore();
  }

  // Red alert. Drawn on the canvas rather than in CSS because it has to sit
  // under the HUD but over the field, and because the pulse has to run off the
  // same clock as everything else — a CSS animation would keep flashing while
  // the run is paused on an upgrade card.
  function drawRedAlert(){
    var W = window.innerWidth, H = window.innerHeight;
    var pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(gameTime * 4.4);
    var a = 0.16 + pulse * 0.20;
    var g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.34,
                                     W/2, H/2, Math.max(W,H) * 0.72);
    g.addColorStop(0, 'rgba(255,45,120,0)');
    g.addColorStop(1, 'rgba(255,45,120,' + a.toFixed(3) + ')');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // a hard hairline right on the bezel, which is what makes it read as an
    // alert condition rather than a wash
    ctx.strokeStyle = 'rgba(255,45,120,' + (0.3 + pulse * 0.45).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.restore();
  }

  function draw(){
    var camY = window.scrollY;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    drawTractor(camY);
    drawWake(camY);
    drawDeflector(camY);

    asteroids.forEach(function(ax){
      var sp = ax.special ? SPECIALS[ax.special] : null;
      ctx.save();
      ctx.translate(ax.x, ax.y - camY);
      ctx.rotate(ax.rot);
      ctx.beginPath();
      ax.pts.forEach(function(p,i){ if(i===0) ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(4,2,8,.66)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = ax.hitT > 0 ? '#ffffff' : (sp ? sp.stroke : '#c77dff');
      ctx.shadowColor = sp ? sp.glow : '#7b5cff';
      // rare rocks breathe rather than sit still, so they pick themselves out
      // of a field of forty at a glance
      ctx.shadowBlur = sp ? 14 + Math.sin(gameTime * 5 + ax.pulse) * 9 : 12;
      ctx.lineWidth = sp ? 2.4 : 1.7;
      ctx.stroke();
      if(sp){
        // a core ring, counter-rotating with the shell, marks it as cargo
        ctx.rotate(-ax.rot * 2);
        ctx.beginPath();
        ctx.arc(0, 0, ax.r * 0.42, 0, Math.PI*2);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    if(boss){
      var b = boss;
      // the telegraph: the hull whites out and swells for the beat before a
      // charge commits, which is the whole reason a charge is survivable
      var winding = b.phase === 'charge' && !b.charged;
      // the telegraph is the only warning a charge is survivable at all, so
      // under reduced motion it holds at full rather than disappearing
      var flash = winding ? (reduceMotion ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(gameTime * 18))) : 0;
      var col = b.hitT > 0 || flash > 0.6 ? '#ffffff' : (b.enraged ? '#ff4d6d' : '#c77dff');
      var glow = b.enraged ? '#ff2fb9' : '#7b5cff';
      ctx.save();
      ctx.translate(b.x, b.y - camY);
      ctx.scale(1 + flash * 0.06, 1 + flash * 0.06);
      ctx.lineJoin = 'round';

      // eight-sided hull, drawn dark then neon
      var i, a;
      for(var pass=0; pass<2; pass++){
        ctx.strokeStyle = pass ? col : 'rgba(4,2,8,.7)';
        ctx.lineWidth = pass ? 2.4 : 4.6;
        ctx.shadowColor = pass ? glow : 'transparent';
        ctx.shadowBlur = pass ? 18 : 0;
        ctx.beginPath();
        for(i=0;i<8;i++){
          a = b.rot + i / 8 * Math.PI * 2;
          var rr = b.r * (i % 2 ? 0.78 : 1);
          if(i === 0) ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr);
          else ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);
        }
        ctx.closePath(); ctx.stroke();
      }

      // counter-rotating inner ring and a core that opens up when enraged
      ctx.rotate(-b.rot * 2.4);
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, b.r * 0.56, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      for(i=0;i<4;i++){
        a = i / 4 * Math.PI * 2;
        ctx.moveTo(Math.cos(a)*b.r*0.56, Math.sin(a)*b.r*0.56);
        ctx.lineTo(Math.cos(a)*b.r*0.92, Math.sin(a)*b.r*0.92);
      }
      ctx.stroke();
      ctx.fillStyle = b.enraged ? 'rgba(255,77,109,.5)' : 'rgba(199,125,255,.32)';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * (0.22 + 0.05 * Math.sin(gameTime * (b.enraged ? 9 : 4))), 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    aliens.forEach(function(al){
      var AT = ALIEN_TYPES[al.kind];
      ctx.save();
      ctx.translate(al.x, al.y - camY);
      // every hull is directional now, so all three point along their heading
      // rather than only the one that chases
      ctx.rotate(al.kind === 'stalker' ? Math.atan2(al.vy, al.vx) : (al.vx < 0 ? Math.PI : 0));
      ctx.strokeStyle = 'rgba(4,2,8,.66)';
      ctx.lineWidth = 3.4;
      alienShape(al, AT);
      ctx.strokeStyle = al.hitT > 0 ? '#ffffff' : AT.stroke;
      ctx.shadowColor = AT.stroke;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.7;
      alienShape(al, AT);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    alienBullets.forEach(function(ab){
      var rgb = ab.rgb || '255,122,99';
      ctx.save();
      ctx.fillStyle = 'rgb(' + rgb + ')';
      ctx.shadowColor = 'rgb(' + rgb + ')';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ab.x, ab.y - camY, ab.r || 3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    pickups.forEach(function(p){ drawPickup(p, camY); });

    // invulnerable frames blink the hull; under reduced motion the hull is
    // drawn every frame and the ghosting is carried by alpha instead
    var invBlink = ship.invuln > 0 && !reduceMotion && Math.floor(ship.invuln*13)%2 !== 0;
    if(!invBlink){
      if(reduceMotion && ship.invuln > 0) ctx.globalAlpha = 0.45;
      ctx.save();
      ctx.translate(ship.x, ship.y - camY);
      ctx.rotate(ship.angle);
      // impulse wash off both nacelles rather than one exhaust, so thrust
      // reads on a hull whose engines are out on the wingtips
      if(ship.thrusting){
        var flameLen = 7 + Math.random()*9;
        ctx.strokeStyle = '#7fd4ff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-12.6, -11.2); ctx.lineTo(-12.6 - flameLen, -11.2);
        ctx.moveTo(-12.6,  11.2); ctx.lineTo(-12.6 - flameLen,  11.2);
        ctx.stroke();
      }
      ctx.lineJoin = 'round';
      // dark underpass first, so the hull holds together against a bright rock
      ctx.strokeStyle = 'rgba(4,2,8,.7)';
      ctx.lineWidth = 3.6;
      shipShape();
      // an overloaded phaser array runs the hull hot, which is the only tell
      // the player needs that the drop is still live
      var hullCol = rapidTime > 0 ? '#ffb347' : '#00f0ff';
      ctx.strokeStyle = hullCol;
      ctx.shadowColor = hullCol;
      // a tight glow: at 1.6px line weight anything above ~9 fills the gaps
      // between saucer, pylons and nacelles and the hull reads as one blob
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      shipShape();
      // bussard collectors: the one warm accent on an otherwise cold hull
      ctx.shadowColor = '#ff4d6d';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff7a90';
      ctx.beginPath(); ctx.arc(3.6, -11.2, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(3.6,  11.2, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // The bow shield. Drawn around the heading the ship is *travelling*, not
    // the way it is pointing, because that is what ramArmed() tests — a shield
    // painted on the nose while the hull drifts sideways would be a lie.
    var rc = ramCharge();
    if(rc > 0.25){
      var rHead = Math.atan2(ship.vy, ship.vx);
      var full = rc >= 1;
      ctx.save();
      ctx.translate(ship.x, ship.y - camY);
      ctx.rotate(rHead);
      ctx.strokeStyle = full ? 'rgba(125,249,255,.95)'
                             : 'rgba(111,232,255,' + (0.12 + 0.5 * (rc - 0.25) / 0.75).toFixed(3) + ')';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = full ? 12 : 4;
      ctx.lineWidth = full ? 3 : 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, SHIP_RADIUS + 8, -RAM_ARC, RAM_ARC);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // The arc: a ring at the exact radius that burns, plus a jagged bolt to
    // everything currently inside it. The ring has to be honest to the pixel —
    // this is a card whose whole risk is knowing where the edge is — so it is
    // drawn from arcRange() rather than from anything eyeballed. Cyan, because
    // it is the ship's own field.
    if(up.arc > 0){
      var aR = arcRange(), aY = ship.y - camY;
      var aPulse = reduceMotion ? 0.6 : 0.6 + 0.4 * Math.sin(gameTime * 9);
      ctx.save();
      ctx.strokeStyle = 'rgba(0,240,255,' + (0.16 + 0.14 * aPulse).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ship.x, aY, aR, 0, Math.PI*2); ctx.stroke();
      if(arcOn.length){
        ctx.strokeStyle = 'rgba(125,249,255,.9)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.6;
        for(var q=0;q<arcOn.length;q++){
          var o = arcOn[q];
          // arcOn is last frame's burn list, and a frame can pass without the
          // sim running — a refit card, a blurred tab — so re-check the range
          // here rather than drawing a bolt at something that has since moved,
          // died, or was never there. Cheap, and it is the only thing that
          // keeps the lightning honest to the ring it comes out of.
          var bx = o.x - ship.x, by = o.y - ship.y;
          if(Math.hypot(bx, by) > aR + (o.r || 0) + 6) continue;
          var bd = Math.hypot(bx, by) || 1;
          // three kinked segments along the line, jittered off it — a straight
          // line reads as a tractor beam, and that is a different upgrade
          ctx.beginPath();
          ctx.moveTo(ship.x, aY);
          for(var seg=1; seg<=3; seg++){
            var f = seg / 3;
            var jit = seg === 3 ? 0 : (Math.random() - 0.5) * bd * 0.22;
            ctx.lineTo(ship.x + bx * f - by / bd * jit,
                       aY + by * f + bx / bd * jit);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // Ablative armour reads as two plates on the hull rather than a ring,
    // because a ring is what the shield drop already is and the two have to be
    // told apart at a glance: the ring means untouchable, the plates mean one
    // hit in hand. They vanish the moment the plate is spent.
    if(armourReady){
      ctx.save();
      ctx.translate(ship.x, ship.y - camY);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = 'rgba(125,249,255,.7)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      // On the flanks, not the bow. Ramming Speed draws its own shield across
      // the nose at almost exactly this radius, and a build carrying both put
      // two cyan arcs on top of each other — one overlay that reads as neither.
      var pr = SHIP_RADIUS + 6;
      ctx.beginPath(); ctx.arc(0, 0, pr,  1.05,  2.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, pr, -2.2,  -1.05); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    if(shieldTime > 0){
      // the ring thins out as the shield runs down, so it reads without the HUD
      var pulse = (shieldTime < 3.5 && !reduceMotion)
        ? (0.35 + 0.4 * Math.abs(Math.sin(gameTime * 7)))
        : (shieldTime < 3.5 ? 0.5 : 0.75);
      ctx.save();
      ctx.strokeStyle = 'rgba(0,194,255,' + pulse.toFixed(2) + ')';
      ctx.shadowColor = '#00c2ff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y - camY, SHIP_RADIUS + 10, 0, Math.PI*2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Phasers draw as short beam segments along their own heading rather than
    // as dots. It costs nothing — the velocity is already there — and it is
    // the single clearest signal that this weapon is a beam and the slow
    // orange thing beside it is not.
    var beamCol = rapidTime > 0 ? '#ffc978' : '#7df9ff';
    ctx.strokeStyle = beamCol;
    ctx.shadowColor = rapidTime > 0 ? '#ffa726' : '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    bullets.forEach(function(b){
      var L = Math.hypot(b.vx, b.vy) || 1;
      var ux = b.vx / L, uy = b.vy / L, len = 9;
      ctx.beginPath();
      ctx.moveTo(b.x - ux*len, b.y - camY - uy*len);
      ctx.lineTo(b.x, b.y - camY);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 0;

    // Photon torpedoes: a slow orange core with a tail, so they are never
    // mistaken for a phaser even in a crowded frame.
    torpedoes.forEach(function(tp){
      var y = tp.y - camY;
      var L = Math.hypot(tp.vx, tp.vy) || 1;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,140,60,.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tp.x - tp.vx/L*16, y - tp.vy/L*16);
      ctx.lineTo(tp.x, y);
      ctx.stroke();
      var pulse = 1 + Math.sin(tp.t * 22) * 0.18;
      ctx.shadowColor = '#ff8c3c';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffd9a8';
      ctx.beginPath(); ctx.arc(tp.x, y, tp.r * pulse, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(tp.x, y, tp.r * 0.45, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // The lock. A torpedo that ignores the rock in front of it looks broken
    // unless you can see what it is going for instead, so every held target
    // wears a bracket in the torpedo's own orange. Deduped, because two
    // torpedoes on one warbird should not draw two brackets at double opacity.
    if(torpedoes.length){
      var locked = [];
      for(var li=0;li<torpedoes.length;li++){
        var lt = torpedoes[li].target;
        if(lt && locked.indexOf(lt) === -1) locked.push(lt);
      }
      if(locked.length){
        var spin = reduceMotion ? 0 : gameTime * 1.6;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,140,60,.85)';
        ctx.shadowColor = '#ff8c3c';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        for(var lk=0;lk<locked.length;lk++){
          var o = locked[lk];
          var lr = (o === boss ? bossHitR() : o.r) + 9;
          // one path per corner: arcs sharing a path get joined by a chord
          for(var c=0;c<4;c++){
            var a0 = spin + c * Math.PI/2 - 0.34;
            ctx.beginPath();
            ctx.arc(o.x, o.y - camY, lr, a0, a0 + 0.68);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Detonation shockwaves: two rings, the outer one lagging, which is what
    // sells the blast as a pressure front rather than a circle appearing.
    shockwaves.forEach(function(sw){
      var y = sw.y - camY, a = Math.max(0, sw.life);
      ctx.save();
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(255,45,120,' + (a * 0.85).toFixed(2) + ')';
      ctx.lineWidth = 2.4 * a + 0.6;
      ctx.beginPath(); ctx.arc(sw.x, y, sw.r, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,217,168,' + (a * 0.5).toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sw.x, y, sw.r * 0.72, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    });

    particles.forEach(function(p){
      ctx.fillStyle = 'rgba(' + (p.col || '184,65,42') + ',' + p.life.toFixed(2) + ')';
      ctx.fillRect(p.x-1.5, p.y - camY - 1.5, 3, 3);
    });

    if(redAlert) drawRedAlert();
  }

  function loop(now){
    raf = null;
    if(!active || gameOver) return;   // a late frame must not keep scoring
    if(typeof now !== 'number') now = performance.now();

    var dt = (now - lastFrame) / 1000;
    lastFrame = now;
    // a frame that took longer than a blink means the tab was throttled, the
    // machine slept, or an upgrade card was up — never simulate the gap
    if(!(dt > 0)) dt = 0;
    if(dt > 0.05) dt = 0.05;

    if(!isPaused()){
      gameTime += dt;
      update(dt);
    }
    draw();
    if(gameOver) return;              // died this frame: paint it, then stop
    raf = requestAnimationFrame(loop);
  }

  function autoHideTip(){
    if(!active || destroyed.indexOf(tipEl) !== -1) return;
    destroyed.push(tipEl);
    tipEl.style.transition = 'opacity .6s ease';
    tipEl.style.opacity = '0';
    tipEl.style.pointerEvents = 'none';
  }

  function start(){
    if(active) return;
    active = true;
    destroyed = [];
    gameOver = false;
    levelOpen = false; hailOpen = false;
    if(overEl) overEl.classList.remove('on');
    if(levelEl) levelEl.classList.remove('on');
    if(pauseEl) pauseEl.classList.remove('on');
    if(hailEl) hailEl.classList.remove('on');
    resize();
    resetRun();
    document.body.classList.add('astro-active');
    document.documentElement.style.scrollBehavior = 'auto';
    homeStick();
    if(isCoarse && tipEl) tipEl.textContent = 'drag to steer · phasers fire themselves · ← leave the bridge';
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', autoPause);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', blockClicks, true);
    tipTimer = setTimeout(autoHideTip, 5000);
    lastFrame = performance.now();
    raf = requestAnimationFrame(loop);
    if(document.hidden) autoPause();
  }

  function stop(){
    if(!active) return;
    active = false;
    if(raf) cancelAnimationFrame(raf);
    raf = null;
    clearTimeout(tipTimer);
    levelOpen = false; autoPaused = false; hailOpen = false;
    document.body.classList.remove('astro-active');
    document.body.classList.remove('astro-paused');
    document.body.classList.remove('astro-red-alert');
    redAlert = false;
    document.documentElement.style.scrollBehavior = '';
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', autoPause);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('click', blockClicks, true);
    keys = {};
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    if(levelEl) levelEl.classList.remove('on');
    if(pauseEl) pauseEl.classList.remove('on');
    if(hailEl) hailEl.classList.remove('on');
    if(bossBarEl) bossBarEl.classList.remove('on');
    if(warnEl) warnEl.classList.remove('on');
    boss = null; bossWarn = 0;
    homeStick();
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    destroyed.forEach(function(el){
      el.style.transition = '';
      el.style.transform = '';
      el.style.opacity = '';
      el.style.pointerEvents = '';
    });
    destroyed = [];
  }

  if(isCoarse) document.documentElement.classList.add('coarse');
  if (avail) avail.addEventListener('click', start);
  exitBtn.addEventListener('click', stop);
  var playLink = document.getElementById('play-game');
  if(playLink) playLink.addEventListener('click', function(e){ e.preventDefault(); start(); });
  var launchBtn = document.getElementById('game-launch');
  if(launchBtn) launchBtn.addEventListener('click', start);

  // B launches, so the game is still reachable with the keyboard alone — the
  // launcher is hidden below 600px and while the game is running. Upgrades no
  // longer have a key of their own: they come to you when the XP rail fills.
  window.addEventListener('keydown', function(e){
    if(active) return;
    if(e.key !== 'b' && e.key !== 'B') return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target.tagName;
    if(t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
    e.preventDefault();
    start();
  });
})();
