/* DAWN FALCON — world: seeded RNG, rings, enemies, missiles, explosions, fog, physics. */
(function () {
  'use strict';
  var Dawn = window.Dawn;
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  Dawn.rng = mulberry32;
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  Dawn.clamp = clamp;

  Dawn.newFlight = function (missionIdx, upgrades) {
    var m = Dawn.MISSIONS[missionIdx];
    var rnd = mulberry32(1000 + missionIdx * 77);
    var up = upgrades || {};
    var lvl = function (id) { return up[id] || 0; };
    var rings = [];
    for (var i = 0; i < m.rings; i++) {
      rings.push({ x: 340 + i * 170 + rnd() * 60, y: 150 + rnd() * 260, r: 52, passed: false, ping: 0 });
    }
    var enemies = [];
    for (var j = 0; j < m.enemies; j++) {
      enemies.push({ x: 500 + rnd() * 600, y: 120 + rnd() * 300, hp: m.ghost && j === 0 ? 5 : 2,
        vx: 0, vy: 0, ghost: !!m.ghost, flare: 0, fireT: 1 + rnd() * 2, alive: true, taunt: 0 });
    }
    var boats = [];
    for (var b = 0; b < m.boats; b++) boats.push({ x: 200 + rnd() * 800, y: 480 + rnd() * 120, hp: 2, alive: true, sink: 0 });
    return {
      mission: m, missionIdx: missionIdx, rnd: rnd, t: 0, timeLeft: m.time,
      px: 640, py: 420, vx: 0, vy: 0, alt: 2400, speed: 380, heading: 45, throttle: 0.7,
      fuel: 100 + lvl('tank') * 25, maxFuel: 100 + lvl('tank') * 25,
      hull: 100 + lvl('armor') * 40, maxHull: 100 + lvl('armor') * 40,
      missiles: 4 + lvl('rack') * 2, flares: 4 + lvl('flares') * 4,
      rings: rings, ringIdx: 0, combo: 1, comboCount: 0, comboMult: 1.0,
      enemies: enemies, boats: boats, missilesFired: [], shots: 0, hits: 0,
      explosions: [], score: 0, ringsHit: 0, kills: 0, lock: 0, lockTarget: null,
      escort: m.escort ? { x: 700, y: 300, hp: 100, alive: true } : null,
      fog: 0.55, won: false, lost: false, reason: '', view: 'cockpit',
      radarRange: 1 + lvl('sensor') * 0.35, lampLevel: lvl('lamps'),
      topSpeed: Dawn.BASE.speed * (1 + lvl('engine') * 0.12)
    };
  };

  Dawn.updateFlight = function (f, input, dt) {
    if (f.won || f.lost) return;
    f.t += dt; f.timeLeft -= dt;
    if (f.timeLeft <= 0) { f.lost = true; f.reason = 'TIME UP — the dawn window closed'; return; }
    var burn = input.afterburner ? 1 : 0;
    f.throttle = clamp(f.throttle + (input.throttleUp ? dt * 0.4 : 0) - (input.throttleDown ? dt * 0.4 : 0), 0.3, 1);
    var targetSpeed = f.topSpeed * f.throttle * (burn ? 1.35 : 1);
    f.speed += (targetSpeed - f.speed) * dt * 0.8;
    f.fuel -= dt * (0.55 + (burn ? 1.6 : 0) + f.throttle * 0.25);
    if (f.fuel <= 0) { f.fuel = 0; f.lost = true; f.reason = 'OUT OF FUEL — Dawn-1 glided into the sea'; return; }
    var steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    var climb = (input.up ? -1 : 0) + (input.down ? 1 : 0);
    f.px = clamp(f.px + steer * 260 * dt, 90, 1190);
    f.py = clamp(f.py + climb * 220 * dt, 90, 560);
    f.heading = clamp(f.heading + steer * 22 * dt, 0, 359);
    f.alt = clamp(f.alt - climb * 320 * dt, 400, 9000);
    // fog drifts
    f.fog = clamp(f.fog + Math.sin(f.t * 0.3) * 0.0006, 0.4, 0.7);
    // rings: pass through centre
    var ring = f.rings[f.ringIdx];
    if (ring) {
      ring.ping += dt;
      var d = Math.hypot(f.px - ring.x, f.py - ring.y);
      if (d < ring.r + 26) {
        ring.passed = true; f.ringIdx++; f.ringsHit++;
        f.comboCount++; f.comboMult = Math.min(2.5, 1 + f.comboCount * 0.25);
        var pts = Math.round(Dawn.RING_POINTS * f.comboMult);
        f.score += pts; f.timeLeft += 8;
        Dawn.Audio.ringChime(f.comboMult);
      }
    }
    // lock-on: nearest enemy near centre
    var best = null, bestD = 1e9;
    f.enemies.forEach(function (e) {
      if (!e.alive) return;
      var dd = Math.hypot(e.x - 640, e.y - 300);
      if (dd < bestD) { bestD = dd; best = e; }
    });
    if (best && bestD < 260) {
      f.lock = clamp(f.lock + dt * 0.9, 0, 1); f.lockTarget = best;
      if (f.lock >= 1) Dawn.Audio.lockBeep(1);
    } else { f.lock = clamp(f.lock - dt * 1.4, 0, 1); if (f.lock <= 0) f.lockTarget = null; }
    // enemies drift + fire
    f.enemies.forEach(function (e) {
      if (!e.alive) return;
      e.x += Math.sin(f.t * 0.7 + e.y) * 40 * dt; e.y += Math.cos(f.t * 0.5) * 18 * dt;
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.fireT = 3.5 + f.rnd() * 2;
        if (Math.hypot(e.x - f.px, e.y - f.py) < 520) {
          f.hull -= e.ghost ? 8 : 5;
          if (f.hull <= 0) { f.hull = 0; f.lost = true; f.reason = 'SHOT DOWN — hull destroyed'; return; }
        }
      }
      if (e.ghost) { e.taunt += dt; }
    });
    // escort drifts forward
    if (f.escort && f.escort.alive) { f.escort.x += 22 * dt; if (f.escort.x > 1250) f.escort.x = 60; }
    // missiles
    f.missilesFired.forEach(function (mm) {
      mm.x += mm.vx * dt; mm.y += mm.vy * dt; mm.life -= dt;
      if (mm.target && mm.target.alive) {
        var dx = mm.target.x - mm.x, dy = mm.target.y - mm.y, dd = Math.hypot(dx, dy) || 1;
        // proportional steering: velocity eases toward the target at capped speed
        var desVx = (dx / dd) * 720, desVy = (dy / dd) * 720;
        mm.vx += (desVx - mm.vx) * dt * 4; mm.vy += (desVy - mm.vy) * dt * 4;
        if (dd < 40) {
          mm.life = 0; mm.target.hp -= 1; f.hits++;
          if (mm.target.hp <= 0) {
            mm.target.alive = false; f.kills++; f.score += Dawn.KILL_POINTS;
            f.explosions.push({ x: mm.target.x, y: mm.target.y, t: 0, big: !!mm.target.ghost });
            Dawn.Audio.explosion();
          }
        }
      }
    });
    f.missilesFired = f.missilesFired.filter(function (mm) { return mm.life > 0; });
    f.explosions.forEach(function (ex) { ex.t += dt; });
    f.explosions = f.explosions.filter(function (ex) { return ex.t < 1.2; });
    // win: all rings passed and (mission 6: ghost dead; other missions: rings are the gate, kills add score)
    var ringsDone = f.ringIdx >= f.rings.length;
    var ghostDead = !f.mission.ghost || f.enemies.every(function (e) { return !e.alive; });
    if (ringsDone && ghostDead) { f.won = true; }
    // mission 3/5 win also needs boats/enemies handled? rings + time is the gate; kills add score.
  };

  Dawn.fireMissile = function (f) {
    if (f.missiles <= 0 || !f.lockTarget || f.lock < 1) return false;
    f.missiles--; f.shots++;
    f.missilesFired.push({ x: f.px, y: f.py, vx: 500, vy: -260, life: 4, target: f.lockTarget });
    Dawn.Audio.missile(); return true;
  };
  Dawn.fireCannon = function (f) {
    f.shots++;
    var best = null, bestD = 1e9;
    f.enemies.forEach(function (e) {
      if (!e.alive) return;
      var dd = Math.hypot(e.x - f.px, e.y - f.py);
      if (dd < bestD) { bestD = dd; best = e; }
    });
    if (best && bestD < 200) {
      f.hits++; best.hp -= 1;
      if (best.hp <= 0) { best.alive = false; f.kills++; f.score += Dawn.KILL_POINTS; f.explosions.push({ x: best.x, y: best.y, t: 0, big: false }); Dawn.Audio.explosion(); }
    }
    Dawn.Audio.cannon();
  };
  Dawn.fireFlare = function (f) {
    if (f.flares <= 0) return false;
    f.flares--; f.lock = 0;
    f.explosions.push({ x: f.px, y: f.py - 60, t: 0, big: false });
    return true;
  };
  Dawn.gradeFor = function (score, ringsHit, totalRings, kills, hullPct) {
    var ratio = (ringsHit / Math.max(1, totalRings)) * 0.6 + (hullPct / 100) * 0.2 + Math.min(1, score / 2500) * 0.2;
    if (ratio >= 0.92) return 'S';
    if (ratio >= 0.75) return 'A';
    if (ratio >= 0.55) return 'B';
    return 'C';
  };
})();
