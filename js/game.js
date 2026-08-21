(function(){
  var avail   = document.querySelector('.avail');
  var canvas  = document.getElementById('astroCanvas');
  var ctx     = canvas.getContext('2d');
  var exitBtn = document.getElementById('astroExit');
  var tipEl   = document.getElementById('astroTip');
  var scoreEl = document.getElementById('astroScore');
  var coinEl  = document.getElementById('astroCoins');
  var livesEl = document.getElementById('astroLives');
  var shieldEl= document.getElementById('astroShield');
  var coinNumEl = coinEl ? coinEl.querySelector('span') : null;
  var tipTimer = null;

  var NOSE_OFFSET = 17;

  // Base handling. All timings are in SECONDS and all motion is scaled by a
  // per-frame step factor, so the run plays the same on a 60Hz and a 120Hz
  // screen — and a stalled frame can never teleport the field.
  var ROT_SPEED = 0.06, THRUST = 0.155, BULLET_SPEED = 9, SHOT_COOLDOWN = 0.36, BOUNCE = 0.4;
  var SHIP_RADIUS = 9, INVULN = 1.1, RESPAWN_INVULN = 2.2;
  var START_LIVES = 3, MAX_LIVES = 5;
  var START_ROCKS = 40, MAX_ROCKS = 78;
  var BULLET_LIFE = 1.35, MAX_STEP = 3;

  var active = false, raf = null, keys = {}, docH = 0;
  // analog touch input: joystick steers + throttles, fire button shoots
  var pad = { angle: 0, mag: 0, fire: false };
  var isCoarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  var ship, bullets, particles, destroyed, asteroids, pickups;

  // ── the run clock ────────────────────────────────────────────────────────
  // gameTime only advances on frames we actually simulate, so switching tabs,
  // sleeping the laptop or opening upgrades costs nothing and gains
  // nothing. Everything — score, difficulty, cooldowns, drop timers — reads it.
  var gameTime = 0, lastFrame = 0, autoPaused = false, shopOpen = false;
  function isPaused(){ return autoPaused || shopOpen; }

  // ── continuous progression ───────────────────────────────────────────────
  // No levels: every curve below is a smooth function of gameTime, so the
  // pressure rises every single second rather than in visible steps.
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

  // ── economy ──────────────────────────────────────────────────────────────
  var COIN_TTL = 6.5, HEART_TTL = 8, MAGNET_R = 105, PICKUP_R = SHIP_RADIUS + 13;
  var coins = 0, lives = START_LIVES, shieldTime = 0;

  // ── upgrades ─────────────────────────────────────────────────────────────
  var up = { weapon: 0, speed: 0, shield: 0 };
  var MAX_WEAPON = 6, MAX_SPEED = 6;
  // Upgrades are on call rather than on a schedule — P on a keyboard, the pad
  // button on a phone — so it never interrupts a run the player is winning.

  function costWeapon(){ return 16 + up.weapon * 13; }
  function costSpeed(){  return 13 + up.speed  * 10; }
  function costShield(){ return 11 + up.shield * 6; }
  function shieldGrant(){ return 20 + up.shield * 5; }
  function shotCooldown(){ return Math.max(0.09, SHOT_COOLDOWN * Math.pow(0.87, up.weapon)); }
  function bulletDamage(){ return 1 + Math.floor(up.weapon / 2); }
  function thrustPower(){ return THRUST * (1 + 0.13 * up.speed); }
  function rotPower(){ return ROT_SPEED * (1 + 0.10 * up.speed); }

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

  function makeAsteroid(mode){
    var r = 14 + Math.random()*14;
    var n = 8 + Math.floor(Math.random()*3);
    var pts = [];
    for(var i=0;i<n;i++){
      var a = (i/n)*Math.PI*2;
      var rad = r * (0.7 + Math.random()*0.5);
      pts.push([Math.cos(a)*rad, Math.sin(a)*rad]);
    }
    // sf is the rock's own share of the current speed band; velocity is derived
    // from it every frame, so the whole field speeds up as the run wears on
    // without anyone ever getting a sudden shove.
    var sf = 0.4 + Math.random()*0.8;
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
      // opening field: scattered down the page, but never inside the current view
      var tries = 0;
      do {
        x = Math.random()*vw; y = Math.random()*docH; tries++;
      } while(tries < 25 && y > top - 60 && y < top + vh + 60);
      ang = Math.random()*Math.PI*2;
    }

    return { x:x, y:y, ang:ang, sf:sf,
             vx: Math.cos(ang)*sf*speedMult, vy: Math.sin(ang)*sf*speedMult,
             r:r, pts:pts, hp: rockHp(r), hitT: 0,
             rot: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.02,
             entering: entering };
  }

  function spawnSafeAsteroid(){
    // reject openings that send a rock straight down the player's throat
    var a, tries = 0;
    do {
      a = makeAsteroid('edge'); tries++;
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
  function dropPickup(x, y, kind){
    var a = Math.random()*Math.PI*2, sp = 0.4 + Math.random()*0.9;
    pickups.push({
      x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, kind:kind,
      value: kind === 'gem' ? 5 : 1,
      life: kind === 'heart' ? HEART_TTL : COIN_TTL,
      max:  kind === 'heart' ? HEART_TTL : COIN_TTL,
      t: Math.random()*Math.PI*2
    });
  }
  function dropRockLoot(x, y){
    dropPickup(x, y, Math.random() < 0.14 ? 'gem' : 'coin');
  }

  function currentScore(){
    return Math.floor(gameTime * 10) + bonus;
  }

  function heartMarkup(){
    var s = '';
    for(var i=0;i<MAX_LIVES;i++) s += '<i class="px-heart' + (i < lives ? ' on' : '') + '"></i>';
    return s;
  }

  function syncHud(){
    if(scoreEl) scoreEl.textContent = 'Score: ' + currentScore();
    if(coinNumEl) coinNumEl.textContent = coins;
    if(livesEl) livesEl.innerHTML = heartMarkup();
    if(shieldEl){
      if(shieldTime > 0){
        shieldEl.textContent = 'Shield ' + Math.ceil(shieldTime) + 's';
        shieldEl.classList.add('on');
      } else {
        shieldEl.classList.remove('on');
      }
    }
  }

  function hitShip(){
    if(gameOver || ship.invuln > 0) return;
    if(shieldTime > 0){
      // the shield eats the hit and burns out with it
      shieldTime = 0;
      ship.invuln = INVULN;
      burst(ship.x, ship.y, 20, '127,227,236');
      syncHud();
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
      Math.floor(gameTime) + 's survived · ' + coins + ' coins banked';
    if(hintEl) hintEl.textContent = isCoarse ? 'tap to play again' : 'press any key to play again';
    if(overEl) overEl.classList.add('on');
    closeShop(true);
    syncHud();
  }

  // wipe the run back to zero — clock, economy, upgrades, rocks and saucers
  function resetRun(){
    bullets = []; particles = []; aliens = []; alienBullets = []; pickups = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
    gameTime = 0; lastFrame = performance.now();
    speedMult = speedMultAt(0); rockSpawnAcc = 0;
    coins = 0; lives = START_LIVES; shieldTime = 0;
    up.weapon = 0; up.speed = 0; up.shield = 0;
    autoPaused = false;
    closeShop(true);
    resetShip(INVULN);
    spawnAsteroids();
    syncHud();
  }

  function restart(){
    if(!gameOver) return;
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    resetRun();
    raf = requestAnimationFrame(loop);
  }

  // ── upgrades ──────────────────────────────────────────────────────
  var shopEl      = document.getElementById('astroShop');
  var shopCoinsEl = document.getElementById('astroShopCoins');
  var shopGoEl    = document.getElementById('astroShopGo');
  var shopHintEl  = document.getElementById('astroShopHint');
  var shopBtnEl   = document.getElementById('astroShopBtn');
  var shopOpts    = shopEl ? Array.prototype.slice.call(shopEl.querySelectorAll('.as-opt')) : [];

  var SHOP_SPEC = {
    weapon: {
      cost: costWeapon,
      max:  function(){ return up.weapon >= MAX_WEAPON; },
      lvl:  function(){ return 'Lv ' + up.weapon; },
      sub:  function(){ return ''; },
      // only ever list what the next level actually moves — damage steps on
      // every other level, so its line simply isn't there in between
      lines: function(){
        if(up.weapon >= MAX_WEAPON) return ['Fully upgraded'];
        var rNow  = 1 / shotCooldown();
        var rNext = 1 / Math.max(0.09, SHOT_COOLDOWN * Math.pow(0.87, up.weapon + 1));
        // whole numbers read cleaner, but drop to a decimal when rounding would
        // print the same figure twice and make a real gain look like a no-op
        var dp = Math.round(rNow) === Math.round(rNext) ? 1 : 0;
        var out = ['Fire Rate ' + rNow.toFixed(dp) + '/s \u2794 ' + rNext.toFixed(dp) + '/s'];
        var dmgNow = bulletDamage(), dmgNext = 1 + Math.floor((up.weapon + 1) / 2);
        if(dmgNext !== dmgNow) out.push('Damage ' + dmgNow + ' \u2794 ' + dmgNext);
        return out;
      }
    },
    speed: {
      cost: costSpeed,
      max:  function(){ return up.speed >= MAX_SPEED; },
      lvl:  function(){ return 'Lv ' + up.speed; },
      sub:  function(){ return ''; },
      lines: function(){
        if(up.speed >= MAX_SPEED) return ['Fully upgraded'];
        return ['+13% Thrust', '+10% Turn Rate'];
      }
    },
    shield: {
      cost: costShield,
      max:  function(){ return false; },
      lvl:  function(){ return '\u00d7' + up.shield; },
      sub:  function(){ return '(consumed after one hit)'; },
      lines: function(){ return [shieldGrant() + 's Duration \u00b7 Absorbs One Hit']; }
    }
  };

  function renderShop(){
    if(!shopEl) return;
    if(shopCoinsEl) shopCoinsEl.textContent = coins;
    shopOpts.forEach(function(btn){
      var kind = btn.getAttribute('data-up'), spec = SHOP_SPEC[kind];
      if(!spec) return;
      var maxed = spec.max(), cost = spec.cost(), lines = spec.lines(), sub = spec.sub();
      var lvlEl = btn.querySelector('.as-l'), subEl = btn.querySelector('.as-sub');
      var d1 = btn.querySelector('.as-d1'), d2 = btn.querySelector('.as-d2');
      var cvEl = btn.querySelector('.as-cv'), cEl = btn.querySelector('.as-c');
      if(lvlEl) lvlEl.textContent = spec.lvl();
      if(subEl){ subEl.textContent = sub; subEl.hidden = !sub; }
      if(d1) d1.textContent = lines[0] || '';
      if(d2){ d2.textContent = lines[1] || ''; d2.hidden = !lines[1]; }
      if(cvEl) cvEl.textContent = maxed ? 'MAX' : cost;
      if(cEl) cEl.classList.toggle('is-max', maxed);
      var locked = maxed || coins < cost;
      btn.disabled = locked;
      btn.classList.toggle('poor', !maxed && coins < cost);
      btn.classList.toggle('maxed', maxed);
    });
  }

  function buy(kind){
    var spec = SHOP_SPEC[kind];
    if(!spec || !shopOpen || spec.max()) return;
    var cost = spec.cost();
    if(coins < cost) return;
    coins -= cost;
    if(kind === 'shield'){ shieldTime += shieldGrant(); up.shield++; }
    else up[kind]++;
    renderShop();
    syncHud();
  }

  function openShop(){
    if(!active || shopOpen || gameOver || autoPaused) return;
    shopOpen = true;
    keys = {}; pad.mag = 0; pad.fire = false;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
    if(upgradeEl) upgradeEl.classList.remove('on');
    if(shopEl) shopEl.classList.add('on');
    document.body.classList.add('astro-paused');
    renderShop();
  }

  function closeShop(silent){
    if(!shopOpen){
      if(shopEl) shopEl.classList.remove('on');
      if(!autoPaused) document.body.classList.remove('astro-paused');
      return;
    }
    shopOpen = false;
    if(shopEl) shopEl.classList.remove('on');
    if(!autoPaused) document.body.classList.remove('astro-paused');
    lastFrame = performance.now();
    // a beat of grace so you aren't dropped straight back onto a rock
    if(!silent && ship) ship.invuln = Math.max(ship.invuln, 1.4);
  }

  // ── tab / focus handling ─────────────────────────────────────────────────
  // Leaving the tab used to keep the wall-clock score ticking while the frames
  // stopped, so you came back to a jumped score and a field that lurched. Now
  // the run halts the moment focus goes and waits for a deliberate resume.
  var pauseEl = document.getElementById('astroPause');

  function autoPause(){
    // upgrades are already a halt of their own — stacking a second pause under
    // it would leave Enter closing the shop into a still-frozen field
    if(!active || gameOver || autoPaused || shopOpen) return;
    autoPaused = true;
    keys = {}; pad.mag = 0; pad.fire = false;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
    if(upgradeEl) upgradeEl.classList.remove('on');
    if(pauseEl && !shopOpen) pauseEl.classList.add('on');
    document.body.classList.add('astro-paused');
  }

  function autoResume(){
    if(!autoPaused) return;
    autoPaused = false;
    if(pauseEl) pauseEl.classList.remove('on');
    if(!shopOpen) document.body.classList.remove('astro-paused');
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
       e.target.closest('#astroShop') || e.target.closest('#astroPause') ||
       e.target.closest('#astroUpgrade') || e.target.closest('#astroShopBtn')) return;
    e.preventDefault(); e.stopPropagation();
  }

  function onKeyDown(e){
    if(e.code === 'Escape'){
      if(shopOpen){ e.preventDefault(); closeShop(); return; }
      stop(); return;
    }
    if(gameOver){ e.preventDefault(); restart(); return; }
    if(shopOpen){
      e.preventDefault();
      if(e.code === 'Digit1' || e.code === 'Numpad1') buy('weapon');
      else if(e.code === 'Digit2' || e.code === 'Numpad2') buy('speed');
      else if(e.code === 'Digit3' || e.code === 'Numpad3') buy('shield');
      else if(e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyP') closeShop();
      return;
    }
    if(autoPaused){ e.preventDefault(); autoResume(); return; }
    if(e.code === 'KeyP'){ e.preventDefault(); openShop(); return; }
    if(e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='Space'){
      e.preventDefault();
      keys[e.code] = true;
    }
  }
  function onKeyUp(e){ keys[e.code] = false; }

  // ── touch pads ──
  var stickEl = document.getElementById('astroStick');
  var knobEl  = document.getElementById('astroKnob');
  var fireEl  = document.getElementById('astroFire');
  var upgradeEl = document.getElementById('astroUpgrade');
  var stickId = null;

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
    knobEl.style.transform = 'translate(' + kx.toFixed(1) + 'px,' + ky.toFixed(1) + 'px)';
  }
  function stickDown(e){
    if(gameOver){ e.preventDefault(); restart(); return; }
    if(autoPaused){ e.preventDefault(); autoResume(); return; }
    if(shopOpen) return;
    if(stickId !== null) return;
    stickId = e.pointerId;
    stickEl.classList.add('on');
    try { stickEl.setPointerCapture(e.pointerId); } catch(err){}
    e.preventDefault();
    stickTo(e);
  }
  function stickMove(e){ if(e.pointerId !== stickId) return; e.preventDefault(); stickTo(e); }
  function stickUp(e){
    if(e.pointerId !== stickId) return;
    stickId = null;
    pad.mag = 0;
    stickEl.classList.remove('on');
    knobEl.style.transform = '';
  }

  function fireDown(e){
    e.preventDefault();
    if(gameOver){ restart(); return; }
    if(autoPaused){ autoResume(); return; }
    if(shopOpen) return;
    pad.fire = true; fireEl.classList.add('on');
  }
  function fireUp(e){   e.preventDefault(); pad.fire = false; fireEl.classList.remove('on'); }

  if(overEl) overEl.addEventListener('pointerdown', function(e){ e.preventDefault(); restart(); });
  if(pauseEl) pauseEl.addEventListener('pointerdown', function(e){ e.preventDefault(); autoResume(); });
  if(shopGoEl) shopGoEl.addEventListener('click', function(e){ e.preventDefault(); closeShop(); });
  if(shopBtnEl) shopBtnEl.addEventListener('click', function(e){ e.preventDefault(); openShop(); });
  shopOpts.forEach(function(btn){
    btn.addEventListener('click', function(e){ e.preventDefault(); buy(btn.getAttribute('data-up')); });
  });

  if(upgradeEl){
    upgradeEl.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation();
      if(gameOver){ restart(); return; }
      if(autoPaused){ autoResume(); return; }
      upgradeEl.classList.add('on');
      openShop();
    });
    // the touch layer is hidden the moment upgrades open, so the pressed
    // state has to be cleared on the way in rather than waiting for pointerup
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
      upgradeEl.addEventListener(ev, function(){ upgradeEl.classList.remove('on'); });
    });
  }

  if(stickEl){
    stickEl.addEventListener('pointerdown', stickDown);
    stickEl.addEventListener('pointermove', stickMove);
    stickEl.addEventListener('pointerup', stickUp);
    stickEl.addEventListener('pointercancel', stickUp);
    fireEl.addEventListener('pointerdown', fireDown);
    fireEl.addEventListener('pointerup', fireUp);
    fireEl.addEventListener('pointercancel', fireUp);
    fireEl.addEventListener('pointerleave', fireUp);
  }

  function killAsteroid(k){
    var ax = asteroids[k];
    burst(ax.x, ax.y, 10);
    dropRockLoot(ax.x, ax.y);
    asteroids.splice(k, 1);
    bonus += 15;
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
    } else {
      coins += p.value;
      bonus += p.value * 10;
      burst(p.x, p.y, p.value > 1 ? 10 : 5, '255,209,102');
    }
    syncHud();
  }

  function update(dt){
    var t = gameTime;
    var sf = dt * 60; if(sf > MAX_STEP) sf = MAX_STEP;
    speedMult = speedMultAt(t);

    if(shieldTime > 0) shieldTime = Math.max(0, shieldTime - dt);
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
        if(ax.x < -ax.r) ax.x = window.innerWidth + ax.r;
        else if(ax.x > window.innerWidth + ax.r) ax.x = -ax.r;
        if(ax.y < -ax.r) ax.y = docH + ax.r;
        else if(ax.y > docH + ax.r) ax.y = -ax.r;
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

    if((keys.Space || pad.fire) && t - ship.lastShot > shotCooldown()){
      ship.lastShot = t;
      bullets.push({
        x: ship.x + Math.cos(ship.angle)*NOSE_OFFSET, y: ship.y + Math.sin(ship.angle)*NOSE_OFFSET,
        vx: Math.cos(ship.angle)*BULLET_SPEED, vy: Math.sin(ship.angle)*BULLET_SPEED,
        dmg: bulletDamage(), life: BULLET_LIFE
      });
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
        if(Math.hypot(b.x-al2.x, b.y-al2.y) < ALIEN_R){
          al2.hp -= b.dmg; al2.hitT = 0.12;
          burst(b.x, b.y, 4, '127,227,236');
          if(al2.hp <= 0) killAlien(m);
          bullets.splice(i,1);
          spent = true;
          break;
        }
      }
      if(spent) continue;

      for(var k=asteroids.length-1;k>=0;k--){
        var rock = asteroids[k];
        if(Math.hypot(b.x-rock.x, b.y-rock.y) < rock.r){
          rock.hp -= b.dmg; rock.hitT = 0.12;
          if(rock.hp <= 0) killAsteroid(k);
          else burst(b.x, b.y, 4);
          bullets.splice(i,1);
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
        burst(al.x, al.y, 14, '127,227,236'); aliens.splice(ai,1); hitShip(); continue;
      }
      if(t > al.nextShot){
        al.nextShot = t + alienCooldown(t);
        var sp = alienBulletSpeed(t);
        var aimA = Math.atan2(ship.y-al.y, ship.x-al.x) + (Math.random()-0.5) * 2 * alienSpread(t);
        alienBullets.push({
          x: al.x, y: al.y,
          vx: Math.cos(aimA) * sp, vy: Math.sin(aimA) * sp,
          life: 2.9
        });
      }
    }

    for(var q=alienBullets.length-1; q>=0; q--){
      var ab = alienBullets[q];
      ab.x += ab.vx * sf; ab.y += ab.vy * sf; ab.life -= dt;
      if(ab.life<=0 || ab.x<0 || ab.x>window.innerWidth || ab.y<0 || ab.y>docH){ alienBullets.splice(q,1); continue; }
      if(Math.hypot(ab.x-ship.x, ab.y-ship.y) < SHIP_RADIUS + 3){ alienBullets.splice(q,1); hitShip(); }
    }

    // loot: drifts, gets pulled in once you're close, and expires on its timer
    for(var pi=pickups.length-1; pi>=0; pi--){
      var pk = pickups[pi];
      pk.life -= dt;
      if(pk.life <= 0){ pickups.splice(pi,1); continue; }
      pk.t += 3 * dt;
      var dx = ship.x - pk.x, dy = ship.y - pk.y, dist = Math.hypot(dx, dy) || 1;
      if(dist < MAGNET_R){
        var pull = 0.55 * (1 - dist / MAGNET_R) * sf;
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
      ctx.save();
      ctx.translate(ax.x, ax.y - camY);
      ctx.rotate(ax.rot);
      ctx.beginPath();
      ax.pts.forEach(function(p,i){ if(i===0) ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(10,4,20,.6)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = ax.hitT > 0 ? '#ffffff' : '#c77dff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.7;
      ctx.stroke();
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
      ctx.strokeStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
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

    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#ff7a90';
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
    // machine slept, or the shop was up — never simulate the gap
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
    shopOpen = false;
    if(overEl) overEl.classList.remove('on');
    if(pauseEl) pauseEl.classList.remove('on');
    resize();
    resetRun();
    document.body.classList.add('astro-active');
    document.documentElement.style.scrollBehavior = 'auto';
    pad.mag = 0; pad.fire = false;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
    if(upgradeEl) upgradeEl.classList.remove('on');
    if(isCoarse && tipEl) tipEl.textContent = 'drag to steer · hold fire · ← back to site';
    // there is no Enter key on a phone — point at the button that is actually there
    if(isCoarse && shopHintEl) shopHintEl.innerHTML = 'Spend credits to upgrade. Tap <kbd>Resume</kbd> to launch.';
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
    shopOpen = false; autoPaused = false;
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
    if(shopEl) shopEl.classList.remove('on');
    if(pauseEl) pauseEl.classList.remove('on');
    pad.mag = 0; pad.fire = false; stickId = null;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
    if(upgradeEl) upgradeEl.classList.remove('on');
    if(stickEl) stickEl.classList.remove('on');
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
  // launcher is hidden below 600px and while the game is running. P belongs to
  // the run itself now, where it opens upgrades.
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
