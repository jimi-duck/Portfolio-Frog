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
  var ROT_SPEED = 0.06, THRUST = 0.155, BULLET_SPEED = 11, SHOT_COOLDOWN = 0.255, BOUNCE = 0.4;
  // A hard floor on the automatic gun, applied after every multiplier rather
  // than before one. Rapid fire used to be a x0.4 on top of an already-clamped
  // cooldown, which is how a maxed ship reached 180 bullets a second and simply
  // deleted the field. Nothing may now fire faster than this.
  var MIN_COOLDOWN = 0.075;
  // Extra barrels are no longer free. Each level of Spread Shot multiplies the
  // cooldown, so the fan trades rate for coverage instead of adding both.
  var SPREAD_DRAG = 1.22, RAPID_MULT = 0.55;
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
  var ship, bullets, particles, destroyed, asteroids, pickups;

  // ── the run clock ────────────────────────────────────────────────────────
  // gameTime only advances on frames we actually simulate, so switching tabs,
  // sleeping the laptop or opening an upgrade card costs nothing and gains
  // nothing. Everything — score, difficulty, cooldowns, drop timers — reads it.
  var gameTime = 0, lastFrame = 0, autoPaused = false, levelOpen = false;
  function isPaused(){ return autoPaused || levelOpen; }

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
  // The saucer count is the one curve with no ceiling. Everything else flattens
  // out inside five minutes, and a run whose pressure stops climbing is a run
  // you can settle into and hold forever — which is what this one was doing.
  function alienMax(t){ return Math.min(6, 1 + Math.floor(t / 60)); }
  function alienHpScale(t){ return 1 + Math.min(1.7, t / 125); }
  // Rocks harden slowly, so Heavy Rounds still earns its slot at minute four
  // instead of one-shotting the entire field from level three onwards.
  function rockHp(r, t){
    return r >= 22 ? Math.min(5, 2 + Math.floor(t / 95)) : (t > 150 ? 2 : 1);
  }

  // ── the saucer roster ───────────────────────────────────────────────
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
  // the answer to a dreadnought is never simply to run away from it.
  var BOSS_FIRST = 110, BOSS_GAP = 68, BOSS_WARN = 2.6, BOSS_R = 44;
  var BOSS_NAMES = ['Dreadnought', 'Leviathan', 'Behemoth', 'Warlord'];
  var boss = null, bossWarn = 0, bossCount = 0, bossKills = 0, nextBossAt = BOSS_FIRST;
  var speedMult = 1.35, rockSpawnAcc = 0;
  var gameOver = false;
  var overEl = document.getElementById('astroOver');
  var bossBarEl  = document.getElementById('astroBoss');
  var bossFillEl = document.getElementById('astroBossFill');
  var bossNameEl = document.getElementById('astroBossName');
  var warnEl     = document.getElementById('astroWarn');
  var finalEl = document.getElementById('astroFinal');
  var finalSubEl = document.getElementById('astroFinalSub');
  var hintEl = document.getElementById('astroRestartHint');

  // ── drops ────────────────────────────────────────────────────────────────
  // XP that evaporates before it can be reached punishes the player for the
  // fight that produced it, so gems outlive the old coins and the collection
  // radius is generous by default — hoovering loot up is the loop, not a skill
  // check. Gem Magnet then widens what is already a comfortable baseline.
  var COIN_TTL = 10, HEART_TTL = 9, POWER_TTL = 10;
  var MAGNET_R = 165, PICKUP_R = SHIP_RADIUS + 13;
  var lives = START_LIVES;

  // ── XP and levels ────────────────────────────────────────────────────────
  // Gems are the only currency now and they buy exactly one thing: the next
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
  var up = { fire:0, thrust:0, spread:0, pierce:0, dmg:0, magnet:0, range:0, guard:0 };
  var nextGuard = 0;

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
    for(var i=0;i<MAX_LIVES;i++) s += '<i class="px-heart' + (i < lives ? ' on' : '') + '"></i>';
    return s;
  }

  // syncHud runs on every simulated frame, so each field is compared before it
  // is written — the lives row in particular is markup, and rebuilding it 60
  // times a second for a value that changes twice a run is pure layout churn.
  var hudLast = { score:-1, lives:-1, xp:-1, need:-1, level:-1, shield:-1, rapid:-1, boss:-1 };

  function syncHud(){
    var sc = currentScore();
    if(scoreEl && sc !== hudLast.score){ scoreEl.textContent = 'Score: ' + sc; hudLast.score = sc; }
    if(livesEl && lives !== hudLast.lives){ livesEl.innerHTML = heartMarkup(); hudLast.lives = lives; }

    var need = xpNeed(level);
    if(xp !== hudLast.xp || need !== hudLast.need){
      if(xpFillEl) xpFillEl.style.width = Math.max(0, Math.min(100, xp / need * 100)).toFixed(1) + '%';
      if(xpNumEl) xpNumEl.textContent = xp + ' / ' + need;
      hudLast.xp = xp; hudLast.need = need;
    }
    if(lvlNumEl && level !== hudLast.level){ lvlNumEl.textContent = 'LV ' + level; hudLast.level = level; }

    // the timers only ever need whole seconds, so they are only touched when
    // that whole second actually ticks over
    var sSec = Math.ceil(shieldTime), rSec = Math.ceil(rapidTime);
    if(shieldEl && sSec !== hudLast.shield){
      shieldEl.textContent = 'Shield ' + sSec + 's';
      shieldEl.classList.toggle('on', shieldTime > 0);
      hudLast.shield = sSec;
    }
    if(rapidEl && rSec !== hudLast.rapid){
      rapidEl.textContent = 'Rapid ' + rSec + 's';
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

  function hitShip(){
    // a live shield is flat invincibility for its whole ten seconds — it does
    // not burn out on contact, which is the entire point of chasing the rock
    if(gameOver || ship.invuln > 0 || shieldTime > 0) return;
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
      Math.floor(gameTime) + 's survived · level ' + level +
      (bossKills ? ' · ' + bossKills + ' boss' + (bossKills > 1 ? 'es' : '') + ' downed' : '');
    if(hintEl) hintEl.textContent = isCoarse ? 'tap to play again' : 'press any key to play again';
    if(overEl) overEl.classList.add('on');
    // dying mid-fight left the hull bar and the inbound warning stranded on top
    // of the game-over card until the next run reset them
    if(bossBarEl) bossBarEl.classList.remove('on');
    if(warnEl) warnEl.classList.remove('on');
    closeLevel(true);
    syncHud();
  }

  // wipe the run back to zero — clock, XP, upgrades, buffs, rocks and saucers
  function resetRun(){
    bullets = []; particles = []; aliens = []; alienBullets = []; pickups = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
    boss = null; bossWarn = 0; bossCount = 0; bossKills = 0; nextBossAt = BOSS_FIRST;
    if(bossBarEl) bossBarEl.classList.remove('on');
    if(warnEl) warnEl.classList.remove('on');
    gameTime = 0; lastFrame = performance.now();
    speedMult = speedMultAt(0); rockSpawnAcc = 0;
    lives = START_LIVES;
    xp = 0; level = 1; pendingLevels = 0;
    shieldTime = 0; rapidTime = 0; nextGuard = 0;
    for(var k in up) up[k] = 0;
    autoPaused = false;
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
  // Nine entries, three offered per level. Every line a card prints is computed
  // from the live stat functions rather than written out, so a card can never
  // promise a number the ship does not actually get.

  // Both weapon cards move the same underlying number, and Spread Shot moves it
  // the wrong way, so they quote it through one helper. Whole figures read
  // cleaner, but it drops to a decimal when rounding would print the same
  // number twice and make a real change look like a no-op.
  function rateLine(fireL, spreadL){
    var a = 1 / shotCooldown(), b = 1 / cooldownWith(fireL, spreadL, rapidTime > 0);
    var dp = Math.round(a) === Math.round(b) ? 1 : 0;
    return 'Fire rate ' + a.toFixed(dp) + '/s \u2794 ' + b.toFixed(dp) + '/s';
  }

  var UPGRADES = [
    { id:'fire', name:'Rapid Cannon', max:6,
      lines:function(){ return [rateLine(up.fire + 1, up.spread)]; } },
    { id:'thrust', name:'Ion Thrusters', max:6,
      lines:function(){ return ['+14% thrust', '+10% turn rate']; } },
    // The one card that costs something. It reads the loss out loud on the
    // second line rather than burying it, because a hidden downside on the
    // strongest card in the deck is just a trap.
    { id:'spread', name:'Spread Shot', max:3,
      lines:function(){ return [barrels(up.spread) + ' shot' + (up.spread ? 's' : '') +
                                ' \u2794 ' + barrels(up.spread + 1) + ' shots',
                                rateLine(up.fire, up.spread + 1)]; } },
    { id:'pierce', name:'Piercing Laser', max:3,
      lines:function(){ return ['Shots punch through ' + (up.pierce + 1) +
                                ' target' + (up.pierce ? 's' : '')]; } },
    { id:'dmg', name:'Heavy Rounds', max:4,
      lines:function(){ return ['Damage ' + bulletDamage() + ' \u2794 ' + (bulletDamage() + 1)]; } },
    { id:'range', name:'Long Barrel', max:3,
      lines:function(){ return ['+12% shot speed', '+15% shot range']; } },
    { id:'magnet', name:'Gem Magnet', max:4,
      lines:function(){ return ['Pickup pull ' + Math.round(magnetRange()) + 'px \u2794 ' +
                                Math.round(MAGNET_R * (1 + 0.35 * (up.magnet + 1))) + 'px']; } },
    { id:'guard', name:'Auto Aegis', max:3,
      lines:function(){
        return up.guard
          ? ['Shield every ' + guardEvery(up.guard) + 's \u2794 ' + guardEvery(up.guard + 1) + 's']
          : ['A ' + GUARD_TIME + 's shield, free, every ' + guardEvery(1) + 's'];
      },
      // the first one should land while the choice is still fresh in mind
      apply:function(){ up.guard++; nextGuard = gameTime + 2; } },
    { id:'life', name:'Repair Kit', max:99,
      avail:function(){ return lives < MAX_LIVES; },
      lines:function(){ return ['Lives ' + lives + ' \u2794 ' + (lives + 1), 'Applied at once']; },
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
  var levelValEl  = document.getElementById('astroLevelVal');
  var levelChoices = [];

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
      btn.innerHTML =
        '<span class="au-n">' + u.name + '</span>' +
        '<span class="au-l' + (lvl === 0 ? ' is-new' : '') + '">' + badge + '</span>' +
        '<span class="au-d">' + u.lines().map(function(s){ return '<span>' + s + '</span>'; }).join('') + '</span>' +
        '<span class="au-k">Press ' + (i + 1) + '</span>';
      // pointerdown, not click: on a phone the 300ms a synthetic click can cost
      // is 300ms of a frozen field, and the overlay is the only thing on screen
      btn.addEventListener('pointerdown', function(e){ e.preventDefault(); choose(i); });
      levelGridEl.appendChild(btn);
    });
  }

  function openLevelUp(){
    if(!active || gameOver || levelOpen) return;
    // everything is maxed and health is full: there is nothing to offer, so
    // bank the level as score instead of showing an empty card
    if(rollChoices().length === 0){ pendingLevels = 0; bonus += 400; return; }
    levelOpen = true;
    keys = {}; pad.mag = 0;
    homeStick();
    if(levelValEl) levelValEl.textContent = level;
    renderChoices();
    if(levelEl) levelEl.classList.add('on');
    document.body.classList.add('astro-paused');
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
      if(levelValEl) levelValEl.textContent = level;
      renderChoices();
      syncHud();
      return;
    }
    pendingLevels = 0;
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
    lastFrame = performance.now();
    // a beat of grace so you aren't dropped straight back onto a rock
    if(!silent && ship) ship.invuln = Math.max(ship.invuln, 1.4);
  }

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
    if(!active || gameOver || autoPaused || levelOpen) return;
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
    if(!levelOpen) document.body.classList.remove('astro-paused');
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
       e.target.closest('#astroLevel') || e.target.closest('#astroPause')) return;
    e.preventDefault(); e.stopPropagation();
  }

  function onKeyDown(e){
    if(e.code === 'Escape'){ stop(); return; }
    if(gameOver){ e.preventDefault(); restart(); return; }
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
    if(levelOpen) return;
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
    // A saucer used to be a guaranteed extra life, and with three of them in
    // the sky that was more health than the field could ever take back — most
    // of the reason a careless run never actually ended. Health is a roll now;
    // gems are the reliable prize, which keeps saucers worth hunting.
    if(Math.random() < T.heart) dropPickup(al.x, al.y, 'heart');
    else for(var g=0; g<T.gems; g++) dropPickup(al.x, al.y, 'gem');
    aliens.splice(m, 1);
    bonus += T.bonus;
  }

  // ── the dreadnought ──────────────────────────────────────────────────────
  // Hull and cadence both scale with how many have already been beaten, so the
  // fourth one is a genuinely different fight from the first rather than the
  // same fight with a longer bar.
  function bossHpFor(n){ return 180 + n * 110; }
  // Shots land on the armoured core rather than the full silhouette, so a wide
  // fan no longer connects with every barrel at once.
  function bossHitR(){ return BOSS_R * 0.82; }
  // If a build cannot break the hull inside this, the dreadnought breaks off
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
    // The payout is the point: a late run cannot reach the next upgrade off
    // rocks alone under the new XP curve, so the dreadnought is the way back
    // into the level economy. Standing off and ignoring it costs you the run.
    for(var i=0; i<4 + Math.min(4, b.index); i++) dropPickup(b.x, b.y, 'gem');
    dropPickup(b.x, b.y, 'heart');
    dropPickup(b.x, b.y, Math.random() < 0.5 ? 'shield' : 'rapid');
    bonus += 900 + b.index * 350;
    bossKills++;
    boss = null;
    nextBossAt = gameTime + bossGapFor(bossCount);
    nextAlienAt = gameTime + alienInterval(gameTime) * 0.6;
    if(bossBarEl) bossBarEl.classList.remove('on');
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
      } else hitShip();
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
      // gems are XP now, and XP is the only thing that opens an upgrade card
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

  function update(dt){
    var t = gameTime;
    var sf = dt * 60; if(sf > MAX_STEP) sf = MAX_STEP;
    speedMult = speedMultAt(t);

    if(shieldTime > 0) shieldTime = Math.max(0, shieldTime - dt);
    if(rapidTime > 0)  rapidTime  = Math.max(0, rapidTime  - dt);
    // Auto Aegis: a free shield on a fixed cadence once it has been picked
    if(up.guard > 0 && t >= nextGuard){
      nextGuard = t + guardEvery(up.guard);
      shieldTime = Math.max(shieldTime, GUARD_TIME);
      burst(ship.x, ship.y, 14, '0,194,255');
    }
    syncHud();

    // the field thickens continuously, and kills are topped back up on a short
    // stagger rather than instantly, so a cleared pocket stays cleared a moment
    var target = rockTargetAt(t);
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
      if(Math.hypot(ship.x-ax.x, ship.y-ax.y) < ax.r + SHIP_RADIUS) hitShip();
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

    // the guns run themselves — there is no fire input on any device
    if(t - ship.lastShot > shotCooldown()){
      ship.lastShot = t;
      fireShot();
    }

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

    // A dreadnought is announced before it arrives, and while one is inbound or
    // alive the ordinary saucer timer holds — the boss brings its own escorts,
    // and the fight should be legible rather than buried under traffic.
    if(!boss && bossWarn <= 0 && t >= nextBossAt){
      bossWarn = BOSS_WARN;
      if(warnEl){ warnEl.textContent = bossName(bossCount) + ' inbound'; warnEl.classList.add('on'); }
    }
    if(bossWarn > 0){
      bossWarn -= dt;
      if(bossWarn <= 0){
        if(warnEl) warnEl.classList.remove('on');
        spawnBoss();
      }
    }
    if(boss) updateBoss(dt, sf, t);
    else if(bossWarn <= 0 && t >= nextAlienAt && aliens.length < alienMax(t)){
      spawnAlien();
      nextAlienAt = t + alienInterval(t);
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
        burst(al.x, al.y, 14, AT.rgb); aliens.splice(ai,1); hitShip(); continue;
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
        alienBullets.splice(q,1); hitShip();
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
    coin: {
      cell: 2,
      pal: { o:'#a06614', h:'#fff3c4', g:'#ffd166', d:'#c9942f' },
      glow: '255,209,102',
      rows: ['..ooo..',
             '.ohhgo.',
             'ohhgggo',
             'ohgggdo',
             'ohgggdo',
             '.oggdo.',
             '..ooo..']
    },
    gem: {
      cell: 3,
      pal: { o:'#a06614', h:'#fff3c4', g:'#ffd166', d:'#c9942f' },
      glow: '255,209,102',
      rows: ['...o...',
             '..oho..',
             '.ohggo.',
             'ohgggdo',
             '.oggdo.',
             '..odo..',
             '...o...']
    },
    heart: {
      cell: 3,
      pal: { o:'#c01a41', h:'#ffb3c1', r:'#ff4d6d' },
      glow: '255,77,109',
      rows: ['.oo.oo.',
             'orhrrro',
             'orhrrro',
             '.orrro.',
             '..oro..',
             '...o...']
    },
    // the two timed drops are drawn a cell larger than the gems, because they
    // are worth crossing the screen for and should look like it
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
    if(fading && Math.floor(p.life * 9) % 2 === 0) return;
    var spr = SPR[p.kind] || SPR.coin;
    drawSprite(spr, p.x, p.y - camY + Math.round(Math.sin(p.t) * 2));
  }

  // The three hulls get three silhouettes, not three tints: at speed, in a
  // field of forty rocks, shape is the only thing that reads. Each is drawn
  // twice — a dark outline, then the neon pass — the same treatment the
  // asteroids get, so they sit in the same world.
  function alienShape(al, AT){
    var R = al.r;
    if(al.kind === 'lancer'){
      // a gun platform: broad hull with a barrel pod out either side
      ctx.beginPath(); ctx.ellipse(0, 2, R, R*0.40, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, R*0.42, Math.PI, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-R*0.95, 2); ctx.lineTo(-R*1.35, -5); ctx.lineTo(-R*1.35, 7);
      ctx.moveTo( R*0.95, 2); ctx.lineTo( R*1.35, -5); ctx.lineTo( R*1.35, 7);
      ctx.stroke();
    } else if(al.kind === 'stalker'){
      // an arrowhead, nose along its own heading, so you can see where it
      // is committed to before it gets there
      ctx.beginPath();
      ctx.moveTo(R, 0); ctx.lineTo(-R*0.6, -R*0.75);
      ctx.lineTo(-R*0.2, 0); ctx.lineTo(-R*0.6, R*0.75);
      ctx.closePath(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 2, R, R*0.42, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, R*0.5, Math.PI, 0); ctx.stroke();
    }
  }

  function draw(){
    var camY = window.scrollY;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

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
      var flash = winding ? 0.5 + 0.5 * Math.abs(Math.sin(gameTime * 18)) : 0;
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
      if(al.kind === 'stalker') ctx.rotate(Math.atan2(al.vy, al.vx));
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

    if(ship.invuln <= 0 || Math.floor(ship.invuln*13)%2===0){
      ctx.save();
      ctx.translate(ship.x, ship.y - camY);
      ctx.rotate(ship.angle);
      if(ship.thrusting){
        var flameLen = 8 + Math.random()*10;
        ctx.strokeStyle = '#f4a13e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(-6 - flameLen, 0);
        ctx.lineTo(-6, 3);
        ctx.stroke();
      }
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-11, -9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-11, 9);
      ctx.closePath();
      // rapid fire runs the hull hot, which is the only tell the player needs
      ctx.strokeStyle = rapidTime > 0 ? '#ffb347' : '#00f5d4';
      ctx.shadowColor = rapidTime > 0 ? '#ffa726' : '#00f5d4';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    if(shieldTime > 0){
      // the ring thins out as the shield runs down, so it reads without the HUD
      var pulse = shieldTime < 3.5 ? (0.35 + 0.4 * Math.abs(Math.sin(gameTime * 7))) : 0.75;
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

    ctx.shadowColor = rapidTime > 0 ? '#ffa726' : '#ff2d78';
    ctx.shadowBlur = 11;
    ctx.fillStyle = rapidTime > 0 ? '#ffc978' : '#ff8ab5';
    bullets.forEach(function(b){
      ctx.beginPath();
      ctx.arc(b.x, b.y - camY, 4.5, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    particles.forEach(function(p){
      ctx.fillStyle = 'rgba(' + (p.col || '184,65,42') + ',' + p.life.toFixed(2) + ')';
      ctx.fillRect(p.x-1.5, p.y - camY - 1.5, 3, 3);
    });
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
    levelOpen = false;
    if(overEl) overEl.classList.remove('on');
    if(levelEl) levelEl.classList.remove('on');
    if(pauseEl) pauseEl.classList.remove('on');
    resize();
    resetRun();
    document.body.classList.add('astro-active');
    document.documentElement.style.scrollBehavior = 'auto';
    homeStick();
    if(isCoarse && tipEl) tipEl.textContent = 'drag anywhere to steer · guns are automatic · ← back to site';
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
    levelOpen = false; autoPaused = false;
    document.body.classList.remove('astro-active');
    document.body.classList.remove('astro-paused');
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
