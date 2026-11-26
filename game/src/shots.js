/* DAWN FALCON — deterministic staged screenshot scenes (?shot=1..4). */
(function () {
  'use strict';
  var Dawn = window.Dawn;
  function stageFlight(missionIdx, opts) {
    opts = opts || {};
    var s = Dawn.state;
    s.selectedMission = missionIdx;
    s.flight = Dawn.newFlight(missionIdx, s.upgrades);
    var f = s.flight;
    f.view = opts.view || 'cockpit';
    f.px = opts.px !== undefined ? opts.px : 640;
    f.py = opts.py !== undefined ? opts.py : 420;
    f.alt = opts.alt || 2400; f.speed = opts.speed || 380; f.heading = opts.heading || 45;
    f.t = opts.t || 42; f.timeLeft = opts.timeLeft || 120;
    f.comboMult = opts.combo || 1.0; f.comboCount = opts.comboCount || 0;
    f.score = opts.score || 0;
    if (opts.ringAhead) { var r = f.rings[0]; r.x = 640; r.y = 300; f.ringIdx = 0; }
    if (opts.lock) { f.lock = 1; f.lockTarget = f.enemies[0] || null; if (f.lockTarget) { f.lockTarget.x = 640; f.lockTarget.y = 300; } }
    if (opts.missile && f.lockTarget) {
      f.missilesFired.push({ x: 560, y: 380, vx: 500, vy: -260, life: 4, target: f.lockTarget });
    }
    if (opts.enemyPos) f.enemies.forEach(function (e, i) { if (opts.enemyPos[i]) { e.x = opts.enemyPos[i][0]; e.y = opts.enemyPos[i][1]; } });
    if (opts.escortPos && f.escort) { f.escort.x = opts.escortPos[0]; f.escort.y = opts.escortPos[1]; }
    if (opts.explosion) f.explosions.push({ x: 340, y: 180, t: 0.4, big: false }); // destroyed top-left bandit — far from the escort seaplane (900,170)
    if (opts.ghost) { f.enemies.forEach(function (e) { e.x = 700; e.y = 260; }); }
    s.dialogue = opts.dialogue || s.dialogue;
    s.screen = 'flight'; s.paused = false;
    return f;
  }
  Dawn.Shots = {
    stage: function (shot) {
      var s = Dawn.state;
      s.credits = 1250; s.upgrades = { sensor: 1, rack: 1 }; s.unlocked = 6;
      s.grades = { 0: 'S', 1: 'A', 2: 'B', 3: 'A', 4: 'B' }; s.scores = { 0: 2100, 1: 1800, 2: 1500, 3: 1900, 4: 1700 };
      if (shot === '1') {
        stageFlight(1, { view: 'cockpit', ringAhead: true, combo: 1.5, comboCount: 2, score: 850,
          enemyPos: [[330, 190], [980, 210]],
          dialogue: 'Sinta: "Tower to Dawn-1: ring dead ahead, bearing 045. Fog bank at two miles."' });
      } else if (shot === '2') {
        stageFlight(1, { view: 'chase', ringAhead: true, combo: 2.0, comboCount: 4, score: 1400, py: 370,
          enemyPos: [[330, 190], [980, 210]],
          dialogue: 'Yoga: "Ring dead ahead, Dawn-1! Punch the burner and take it!"' });
        var f2 = s.flight; f2.rings[0].x = 640; f2.rings[0].y = 330; f2.py = 370;
      } else if (shot === '3') {
        stageFlight(4, { view: 'chase', lock: true, missile: true, explosion: true, combo: 2.5, comboCount: 6, score: 2300, py: 380,
          enemyPos: [[640, 300], [340, 180], [1080, 180], [330, 430], [950, 430]],
          escortPos: [900, 170],
          dialogue: 'Ratna: "Weapons free, Dawn-1. Protect the seaplane — Ghost is out there."' });
      } else if (shot === '4') { // home/base screen: hangar at dawn with jet, loadout, crew, 3 save slots
        s.screen = 'hangar'; s.selectedMission = 5; s.selectedUpgrade = 2; s.selectedSlot = 0;
        s.slots[0] = { pilotName: 'Dawn-1', unlocked: 6, credits: 1250 };
        s.slots[1] = { pilotName: 'Dawn-1', unlocked: 3, credits: 700 };
        s.slots[2] = null;
      }
    }
  };
})();
