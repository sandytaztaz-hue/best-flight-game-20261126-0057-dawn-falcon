/* DAWN FALCON — loop, screens, input, save slots, scoring, staged shots. */
(function () {
  'use strict';
  var Dawn = window.Dawn;
  var ASSETS = ['dawn-cockpit-bg.jpg', 'dawn-sea.jpg', 'island-strip.jpg', 'lighthouse-fog.jpg',
    'volcano-dawn.jpg', 'fog-break.jpg', 'jet-player.png', 'jet-enemy.png', 'jet-ghost.png',
    'seaplane.png', 'fleet-dawn.png', 'explosion.png'];
  Dawn.images = {};
  Dawn.state = {
    screen: 'title', pilotName: 'Dawn-1', credits: Dawn.BASE.credits,
    upgrades: {}, unlocked: 1, grades: {}, scores: {},
    selectedMission: 0, selectedUpgrade: 0, selectedSlot: 0,
    slots: [null, null, null], flight: null, result: null,
    dialogue: 'Ratna: "Dawn-1, the fog is thick but the rings are lit. Fly the line."',
    paused: false, muted: false, input: {}
  };
  function loadImages(done) {
    var pending = ASSETS.length;
    if (!pending) { done(); return; }
    ASSETS.forEach(function (name) {
      var im = new Image();
      im.onload = function () { Dawn.images[name] = im; if (--pending === 0) done(); };
      im.onerror = function () { if (--pending === 0) done(); };
      im.src = 'assets/' + name;
    });
  }
  Dawn.loadImages = loadImages;
  function saveData() {
    return { pilotName: Dawn.state.pilotName, credits: Dawn.state.credits, upgrades: Dawn.state.upgrades,
      unlocked: Dawn.state.unlocked, grades: Dawn.state.grades, scores: Dawn.state.scores };
  }
  Dawn.saveSlot = function (idx) {
    Dawn.state.slots[idx] = saveData();
    try { localStorage.setItem(Dawn.saveKey + '-' + idx, JSON.stringify(Dawn.state.slots[idx])); } catch (e) {}
    return true;
  };
  Dawn.loadSlot = function (idx) {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(Dawn.saveKey + '-' + idx)); } catch (e) {}
    if (!d && Dawn.state.slots[idx]) d = Dawn.state.slots[idx];
    if (!d) return false;
    Dawn.state.pilotName = d.pilotName; Dawn.state.credits = d.credits; Dawn.state.upgrades = d.upgrades || {};
    Dawn.state.unlocked = d.unlocked; Dawn.state.grades = d.grades || {}; Dawn.state.scores = d.scores || {};
    return true;
  };
  Dawn.loadSlotsFromStorage = function () {
    for (var i = 0; i < 3; i++) {
      try { var d = JSON.parse(localStorage.getItem(Dawn.saveKey + '-' + i)); if (d) Dawn.state.slots[i] = d; } catch (e) {}
    }
  };
  Dawn.buyUpgrade = function (idx) {
    var u = Dawn.UPGRADES[idx || Dawn.state.selectedUpgrade];
    if (!u) return false;
    var lv = Dawn.state.upgrades[u.id] || 0;
    if (lv >= u.max) return false;
    if (Dawn.state.credits < u.price) return false;
    Dawn.state.credits -= u.price; Dawn.state.upgrades[u.id] = lv + 1;
    Dawn.Audio.click(); return true;
  };
  Dawn.startMission = function (idx) {
    Dawn.state.selectedMission = idx;
    Dawn.state.flight = Dawn.newFlight(idx, Dawn.state.upgrades);
    Dawn.state.screen = 'flight'; Dawn.state.paused = false;
    var m = Dawn.MISSIONS[idx];
    Dawn.state.dialogue = m.briefing;
    Dawn.Audio.stopMenuTheme(); Dawn.Audio.ensure();
    return true;
  };
  Dawn.finishMission = function () {
    var f = Dawn.state.flight;
    var acc = f.shots ? Math.round(f.hits / f.shots * 100) : 100;
    var grade = Dawn.gradeFor(f.score, f.ringsHit, f.rings.length, f.kills, f.hull / f.maxHull * 100);
    var credits = f.mission.reward + f.ringsHit * 50 + f.kills * 100;
    Dawn.state.credits += credits;
    Dawn.state.scores[f.missionIdx] = f.score;
    Dawn.state.grades[f.missionIdx] = grade;
    if (f.missionIdx + 1 < Dawn.MISSIONS.length && Dawn.state.unlocked < f.missionIdx + 2) Dawn.state.unlocked = f.missionIdx + 2;
    Dawn.state.result = { mission: f.mission, grade: grade, score: f.score, ringsHit: f.ringsHit,
      totalRings: f.rings.length, kills: f.kills, accuracy: acc, time: Math.round(f.t), credits: credits };
    Dawn.state.screen = 'results';
    Dawn.Audio.radio();
  };
  Dawn.loseMission = function () {
    Dawn.state.screen = 'gameover';
  };
  Dawn.update = function (dt) {
    var s = Dawn.state;
    if (s.screen !== 'flight' || !s.flight || s.paused) return;
    var inp = s.input;
    var f = s.flight;
    Dawn.updateFlight(f, {
      left: !!(inp.ArrowLeft || inp.KeyA), right: !!(inp.ArrowRight || inp.KeyD),
      up: !!(inp.ArrowUp || inp.KeyW), down: !!(inp.ArrowDown || inp.KeyS),
      afterburner: !!inp.ShiftLeft || !!inp.ShiftRight,
      throttleUp: false, throttleDown: false
    }, dt);
    Dawn.Audio.setThrottle(f.throttle);
    if (f.won) Dawn.finishMission();
    else if (f.lost) Dawn.loseMission();
  };
  Dawn.handleKey = function (code) {
    var s = Dawn.state;
    if (code === 'KeyM') { s.muted = Dawn.Audio.toggleMute(); return; }
    if (s.screen === 'title') {
      if (code === 'Enter') { s.screen = 'hangar'; Dawn.Audio.ensure(); Dawn.Audio.startMenuTheme(); }
      else if (code === 'KeyH') s.screen = 'help';
      return;
    }
    if (s.screen === 'help') { if (code === 'Escape' || code === 'Enter') s.screen = 'title'; return; }
    if (s.screen === 'hangar') {
      if (code >= 'Digit1' && code <= 'Digit6') { var i = +code.slice(5) - 1; if (i < s.unlocked) { s.selectedMission = i; s.screen = 'briefing'; } }
      else if (code === 'KeyB') Dawn.buyUpgrade(s.selectedUpgrade);
      else if (code === 'KeyS') Dawn.saveSlot(s.selectedSlot);
      else if (code === 'KeyL') Dawn.loadSlot(s.selectedSlot);
      else if (code === 'Enter') { if (s.selectedMission < s.unlocked) s.screen = 'briefing'; }
      else if (code === 'ArrowDown' || code === 'KeyJ') s.selectedUpgrade = Math.min(6, s.selectedUpgrade + 1);
      else if (code === 'ArrowUp' || code === 'KeyK') s.selectedUpgrade = Math.max(0, s.selectedUpgrade - 1);
      else if (code === 'Tab') s.selectedSlot = (s.selectedSlot + 1) % 3;
      return;
    }
    if (s.screen === 'briefing') {
      if (code === 'Enter') Dawn.startMission(s.selectedMission);
      else if (code === 'Escape') s.screen = 'hangar';
      return;
    }
    if (s.screen === 'flight') {
      if (code === 'KeyP') { s.paused = !s.paused; return; }
      if (code === 'KeyV' && s.flight) { s.flight.view = s.flight.view === 'cockpit' ? 'chase' : 'cockpit'; return; }
      if (code === 'KeyC' && s.flight) Dawn.fireFlare(s.flight);
      if (code === 'KeyF' && s.flight) Dawn.fireMissile(s.flight);
      if (code === 'Space' && s.flight) Dawn.fireCannon(s.flight);
      return;
    }
    if (s.screen === 'results') {
      if (code === 'Enter') s.screen = 'hangar';
      else if (code === 'KeyR') Dawn.startMission(s.selectedMission);
      return;
    }
    if (s.screen === 'gameover') {
      if (code === 'KeyR') Dawn.startMission(s.selectedMission);
      else if (code === 'Enter') s.screen = 'hangar';
      return;
    }
  };
  Dawn.keyDown = function (code) { Dawn.state.input[code] = true; Dawn.handleKey(code); };
  Dawn.keyUp = function (code) { Dawn.state.input[code] = false; };
  // Test hook: drive one deterministic frame without the browser loop.
  Dawn.step = function (dt) { Dawn.update(dt || 0.05); };
  Dawn.draw = function (ctx) { Dawn.Render.draw(ctx, Dawn.state); };
  function boot() {
    var canvas = document.getElementById('game');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    Dawn.loadSlotsFromStorage();
    loadImages(function () {
      var last = Date.now();
      function frame() {
        var now = Date.now();
        Dawn.update(Math.min(0.05, (now - last) / 1000)); last = now;
        Dawn.draw(ctx);
        requestAnimationFrame(frame);
      }
      var params = new URLSearchParams(window.location.search || '');
      var shot = params.get('shot');
      if (shot) { Dawn.Shots.stage(shot); Dawn.draw(ctx); return; }
      requestAnimationFrame(frame);
    });
    window.addEventListener('keydown', function (e) { if (e.code === 'Space') e.preventDefault(); Dawn.keyDown(e.code); });
    window.addEventListener('keyup', function (e) { Dawn.keyUp(e.code); });
    canvas.addEventListener('click', function () { if (Dawn.state.screen === 'flight' && Dawn.state.flight) Dawn.fireMissile(Dawn.state.flight); });
  }
  Dawn.boot = boot;
  if (typeof document !== 'undefined' && document.readyState !== 'loading') boot();
  else if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', boot);
})();
