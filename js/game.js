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
  var ROT_SPEED = 0.06, THRUST = 0.155, BULLET_SPEED = 11, SHOT_COOLDOWN = 0.24, BOUNCE = 0.4;
  var SHIP_RADIUS = 9, INVULN = 1.1, RESPAWN_INVULN = 2.2;
  var START_LIVES = 3, MAX_LIVES = 5;
  var START_ROCKS = 24, MAX_ROCKS = 52;
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
  function speedMultAt(t){ return Math.min(4.6, 1.30 + t * 0.016); }
  function rockTargetAt(t){ return Math.min(MAX_ROCKS, START_ROCKS + Math.floor(t / 11)); }
  function alienInterval(t){ return Math.max(6.5, 18 - t * 0.06); }
  function alienCooldown(t){ return Math.max(0.75, 1.7 - t * 0.008); }
  function alienSpread(t){   return Math.max(0.08, 0.26 - t * 0.0013); }
  function alienBulletSpeed(t){ return Math.min(5.2, 3.1 + t * 0.012); }
  function alienMax(t){ return t > 130 ? 3 : (t > 60 ? 2 : 1); }
  function alienHp(t){ return Math.min(4, 2 + Math.floor(t / 90)); }
  function rockHp(r){ return r >= 22 ? 2 : 1; }

  var ALIEN_FIRST = 7, ALIEN_SPEED = 1.5, ALIEN_R = 15, ALIEN_BONUS = 150;
  var aliens = [], alienBullets = [], nextAlienAt = ALIEN_FIRST, bonus = 0;
  var speedMult = 1.35, rockSpawnAcc = 0;
  var gameOver = false;
  var overEl = document.getElementById('astroOver');
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
  function xpNeed(l){ return 4 + (l - 1) * 5; }

  // ── timed power-ups ──────────────────────────────────────────────────────
  // These never pause anything: they land on the ship the instant it touches
  // them and run down on the clock in the HUD.
  var POWER_TIME = 10;
  var shieldTime = 0, rapidTime = 0;

  // ── permanent upgrades ───────────────────────────────────────────────────
  var up = { fire:0, thrust:0, spread:0, pierce:0, dmg:0, magnet:0, range:0, guard:0 };
  var nextGuard = 0;

  function rawCooldown(l){ return Math.max(0.07, SHOT_COOLDOWN * Math.pow(0.86, l)); }
  function shotCooldown(){ return rawCooldown(up.fire) * (rapidTime > 0 ? 0.4 : 1); }
  function barrels(l){ return 1 + l * 2; }
  function bulletDamage(){ return 1 + up.dmg; }
  function bulletSpeed(){ return BULLET_SPEED * (1 + 0.12 * up.range); }
  function bulletLife(){  return BULLET_LIFE  * (1 + 0.15 * up.range); }
  function thrustPower(){ return THRUST * (1 + 0.14 * up.thrust); }
  function rotPower(){ return ROT_SPEED * (1 + 0.10 * up.thrust); }
  function magnetRange(){ return MAGNET_R * (1 + 0.35 * up.magnet); }
  function guardEvery(l){ return 34 - l * 8; }        // 26s → 18s → 10s
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
    shield: { stroke:'#7fe3ec', glow:'#7fe3ec', rgb:'127,227,236' },
    rapid:  { stroke:'#ffb347', glow:'#ffa726', rgb:'255,179,71' }
  };
  var SPECIAL_CHANCE = 0.06, MAX_SPECIAL = 2;
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
             r:r, pts:pts, hp: special ? 4 : rockHp(r), hitT: 0,
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

  function spawnAlien(){
    var fromLeft = Math.random() < 0.5;
    var y = window.scrollY + window.innerHeight * (0.2 + Math.random() * 0.6);
    aliens.push({
      id: ++uid,
      x: fromLeft ? -ALIEN_R * 2 : window.innerWidth + ALIEN_R * 2,
      y: y, baseY: y,
      vx: (fromLeft ? 1 : -1) * ALIEN_SPEED,
      t: Math.random() * Math.PI * 2,
      hp: alienHp(gameTime), hitT: 0,
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
  function dropRockLoot(x, y){
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
  var hudLast = { score:-1, lives:-1, xp:-1, need:-1, level:-1, shield:-1, rapid:-1 };

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
      Math.floor(gameTime) + 's survived · level ' + level;
    if(hintEl) hintEl.textContent = isCoarse ? 'tap to play again' : 'press any key to play again';
    if(overEl) overEl.classList.add('on');
    closeLevel(true);
    syncHud();
  }

  // wipe the run back to zero — clock, XP, upgrades, buffs, rocks and saucers
  function resetRun(){
    bullets = []; particles = []; aliens = []; alienBullets = []; pickups = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
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
  var UPGRADES = [
    { id:'fire', name:'Rapid Cannon', max:6,
      lines:function(){
        var a = 1/rawCooldown(up.fire), b = 1/rawCooldown(up.fire + 1);
        // whole numbers read cleaner, but drop to a decimal when rounding would
        // print the same figure twice and make a real gain look like a no-op
        var dp = Math.round(a) === Math.round(b) ? 1 : 0;
        return ['Fire rate ' + a.toFixed(dp) + '/s \u2794 ' + b.toFixed(dp) + '/s'];
      } },
    { id:'thrust', name:'Ion Thrusters', max:6,
      lines:function(){ return ['+14% thrust', '+10% turn rate']; } },
    { id:'spread', name:'Spread Shot', max:3,
      lines:function(){ return [barrels(up.spread) + ' shot' + (up.spread ? 's' : '') +
                                ' \u2794 ' + barrels(up.spread + 1) + ' shots', 'Fires in a fan']; } },
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
    burst(al.x, al.y, 18, '127,227,236');
    dropPickup(al.x, al.y, 'heart');
    aliens.splice(m, 1);
    bonus += ALIEN_BONUS;
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
    var n = barrels(up.spread), step = 0.12;
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
      burst(ship.x, ship.y, 14, '127,227,236');
    }
    syncHud();

    // the field thickens continuously, and kills are topped back up on a short
    // stagger rather than instantly, so a cleared pocket stays cleared a moment
    var target = rockTargetAt(t);
    rockSpawnAcc += dt;
    if(asteroids.length < target && rockSpawnAcc > 0.35){
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
      var spent = false;
      for(var m=aliens.length-1;m>=0;m--){
        var al2 = aliens[m];
        if(b.hits && b.hits.indexOf(al2.id) !== -1) continue;
        if(Math.hypot(b.x-al2.x, b.y-al2.y) < ALIEN_R){
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

    // saucers arrive on a timer that tightens as the run goes on
    if(t >= nextAlienAt && aliens.length < alienMax(t)){
      spawnAlien();
      nextAlienAt = t + alienInterval(t);
    }

    for(var ai=aliens.length-1; ai>=0; ai--){
      var al = aliens[ai];
      al.t += 0.03 * sf;
      al.x += al.vx * sf;
      al.y = al.baseY + Math.sin(al.t) * 26;
      if(al.hitT > 0) al.hitT = Math.max(0, al.hitT - dt);
      // drifted off the far side
      if(al.vx > 0 ? al.x > window.innerWidth + ALIEN_R*3 : al.x < -ALIEN_R*3){ aliens.splice(ai,1); continue; }
      if(Math.hypot(ship.x-al.x, ship.y-al.y) < ALIEN_R + SHIP_RADIUS){
        // a shielded ship rams straight through the saucer instead of trading
        if(shieldTime > 0 || ship.invuln > 0){
          if(shieldTime > 0){ burst(al.x, al.y, 14, '127,227,236'); killAlien(ai); }
          continue;
        }
        burst(al.x, al.y, 14, '127,227,236'); aliens.splice(ai,1); hitShip(); continue;
      }
      if(t > al.nextShot){
        al.nextShot = t + alienCooldown(t);
        var asp = alienBulletSpeed(t);
        var aimA = Math.atan2(ship.y-al.y, ship.x-al.x) + (Math.random()-0.5) * 2 * alienSpread(t);
        alienBullets.push({
          x: al.x, y: al.y,
          vx: Math.cos(aimA) * asp, vy: Math.sin(aimA) * asp,
          life: 2.9
        });
      }
    }

    for(var q=alienBullets.length-1; q>=0; q--){
      var ab = alienBullets[q];
      ab.x += ab.vx * sf; ab.y += ab.vy * sf; ab.life -= dt;
      if(ab.life<=0 || ab.x<0 || ab.x>window.innerWidth || ab.y<0 || ab.y>docH){ alienBullets.splice(q,1); continue; }
      if(Math.hypot(ab.x-ship.x, ab.y-ship.y) < SHIP_RADIUS + 3){
        if(shieldTime > 0){ alienBullets.splice(q,1); burst(ab.x, ab.y, 6, '127,227,236'); continue; }
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
      pal: { o:'#0d5a63', h:'#e6feff', c:'#7fe3ec' },
      glow: '127,227,236',
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
      ctx.strokeStyle = 'rgba(10,4,20,.6)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = ax.hitT > 0 ? '#ffffff' : (sp ? sp.stroke : '#c77dff');
      ctx.shadowColor = sp ? sp.glow : '#a855f7';
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

    aliens.forEach(function(al){
      ctx.save();
      ctx.translate(al.x, al.y - camY);
      // dark outline first, then the neon pass — same treatment as the asteroids
      ctx.strokeStyle = 'rgba(2,16,18,.6)';
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.ellipse(0, 2, ALIEN_R, ALIEN_R*0.42, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, ALIEN_R*0.5, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = al.hitT > 0 ? '#ffffff' : '#7fe3ec';
      ctx.shadowColor = '#7fe3ec';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.ellipse(0, 2, ALIEN_R, ALIEN_R*0.42, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, ALIEN_R*0.5, Math.PI, 0); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    alienBullets.forEach(function(ab){
      ctx.save();
      ctx.fillStyle = '#ff7a63';
      ctx.shadowColor = '#ff5a46';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ab.x, ab.y - camY, 3, 0, Math.PI*2); ctx.fill();
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
      ctx.strokeStyle = rapidTime > 0 ? '#ffb347' : '#39ff14';
      ctx.shadowColor = rapidTime > 0 ? '#ffa726' : '#39ff14';
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
      ctx.strokeStyle = 'rgba(127,227,236,' + pulse.toFixed(2) + ')';
      ctx.shadowColor = '#7fe3ec';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y - camY, SHIP_RADIUS + 10, 0, Math.PI*2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.shadowColor = rapidTime > 0 ? '#ffa726' : '#ff4d6d';
    ctx.shadowBlur = 9;
    ctx.fillStyle = rapidTime > 0 ? '#ffc978' : '#ff7a90';
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
