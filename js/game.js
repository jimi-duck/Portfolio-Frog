(function(){
  var avail   = document.querySelector('.avail');
  var canvas  = document.getElementById('astroCanvas');
  var ctx     = canvas.getContext('2d');
  var exitBtn = document.getElementById('astroExit');
  var tipEl   = document.getElementById('astroTip');
  var scoreEl = document.getElementById('astroScore');
  var tipTimer = null;

  var NOSE_OFFSET = 17;

  var ROT_SPEED = 0.06, THRUST = 0.18, BULLET_SPEED = 9, SHOT_COOLDOWN = 310, MAX_AREA_RATIO = 0.3, BOUNCE = 0.4;
  var ASTEROID_COUNT = 44, SHIP_RADIUS = 9, INVULN_FRAMES = 60, START_SPEED = 1.55;
  var DIFFICULTY_INTERVAL = 9, SPEED_GROWTH = 1.07, SPEED_MULT_CAP = 4.5, MAX_ASTEROIDS = 64;

  var active = false, raf = null, keys = {}, lastShot = 0, docH = 0;
  // analog touch input: joystick steers + throttles, fire button shoots
  var pad = { angle: 0, mag: 0, fire: false };
  var isCoarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  var ship, bullets, particles, destroyed, asteroids;
  // alien saucers: occasional, slow-firing, forgiving to dodge
  var ALIEN_FIRST = 7, ALIEN_SPEED = 1.5, ALIEN_R = 15, ALIEN_BONUS = 150;
  // saucers ramp with time: they arrive more often, fire faster and aim truer
  function alienInterval(t){ return Math.max(9,  20   - t * 0.055); }
  function alienCooldown(t){ return Math.max(950, 1800 - t * 7); }
  function alienSpread(t){   return Math.max(0.09, 0.26 - t * 0.0012); }
  function alienBulletSpeed(t){ return Math.min(5.0, 3.1 + t * 0.011); }
  function alienMax(t){ return t > 75 ? 2 : 1; }
  var aliens = [], alienBullets = [], nextAlienAt = ALIEN_FIRST, bonus = 0;
  var gameOver = false;
  var overEl = document.getElementById('astroOver');
  var finalEl = document.getElementById('astroFinal');
  var hintEl = document.getElementById('astroRestartHint');
  var speedMult = START_SPEED, startTime = 0, lastDifficultyTick = 0;

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

  function resetShip(){
    ship = { x: window.innerWidth/2, y: window.scrollY + window.innerHeight/2, vx: 0, vy: 0, angle: -Math.PI/2, thrusting: false, invuln: INVULN_FRAMES };
  }

  function burst(x, y, n){
    for(var i=0;i<n;i++){
      var a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*3;
      particles.push({ x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1 });
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
    var spd = (0.4 + Math.random()*0.8) * speedMult;
    var top = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;
    var x, y, vx, vy, entering = false;

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
      var aim = Math.atan2(ty - y, tx - x) + (Math.random()-0.5)*0.7;
      vx = Math.cos(aim)*spd; vy = Math.sin(aim)*spd;
      entering = true;
    } else {
      // opening field: scattered down the page, but never inside the current view
      var tries = 0;
      do {
        x = Math.random()*vw; y = Math.random()*docH; tries++;
      } while(tries < 25 && y > top - 60 && y < top + vh + 60);
      var ang = Math.random()*Math.PI*2;
      vx = Math.cos(ang)*spd; vy = Math.sin(ang)*spd;
    }

    return { x:x, y:y, vx:vx, vy:vy, r:r, pts:pts,
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
    for(var i=0;i<ASTEROID_COUNT-EDGE_SEED;i++) asteroids.push(spawnFieldAsteroid());
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
      lastShot: performance.now() + 700   // a beat before it opens fire
    });
  }

  function currentScore(){
    return Math.floor((performance.now() - startTime) / 1000 * 10) + bonus;
  }

  function hitShip(){
    if(gameOver || ship.invuln > 0) return;
    burst(ship.x, ship.y, 26);
    gameOver = true;                    // loop() paints this frame, then stops
    if(finalEl) finalEl.textContent = currentScore();
    if(hintEl) hintEl.textContent = isCoarse ? 'tap to play again' : 'press any key to play again';
    if(overEl) overEl.classList.add('on');
  }

  // wipe the run back to zero — score, difficulty, rocks and saucers
  function resetRun(){
    bullets = []; particles = []; aliens = []; alienBullets = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
    speedMult = START_SPEED;
    startTime = performance.now();
    lastDifficultyTick = 0;
    resetShip();
    spawnAsteroids();
    if(scoreEl) scoreEl.textContent = 'Score: 0';
  }

  function restart(){
    if(!gameOver) return;
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    resetRun();
    raf = requestAnimationFrame(loop);
  }

  function blockClicks(e){
    if(e.target.closest('#astroExit') || e.target.closest('#astroOver')) return;
    e.preventDefault(); e.stopPropagation();
  }

  function onKeyDown(e){
    if(e.code === 'Escape'){ stop(); return; }
    if(gameOver){ e.preventDefault(); restart(); return; }
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
    pad.fire = true; fireEl.classList.add('on');
  }
  function fireUp(e){   e.preventDefault(); pad.fire = false; fireEl.classList.remove('on'); }

  if(overEl) overEl.addEventListener('pointerdown', function(e){ e.preventDefault(); restart(); });

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

  function update(){
    var elapsed = (performance.now() - startTime) / 1000;
    if(scoreEl) scoreEl.textContent = 'Score: ' + (Math.floor(elapsed * 10) + bonus);
    if(elapsed - lastDifficultyTick >= DIFFICULTY_INTERVAL){
      lastDifficultyTick += DIFFICULTY_INTERVAL;
      speedMult = Math.min(speedMult * SPEED_GROWTH, SPEED_MULT_CAP);
      var maxSp = 1.2 * SPEED_MULT_CAP;
      asteroids.forEach(function(ax){
        ax.vx *= SPEED_GROWTH; ax.vy *= SPEED_GROWTH;
        var sp = Math.hypot(ax.vx, ax.vy);
        if(sp > maxSp){ ax.vx = ax.vx/sp*maxSp; ax.vy = ax.vy/sp*maxSp; }
      });
      for(var d=0; d<2 && asteroids.length < MAX_ASTEROIDS; d++) asteroids.push(spawnSafeAsteroid());
    }

    if(keys.ArrowLeft) ship.angle -= ROT_SPEED;
    if(keys.ArrowRight) ship.angle += ROT_SPEED;

    // joystick: rotate toward the stick direction rather than snapping to it,
    // so the ship still feels like it turns
    if(pad.mag > 0.18){
      var da = pad.angle - ship.angle;
      while(da >  Math.PI) da -= Math.PI * 2;
      while(da < -Math.PI) da += Math.PI * 2;
      var step = ROT_SPEED * 1.7;
      ship.angle += Math.max(-step, Math.min(step, da));
    }

    // throttle is proportional to how far the stick is pushed
    var thrustAmt = 0;
    if(keys.ArrowUp) thrustAmt = 1;
    else if(pad.mag > 0.3) thrustAmt = Math.min(1, (pad.mag - 0.3) / 0.55);
    ship.thrusting = thrustAmt > 0;
    if(ship.thrusting){
      ship.vx += Math.cos(ship.angle) * THRUST * thrustAmt;
      ship.vy += Math.sin(ship.angle) * THRUST * thrustAmt;
    }
    ship.vx *= 0.98; ship.vy *= 0.98;

    var nx = ship.x + ship.vx, ny = ship.y + ship.vy;
    if(nx < 0){ nx = 0; ship.vx = -ship.vx*BOUNCE; }
    else if(nx > window.innerWidth){ nx = window.innerWidth; ship.vx = -ship.vx*BOUNCE; }
    if(ny < 0){ ny = 0; ship.vy = -ship.vy*BOUNCE; }
    else if(ny > docH){ ny = docH; ship.vy = -ship.vy*BOUNCE; }
    ship.x = nx; ship.y = ny;
    if(ship.invuln > 0) ship.invuln--;

    asteroids.forEach(function(ax){
      ax.x += ax.vx; ax.y += ax.vy; ax.rot += ax.rotSpeed;
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
    });

    // camera follow — keep the ship near the middle; start scrolling well before it reaches an edge
    var margin = window.innerHeight * 0.4;
    var viewY = ship.y - window.scrollY;
    var maxScroll = Math.max(0, docH - window.innerHeight);
    var target = window.scrollY;
    if(viewY < margin) target = ship.y - margin;
    else if(viewY > window.innerHeight - margin) target = ship.y - window.innerHeight + margin;
    target = Math.max(0, Math.min(target, maxScroll));
    if(Math.abs(target - window.scrollY) > 0.5){
      window.scrollTo(window.scrollX, window.scrollY + (target - window.scrollY) * 0.22);
    }

    var now = performance.now();
    if((keys.Space || pad.fire) && now - lastShot > SHOT_COOLDOWN){
      lastShot = now;
      bullets.push({
        x: ship.x + Math.cos(ship.angle)*NOSE_OFFSET, y: ship.y + Math.sin(ship.angle)*NOSE_OFFSET,
        vx: Math.cos(ship.angle)*BULLET_SPEED, vy: Math.sin(ship.angle)*BULLET_SPEED,
        life: 80
      });
    }

    var camY = window.scrollY;
    for(var i=bullets.length-1;i>=0;i--){
      var b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.life--;
      if(b.life<=0 || b.x<0 || b.x>window.innerWidth || b.y<0 || b.y>docH){
        bullets.splice(i,1); continue;
      }
      var hitAlien = false;
      for(var m=aliens.length-1;m>=0;m--){
        var al2 = aliens[m];
        if(Math.hypot(b.x-al2.x, b.y-al2.y) < ALIEN_R){
          burst(al2.x, al2.y, 18);
          aliens.splice(m,1);
          bullets.splice(i,1);
          bonus += ALIEN_BONUS;
          hitAlien = true;
          break;
        }
      }
      if(hitAlien) continue;

      var hitRock = false;
      for(var k=asteroids.length-1;k>=0;k--){
        var ax = asteroids[k];
        if(Math.hypot(b.x-ax.x, b.y-ax.y) < ax.r){
          burst(ax.x, ax.y, 10);
          asteroids.splice(k,1);
          asteroids.push(spawnSafeAsteroid());
          bullets.splice(i,1);
          hitRock = true;
          break;
        }
      }
      // bullets pass over the page — the game no longer affects content
    }

    // saucers arrive on a timer that tightens as the run goes on
    if(elapsed >= nextAlienAt && aliens.length < alienMax(elapsed)){
      spawnAlien();
      nextAlienAt = elapsed + alienInterval(elapsed);
    }

    for(var ai=aliens.length-1; ai>=0; ai--){
      var al = aliens[ai];
      al.t += 0.03;
      al.x += al.vx;
      al.y = al.baseY + Math.sin(al.t) * 26;
      // drifted off the far side
      if(al.vx > 0 ? al.x > window.innerWidth + ALIEN_R*3 : al.x < -ALIEN_R*3){ aliens.splice(ai,1); continue; }
      if(Math.hypot(ship.x-al.x, ship.y-al.y) < ALIEN_R + SHIP_RADIUS){
        burst(al.x, al.y, 14); aliens.splice(ai,1); hitShip(); continue;
      }
      if(now - al.lastShot > alienCooldown(elapsed)){
        al.lastShot = now;
        var sp = alienBulletSpeed(elapsed);
        var aimA = Math.atan2(ship.y-al.y, ship.x-al.x) + (Math.random()-0.5) * 2 * alienSpread(elapsed);
        alienBullets.push({
          x: al.x, y: al.y,
          vx: Math.cos(aimA) * sp, vy: Math.sin(aimA) * sp,
          life: 170
        });
      }
    }

    for(var q=alienBullets.length-1; q>=0; q--){
      var ab = alienBullets[q];
      ab.x += ab.vx; ab.y += ab.vy; ab.life--;
      if(ab.life<=0 || ab.x<0 || ab.x>window.innerWidth || ab.y<0 || ab.y>docH){ alienBullets.splice(q,1); continue; }
      if(Math.hypot(ab.x-ship.x, ab.y-ship.y) < SHIP_RADIUS + 3){ alienBullets.splice(q,1); hitShip(); }
    }

    for(var j=particles.length-1;j>=0;j--){
      var p = particles[j];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.94; p.vy *= 0.94;
      p.life -= 0.04;
      if(p.life<=0) particles.splice(j,1);
    }
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
      ctx.strokeStyle = '#c77dff';
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
      ctx.strokeStyle = '#7fe3ec';
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

    if(ship.invuln <= 0 || Math.floor(ship.invuln/4)%2===0){
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
      ctx.fillStyle = 'rgba(184,65,42,' + p.life + ')';
      ctx.fillRect(p.x-1.5, p.y - camY - 1.5, 3, 3);
    });
  }

  function loop(){
    if(!active || gameOver) return;   // a late frame must not keep scoring
    update();
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
    bullets = []; particles = []; destroyed = []; aliens = []; alienBullets = [];
    bonus = 0; nextAlienAt = ALIEN_FIRST;
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    speedMult = START_SPEED; startTime = performance.now(); lastDifficultyTick = 0;
    resize();
    resetShip();
    spawnAsteroids();
    document.body.classList.add('astro-active');
    document.documentElement.style.scrollBehavior = 'auto';
    pad.mag = 0; pad.fire = false;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
    if(isCoarse && tipEl) tipEl.textContent = 'drag to steer · hold fire · ← back to site';
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', blockClicks, true);
    tipTimer = setTimeout(autoHideTip, 5000);
    raf = requestAnimationFrame(loop);
  }

  function stop(){
    if(!active) return;
    active = false;
    cancelAnimationFrame(raf);
    clearTimeout(tipTimer);
    document.body.classList.remove('astro-active');
    document.documentElement.style.scrollBehavior = '';
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('click', blockClicks, true);
    keys = {};
    gameOver = false;
    if(overEl) overEl.classList.remove('on');
    pad.mag = 0; pad.fire = false; stickId = null;
    if(knobEl) knobEl.style.transform = '';
    if(fireEl) fireEl.classList.remove('on');
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
  // The game is an easter egg, so it is reached the same way the grid overlay
  // is — a keypress, hinted quietly in the footer. It used to fade a Play
  // button into the corner on scroll, which announced it to everyone and read
  // as an ad for itself against the rest of the page.
  window.addEventListener('keydown', function(e){
    if(active) return;
    if(e.key !== 'p' && e.key !== 'P') return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target.tagName;
    if(t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
    e.preventDefault();
    start();
  });
})();
