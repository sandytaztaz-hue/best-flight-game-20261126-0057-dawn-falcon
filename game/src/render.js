/* DAWN FALCON — render: photorealistic backgrounds + sprites, real HUD, all screens. */
(function () {
  'use strict';
  var Dawn = window.Dawn;
  function img(name) { return Dawn.images ? Dawn.images[name] : null; }
  function drawImg(ctx, im, x, y, w, h, sx, sy, sw, sh) {
    if (!im) return;
    var native = im._native || im;
    try {
      if (sx !== undefined) ctx.drawImage(native, sx, sy, sw, sh, x, y, w, h);
      else ctx.drawImage(native, x, y, w, h);
    } catch (e) {}
  }
  function box(ctx, x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill || 'rgba(8,14,22,0.82)';
    ctx.fillRect(x, y, w, h);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }
  function txt(ctx, s, x, y, size, color, align, bold) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (bold ? 'bold ' : '') + size + 'px sans-serif';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillText(s, x, y);
  }
  function bar(ctx, x, y, w, h, frac, color, label) {
    box(ctx, x, y, w, h, 'rgba(0,0,0,0.65)', '#5a6a7a');
    ctx.fillStyle = color; ctx.fillRect(x + 3, y + 3, Math.max(0, (w - 6) * Math.max(0, Math.min(1, frac))), h - 6);
    if (label) txt(ctx, label, x + 10, y + 3, 11, '#fff', 'left', true);
  }
  function ring(ctx, x, y, r, glow) {
    ctx.save();
    ctx.strokeStyle = glow ? '#ffd24d' : '#7fe0ff'; ctx.lineWidth = 7;
    ctx.shadowColor = glow ? '#ff9d00' : '#35c8ff'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function fogOverlay(ctx, f, t) {
    ctx.fillStyle = 'rgba(255,214,178,' + (0.10 + f * 0.16) + ')';
    for (var i = 0; i < 5; i++) {
      var y = 120 + i * 110 + Math.sin(t * 0.4 + i * 2) * 12;
      ctx.beginPath(); ctx.ellipse(640 + Math.sin(t * 0.2 + i) * 90, y, 720, 42, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawWorld(ctx, f, opts) {
    opts = opts || {};
    drawImg(ctx, img(f.mission.bg), 0, 0, 1280, 720);
    // golden dawn tint
    ctx.fillStyle = 'rgba(255,170,90,0.07)'; ctx.fillRect(0, 0, 1280, 720);
    // runway strip glow for mission 1
    if (f.missionIdx === 0) {
      ctx.fillStyle = 'rgba(255,220,140,0.9)';
      ctx.fillRect(600, 640, 80, 8); ctx.fillRect(620, 600, 40, 8);
      txt(ctx, 'RUNWAY 09 — ISLAND STRIP', 520, 668, 15, '#ffe9a8', 'left', true);
    }
    // lighthouse beam mission 3
    if (f.missionIdx === 2) {
      var bx = 220 + Math.sin(f.t * 0.5) * 160;
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff6c0';
      ctx.beginPath(); ctx.moveTo(220, 180); ctx.lineTo(bx, 560); ctx.lineTo(bx + 90, 560); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    // volcano glow mission 4
    if (f.missionIdx === 3) {
      ctx.save(); ctx.fillStyle = 'rgba(255,90,20,0.35)';
      ctx.beginPath(); ctx.ellipse(960, 150, 130, 46, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      txt(ctx, 'VOLCANO ISLAND — ASH HAZE', 880, 210, 14, '#ffb08a', 'left', true);
    }
    // fishing fleet
    if (f.missionIdx === 2) drawImg(ctx, img('fleet-dawn.png'), 180, 500, 420, 150);
    // escort seaplane
    if (f.escort && f.escort.alive) {
      drawImg(ctx, img('seaplane.png'), f.escort.x - 90, f.escort.y - 40, 180, 90);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(f.escort.x - 72, f.escort.y - 64, 144, 18);
      txt(ctx, 'ESCORT SEAPLANE', f.escort.x - 70, f.escort.y - 62, 13, '#a8f0c0', 'left', true);
      bar(ctx, f.escort.x - 70, f.escort.y + 56, 140, 12, f.escort.hp / 100, '#4dd07a', '');
    }
    // rings
    f.rings.forEach(function (r, i) {
      if (r.passed) return;
      var isNext = i === f.ringIdx;
      var vis = isNext ? 1 : 0.45;
      ctx.save(); ctx.globalAlpha = vis;
      ring(ctx, r.x, r.y, r.r, isNext);
      if (isNext) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(r.x + r.r + 8, r.y - 11, 100, 20);
        txt(ctx, 'RING ' + (i + 1) + ' / ' + f.rings.length, r.x + r.r + 12, r.y - 7, 14, '#ffe9a8', 'left', true);
      }
      ctx.restore();
    });
    // enemies
    f.enemies.forEach(function (e) {
      if (!e.alive) return;
      var spr = e.ghost ? 'jet-ghost.png' : 'jet-enemy.png';
      drawImg(ctx, img(spr), e.x - 70, e.y - 40, 140, 80);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(e.x - 34, e.y - 64, 68, 18);
      txt(ctx, e.ghost ? 'GHOST' : 'BANDIT', e.x - 32, e.y - 62, 13, e.ghost ? '#e8e8f2' : '#ff9a8a', 'left', true);
      bar(ctx, e.x - 40, e.y + 46, 80, 9, e.hp / (e.ghost ? 5 : 2), '#ff5a4a', '');
    });
    // boats
    f.boats.forEach(function (b) {
      if (!b.alive) return;
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(b.x - 26, b.y - 8, 52, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(b.x - 44, b.y - 32, 88, 18);
      txt(ctx, 'RAIDER BOAT', b.x - 42, b.y - 30, 12, '#ff9a8a', 'left', true);
    });
    // missiles
    f.missilesFired.forEach(function (mm) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mm.x - 26, mm.y + 14); ctx.lineTo(mm.x, mm.y); ctx.stroke();
      ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.arc(mm.x, mm.y, 5, 0, Math.PI * 2); ctx.fill();
    });
    // explosions (additive sprite)
    f.explosions.forEach(function (ex) {
      var s = 120 + ex.t * 260;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawImg(ctx, img('explosion.png'), ex.x - s / 2, ex.y - s / 2, s, s * 0.66);
      ctx.restore();
    });
    // player jet in chase view
    if (f.view === 'chase') {
      drawImg(ctx, img('jet-player.png'), f.px - 110, f.py - 30, 220, 130);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(120,180,255,0.75)';
      ctx.beginPath(); ctx.ellipse(f.px - 30, f.py + 62, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(f.px + 30, f.py + 62, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    fogOverlay(ctx, f.fog, f.t);
  }
  function drawCockpitFrame(ctx) {
    var cp = img('dawn-cockpit-bg.jpg');
    if (!cp) return;
    // bottom instrument panel crop (bottom of photo -> bottom strip)
    drawImg(ctx, cp, 0, 548, 1280, 172, 0, 380, 1280, 340);
    // top canopy arch strip
    drawImg(ctx, cp, 0, 0, 1280, 58, 0, 0, 1280, 116);
    // side frame strips
    drawImg(ctx, cp, 0, 58, 46, 490, 0, 116, 92, 490);
    drawImg(ctx, cp, 1234, 58, 46, 490, 1188, 116, 92, 490);
  }
  function drawHUD(ctx, f, state) {
    // compass strip top (below canopy arch)
    box(ctx, 300, 66, 680, 34, 'rgba(8,14,22,0.78)', '#7a8a9a');
    var heads = ['N 000', 'NE 045', 'E 090', 'SE 135', 'S 180', 'SW 225', 'W 270', 'NW 315'];
    heads.forEach(function (h, i) { txt(ctx, h, 330 + i * 82, 76, 14, '#cfe8ff', 'left', true); });
    box(ctx, 556, 104, 184, 32, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'HDG ' + String(Math.round(f.heading)).padStart(3, '0') + '°', 566, 112, 14, '#ffd24d', 'left', true);
    // warning lights (right of heading box)
    if (f.fuel < 25) txt(ctx, '⚠ LOW FUEL', 760, 110, 16, '#ff5a4a', 'left', true);
    if (f.hull < 30) txt(ctx, '⚠ HULL CRITICAL', 760, 134, 16, '#ff5a4a', 'left', true);
    // left gauges: ALT / SPD
    box(ctx, 58, 110, 190, 96, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'ALTITUDE', 74, 122, 13, '#8fd8ff', 'left', true);
    txt(ctx, Math.round(f.alt) + ' FT', 74, 146, 26, '#fff', 'left', true);
    box(ctx, 58, 214, 190, 96, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'AIRSPEED', 74, 226, 13, '#8fd8ff', 'left', true);
    txt(ctx, Math.round(f.speed) + ' KT', 74, 250, 26, '#fff', 'left', true);
    // radar scope bottom-left (above cockpit panel)
    box(ctx, 58, 330, 190, 150, 'rgba(6,18,12,0.85)', '#4dd07a');
    txt(ctx, 'RADAR', 74, 342, 13, '#4dd07a', 'left', true);
    ctx.save(); ctx.strokeStyle = '#4dd07a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(153, 408, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(153, 408, 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#4dd07a'; ctx.beginPath(); ctx.arc(153, 408, 4, 0, Math.PI * 2); ctx.fill();
    var ring = f.rings[f.ringIdx];
    if (ring) {
      var ang = Math.atan2(ring.y - f.py, ring.x - f.px);
      var rx = 153 + Math.cos(ang) * 44, ry = 408 + Math.sin(ang) * 44;
      ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill();
      txt(ctx, 'NEXT RING', 74, 452, 12, '#ffd24d', 'left', true);
    }
    f.enemies.forEach(function (e) {
      if (!e.alive) return;
      var ex = 153 + Dawn.clamp((e.x - f.px) / 900, -1, 1) * 50;
      var ey = 408 + Dawn.clamp((e.y - f.py) / 600, -1, 1) * 50;
      ctx.fillStyle = '#ff5a4a'; ctx.fillRect(ex - 3, ey - 3, 6, 6);
    });
    // right column: combo, fuel, hull, weapons
    box(ctx, 1032, 110, 190, 200, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'RING COMBO', 1048, 122, 13, '#ffd24d', 'left', true);
    txt(ctx, 'x' + f.comboMult.toFixed(2), 1048, 146, 30, '#ffd24d', 'left', true);
    txt(ctx, 'COMBO ' + f.comboCount + ' RINGS', 1048, 184, 12, '#cfe8ff', 'left', true);
    bar(ctx, 1048, 208, 158, 16, f.fuel / f.maxFuel, f.fuel < 25 ? '#ff5a4a' : '#4dd07a', 'FUEL ' + Math.round(f.fuel) + '%');
    bar(ctx, 1048, 232, 158, 16, f.hull / f.maxHull, f.hull < 30 ? '#ff5a4a' : '#8fd8ff', 'HULL ' + Math.round(f.hull) + '%');
    bar(ctx, 1048, 258, 158, 16, f.throttle, '#ffd24d', 'THR ' + Math.round(f.throttle * 100) + '%');
    box(ctx, 1032, 318, 190, 96, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'WEAPONS', 1048, 330, 13, '#8fd8ff', 'left', true);
    txt(ctx, 'MSL ' + f.missiles + '   FLR ' + f.flares + '   GUN ∞', 1048, 354, 15, '#fff', 'left', true);
    txt(ctx, 'LOCK ' + Math.round(f.lock * 100) + '%', 1048, 382, 15, f.lock >= 1 ? '#ff5a4a' : '#cfe8ff', 'left', true);
    // mission timer + score top-right below compass
    box(ctx, 1032, 422, 190, 64, 'rgba(8,14,22,0.82)', '#7a8a9a');
    txt(ctx, 'TIME ' + Math.max(0, Math.ceil(f.timeLeft)) + 's', 1048, 434, 16, '#fff', 'left', true);
    txt(ctx, 'SCORE ' + f.score, 1048, 458, 16, '#ffd24d', 'left', true);
    // lock bracket centre
    var cx = 640, cy = 300, L = 46 + (1 - f.lock) * 30;
    ctx.strokeStyle = f.lock >= 1 ? '#ff3b30' : '#7fe0ff'; ctx.lineWidth = 3;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
      ctx.beginPath(); ctx.moveTo(cx + c[0] * L, cy + c[1] * (L - 18)); ctx.lineTo(cx + c[0] * L, cy + c[1] * L); ctx.lineTo(cx + c[0] * (L - 18), cy + c[1] * L); ctx.stroke();
    });
    if (f.lockTarget && f.lockTarget.alive) {
      txt(ctx, 'LOCK ' + Math.round(f.lock * 100) + '% — ' + Math.round(Math.hypot(f.lockTarget.x - f.px, f.lockTarget.y - f.py)) + 'm', cx - 90, cy - L - 44, 14, f.lock >= 1 ? '#ff5a4a' : '#fff', 'left', true);
    }
    // warning lights are drawn just below the compass strip (see above)
    // dialogue bar (above cockpit panel, clear of edges)
    if (state.dialogue) {
      box(ctx, 270, 486, 740, 52, 'rgba(8,14,22,0.88)', '#ffd27a');
      txt(ctx, state.dialogue, 288, 500, 15, '#ffe9a8', 'left', false);
    }
    // mission label
    box(ctx, 58, 66, 220, 34, 'rgba(8,14,22,0.78)', '#7a8a9a');
    txt(ctx, f.mission.code + ' — ' + f.mission.name, 72, 76, 14, '#fff', 'left', true);
  }
  function panel(ctx, x, y, w, h, title) {
    box(ctx, x, y, w, h, 'rgba(8,14,22,0.88)', '#8a9aaa');
    if (title) { txt(ctx, title, x + 18, y + 14, 18, '#ffd24d', 'left', true); }
  }
  function drawTitle(ctx, state) {
    drawImg(ctx, img('island-strip.jpg'), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(10,16,26,0.45)'; ctx.fillRect(0, 0, 1280, 720);
    drawImg(ctx, img('jet-player.png'), 380, 330, 520, 300);
    txt(ctx, 'DAWN FALCON', 640, 84, 64, '#ffe9a8', 'center', true);
    txt(ctx, 'FOG ARCHIPELAGO RING RUN', 640, 158, 26, '#fff', 'center', true);
    txt(ctx, 'Six dawn legs across the foggy islands. Fly the rings. Beat Ghost.', 640, 198, 17, '#cfe8ff', 'center', false);
    panel(ctx, 340, 470, 600, 150, 'DAWN FALCON SQUADRON');
    txt(ctx, 'Pilot: Dawn-1  •  Commander Ratna "Merpati" Dewi', 360, 506, 15, '#fff', 'left', false);
    txt(ctx, 'Wingman Yoga "Swift" Pratama  •  Tower Sinta Lestari', 360, 532, 15, '#fff', 'left', false);
    txt(ctx, 'Chief Budi "Spark" Hartono  •  Hidden ace: Ghost', 360, 558, 15, '#fff', 'left', false);
    txt(ctx, 'ENTER — Hangar    H — Help    M — Mute', 640, 586, 15, '#ffd24d', 'center', true);
    txt(ctx, 'Press ENTER to enter the hangar', 640, 640, 16, '#fff', 'center', true);
  }
  function drawHangar(ctx, state) {
    drawImg(ctx, img('island-strip.jpg'), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(10,16,26,0.55)'; ctx.fillRect(0, 0, 1280, 720);
    txt(ctx, 'HANGAR — ISLAND STRIP AT DAWN', 40, 28, 26, '#ffe9a8', 'left', true);
    txt(ctx, 'Credits: ' + state.credits + '   Pilot: ' + state.pilotName, 40, 62, 16, '#fff', 'left', true);
    drawImg(ctx, img('jet-player.png'), 60, 110, 420, 250);
    panel(ctx, 60, 380, 420, 180, 'CREW');
    txt(ctx, 'Ratna "Merpati" Dewi — Commander', 78, 416, 14, '#ffd27a', 'left', false);
    txt(ctx, 'Yoga "Swift" Pratama — Wingman', 78, 442, 14, '#8fd8ff', 'left', false);
    txt(ctx, 'Sinta "Tower" Lestari — Island Control', 78, 468, 14, '#a8f0c0', 'left', false);
    txt(ctx, 'Budi "Spark" Hartono — Mechanic', 78, 494, 14, '#ffb08a', 'left', false);
    txt(ctx, 'Budi: "She is fuelled and shiny, boss!"', 78, 522, 14, '#ffe9a8', 'left', false);
    panel(ctx, 510, 100, 360, 460, 'MISSION MAP — 1-6 TO FLY');
    Dawn.MISSIONS.forEach(function (m, i) {
      var unlocked = i < state.unlocked;
      var g = state.grades[i] || '—';
      txt(ctx, (i + 1) + '. ' + m.name + '  [' + g + ']' + (unlocked ? '' : '  LOCKED'), 528, 140 + i * 34, 15, unlocked ? '#fff' : '#7a8a9a', 'left', i === state.selectedMission);
      txt(ctx, '   ' + m.weather, 528, 162 + i * 34, 12, '#8fa8ba', 'left', false);
    });
    txt(ctx, 'Press 1-6 for briefing. B — buy selected upgrade.', 528, 140 + 6 * 34 + 6, 13, '#cfe8ff', 'left', false);
    // --- fills the mission-map void: route map + pilot log + next-leg weather ---
    ctx.fillStyle = 'rgba(143,216,255,0.35)'; ctx.fillRect(528, 368, 324, 2);
    txt(ctx, 'ROUTE MAP — ISLAND CHAIN', 528, 376, 13, '#ffd24d', 'left', true);
    var stops = [[545, 420], [605, 406], [665, 422], [725, 408], [785, 424], [845, 410]];
    ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(stops[0][0], stops[0][1]);
    for (var si = 1; si < 6; si++) ctx.lineTo(stops[si][0], stops[si][1]);
    ctx.stroke();
    stops.forEach(function (p, i) {
      ctx.fillStyle = i === state.selectedMission ? '#ffd24d' : '#8fd8ff';
      ctx.beginPath(); ctx.arc(p[0], p[1], i === state.selectedMission ? 8 : 6, 0, Math.PI * 2); ctx.fill();
      if (i === state.selectedMission) { ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, Math.PI * 2); ctx.stroke(); }
      txt(ctx, Dawn.MISSIONS[i].code, p[0], 434, 11, '#cfe8ff', 'center', true);
    });
    txt(ctx, 'PILOT LOG — LAST 3 SORTIES', 528, 452, 12, '#8fd8ff', 'left', true);
    [4, 3, 2].forEach(function (mi, k) {
      txt(ctx, Dawn.MISSIONS[mi].code + ' ' + Dawn.MISSIONS[mi].name + ' — ' + (state.grades[mi] || '—') + ' — ' + (state.scores[mi] || 0) + ' pts', 528, 468 + k * 15, 12, '#fff', 'left', false);
    });
    var nm = Dawn.MISSIONS[state.selectedMission];
    txt(ctx, 'NEXT LEG — ' + nm.code + ' ' + nm.name, 528, 518, 12, '#ffd24d', 'left', true);
    txt(ctx, nm.weather + '  •  ' + nm.time + 's  •  ' + nm.reward + ' cr reward', 528, 534, 12, '#cfe8ff', 'left', false);
    panel(ctx, 900, 100, 340, 460, 'UPGRADES — 7');
    Dawn.UPGRADES.forEach(function (u, i) {
      var lv = state.upgrades[u.id] || 0;
      var y = 140 + i * 58;
      txt(ctx, (i + 1) + '. ' + u.name + '  Lv' + lv + '/' + u.max, 918, y, 13, '#fff', 'left', i === state.selectedUpgrade);
      txt(ctx, '   ' + u.desc + ' — ' + u.price + ' cr', 918, y + 20, 12, '#8fa8ba', 'left', false);
      txt(ctx, '   ' + u.effect, 918, y + 38, 12, '#ffd24d', 'left', false);
    });
    panel(ctx, 60, 580, 1180, 100, 'SAVE SLOTS');
    for (var s = 0; s < 3; s++) {
      var slot = state.slots[s];
      var label = slot ? ('SLOT ' + (s + 1) + ' — ' + slot.pilotName + ' — M' + slot.unlocked + ' — ' + slot.credits + ' cr') : ('SLOT ' + (s + 1) + ' — EMPTY');
      txt(ctx, label, 84 + s * 390, 614, 13, s === state.selectedSlot ? '#ffd24d' : '#fff', 'left', false);
      if (s === state.selectedSlot) txt(ctx, '[SELECTED — S saves here]', 84 + s * 390, 636, 13, '#ffd24d', 'left', true);
    }
    txt(ctx, 'S — save to slot   L — load slot   ENTER — fly selected mission', 84, 652, 13, '#cfe8ff', 'left', false);
  }
  function drawBriefing(ctx, state) {
    var m = Dawn.MISSIONS[state.selectedMission];
    drawImg(ctx, img(m.bg), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(10,16,26,0.6)'; ctx.fillRect(0, 0, 1280, 720);
    panel(ctx, 90, 60, 1100, 240, 'BRIEFING — ' + m.code + ' ' + m.name);
    txt(ctx, m.briefing, 110, 108, 16, '#ffe9a8', 'left', false);
    txt(ctx, 'Objective: ' + m.goal, 110, 146, 15, '#fff', 'left', false);
    txt(ctx, 'Weather: ' + m.weather + '   •   Rings: ' + m.rings + '   •   Enemies: ' + m.enemies + '   •   Time: ' + m.time + 's   •   Reward: ' + m.reward + ' cr', 110, 178, 14, '#cfe8ff', 'left', false);
    txt(ctx, 'Route: strip → lagoon → islands → lighthouse → volcano → far strip', 110, 210, 14, '#8fd8ff', 'left', false);
    txt(ctx, 'RING COMBO: each ring adds +8s and raises the multiplier to x2.5. Miss a ring and the combo breaks.', 110, 242, 14, '#ffd24d', 'left', false);
    panel(ctx, 90, 330, 1100, 200, 'ROUTE MAP');
    var xs = [180, 360, 540, 720, 900, 1080];
    xs.forEach(function (x, i) {
      ctx.fillStyle = i === state.selectedMission ? '#ffd24d' : '#8fd8ff';
      ctx.beginPath(); ctx.arc(x, 420, 16, 0, Math.PI * 2); ctx.fill();
      txt(ctx, Dawn.MISSIONS[i].code, x - 12, 448, 13, '#fff', 'left', true);
      txt(ctx, Dawn.MISSIONS[i].name, x - 52, 472, 11, '#cfe8ff', 'left', false);
      if (i < 5) { ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 18, 420); ctx.lineTo(xs[i + 1] - 18, 420); ctx.stroke(); }
    });
    txt(ctx, 'ENTER — launch   ESC — back to hangar', 640, 560, 16, '#fff', 'center', true);
  }
  function drawResults(ctx, state) {
    var r = state.result;
    drawImg(ctx, img('fog-break.jpg'), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(10,16,26,0.6)'; ctx.fillRect(0, 0, 1280, 720);
    panel(ctx, 240, 60, 800, 560, 'MISSION COMPLETE — ' + r.mission.name);
    txt(ctx, 'GRADE ' + r.grade, 280, 110, 44, r.grade === 'S' ? '#ffd24d' : '#fff', 'left', true);
    txt(ctx, 'Score ' + r.score + '   •   Rings ' + r.ringsHit + '/' + r.totalRings + '   •   Kills ' + r.kills, 280, 172, 17, '#fff', 'left', false);
    txt(ctx, 'Accuracy ' + r.accuracy + '%   •   Time ' + r.time + 's   •   Credits +' + r.credits, 280, 202, 17, '#fff', 'left', false);
    txt(ctx, 'SCORE PER MISSION', 280, 244, 14, '#8fd8ff', 'left', true);
    Dawn.MISSIONS.forEach(function (m, i) {
      var sc = state.scores[i] || 0;
      bar(ctx, 280, 272 + i * 34, 500, 20, Math.min(1, sc / 2500), '#ffd24d', '');
      txt(ctx, m.code + ' ' + sc, 796, 274 + i * 34, 14, '#fff', 'left', false);
    });
    txt(ctx, 'Ratna: "Well flown, Dawn-1. The dawn is ours."', 280, 500, 15, '#ffe9a8', 'left', false);
    txt(ctx, 'ENTER — hangar   R — fly again', 280, 540, 15, '#fff', 'left', true);
  }
  function drawGameOver(ctx, state) {
    drawImg(ctx, img('dawn-sea.jpg'), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(20,6,6,0.62)'; ctx.fillRect(0, 0, 1280, 720);
    panel(ctx, 340, 180, 600, 300, 'DAWN-1 DOWN');
    txt(ctx, state.flight && state.flight.reason ? state.flight.reason : 'Mission failed.', 370, 240, 17, '#ff9a8a', 'left', false);
    txt(ctx, 'The squadron will fly the dawn again.', 370, 280, 16, '#fff', 'left', false);
    txt(ctx, 'Sinta: "Tower to Dawn-1 — we have you on radar. Come home."', 370, 320, 15, '#a8f0c0', 'left', false);
    txt(ctx, 'R — retry mission   ENTER — hangar', 370, 380, 16, '#ffd24d', 'left', true);
  }
  function drawHelp(ctx, state) {
    drawImg(ctx, img('dawn-sea.jpg'), 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(10,16,26,0.7)'; ctx.fillRect(0, 0, 1280, 720);
    panel(ctx, 240, 50, 800, 600, 'HELP — EVERY KEY');
    var keys = ['Arrows / WASD — steer the jet', 'Shift — afterburner (burns fuel fast)', 'Space — cannon', 'F or mouse click — fire missile (needs full lock)', 'C — flare (breaks enemy lock)', 'V — toggle cockpit / chase camera', 'P — pause', 'M — mute sound', 'Enter — confirm / launch', '1-6 — select mission on the map', 'B — buy selected upgrade in hangar', 'S — save to selected slot   L — load slot', 'R — restart / retry', 'H — help   Esc — back'];
    keys.forEach(function (k, i) { txt(ctx, k, 280, 100 + i * 32, 15, '#fff', 'left', false); });
    txt(ctx, 'Esc — back to hangar', 280, 100 + keys.length * 32 + 8, 15, '#ffd24d', 'left', true);
  }
  function drawPause(ctx) {
    ctx.fillStyle = 'rgba(8,12,20,0.6)'; ctx.fillRect(0, 0, 1280, 720);
    panel(ctx, 440, 280, 400, 140, 'PAUSED');
    txt(ctx, 'P — resume    M — mute', 470, 340, 16, '#fff', 'left', false);
  }
  Dawn.Render = {
    draw: function (ctx, state) {
      ctx.clearRect(0, 0, 1280, 720);
      if (state.screen === 'title') drawTitle(ctx, state);
      else if (state.screen === 'hangar') drawHangar(ctx, state);
      else if (state.screen === 'briefing') drawBriefing(ctx, state);
      else if (state.screen === 'flight' && state.flight) {
        drawWorld(ctx, state.flight);
        if (state.flight.view === 'cockpit') drawCockpitFrame(ctx);
        drawHUD(ctx, state.flight, state);
        if (state.paused) drawPause(ctx);
      }
      else if (state.screen === 'results') drawResults(ctx, state);
      else if (state.screen === 'gameover') drawGameOver(ctx, state);
      else if (state.screen === 'help') drawHelp(ctx, state);
    },
    drawWorld: drawWorld, drawHUD: drawHUD, drawCockpitFrame: drawCockpitFrame, box: box, txt: txt, bar: bar, ring: ring
  };
})();
