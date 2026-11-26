/* DAWN FALCON — Fog Archipelago Ring Run. Config: missions, crew, upgrades, weather. */
(function () {
  'use strict';
  var Dawn = window.Dawn || (window.Dawn = {});
  Dawn.W = 1280; Dawn.H = 720;
  Dawn.CREW = {
    ratna: { name: 'Ratna "Merpati" Dewi', role: 'Commander — Squadron Leader', mood: 'warm but strict', color: '#ffd27a',
      line: 'Dawn-1, the fog is thick but the rings are lit. Fly the line, trust your radar, come home.' },
    yoga: { name: 'Yoga "Swift" Pratama', role: 'Lieutenant — Wingman', mood: 'eager', color: '#8fd8ff',
      line: 'Ring dead ahead, Dawn-1! I have got your six — punch the burner and take it!' },
    sinta: { name: 'Sinta "Tower" Lestari', role: 'Officer — Island Control', mood: 'calm', color: '#a8f0c0',
      line: 'Tower to Dawn-1: vector 045, next ring bearing 045, fog bank at two miles. Steady.' },
    budi: { name: 'Budi "Spark" Hartono', role: 'Chief — Strip Mechanic', mood: 'cheerful', color: '#ffb08a',
      line: 'She is fuelled, armed and shiny, boss! Spend those credits — my wrenches are hungry!' },
    ghost: { name: 'Ghost', role: 'Hidden Ace — Crimson Wake', mood: 'cold, taunting', color: '#c9c9d6',
      line: 'So the little dawn bird finally found me. You fly well… for a mailman.' }
  };
  Dawn.MISSIONS = [
    { id: 1, name: 'FIRST LIGHT', code: 'M1', bg: 'island-strip.jpg', weather: 'Dawn fog, pink light',
      goal: 'Take off from the island strip and fly ring 1 over the lagoon.',
      briefing: 'Ratna: First light, Dawn-1. Runway ahead in the pink light — lift off clean, ring 1 waits over the lagoon.',
      rings: 4, enemies: 1, boats: 0, escort: false, ghost: false, time: 150, reward: 400 },
    { id: 2, name: 'FOG GAPS', code: 'M2', bg: 'dawn-sea.jpg', weather: 'Thick fog banks, green islands',
      goal: 'Ring-run through fog gaps between the green islands. Radar pings reveal the next ring.',
      briefing: 'Sinta: Fog hides the rings until you are close, Dawn-1. Watch the radar ping — it never lies.',
      rings: 6, enemies: 2, boats: 0, escort: false, ghost: false, time: 180, reward: 550 },
    { id: 3, name: 'LIGHTHOUSE DEFENSE', code: 'M3', bg: 'lighthouse-fog.jpg', weather: 'Fog, sweeping lighthouse beam',
      goal: 'Defend the lighthouse and the fishing fleet from raider boats.',
      briefing: 'Ratna: The lighthouse beam is our eye in the fog. Keep the fleet alive — every boat counts.',
      rings: 3, enemies: 3, boats: 4, escort: false, ghost: false, time: 200, reward: 700 },
    { id: 4, name: 'VOLCANO PASS', code: 'M4', bg: 'volcano-dawn.jpg', weather: 'Ash haze, hot updrafts',
      goal: 'Dawn run past the volcano island, rings in the ash haze.',
      briefing: 'Yoga: Updrafts over the volcano will throw you around — ride them, do not fight them!',
      rings: 5, enemies: 3, boats: 0, escort: false, ghost: false, time: 180, reward: 750 },
    { id: 5, name: 'CARGO ESCORT', code: 'M5', bg: 'dawn-sea.jpg', weather: 'Fog, raider jets on the escort',
      goal: 'Escort the seaplane through the fog to the far strip.',
      briefing: 'Sinta: The seaplane is slow and fat, Dawn-1. Raiders will come for it — be its shadow.',
      rings: 4, enemies: 5, boats: 0, escort: true, ghost: false, time: 220, reward: 900 },
    { id: 6, name: 'GHOST AT DAWN', code: 'M6', bg: 'fog-break.jpg', weather: 'Sun breaking through cloud',
      goal: 'Duel Ghost above the fog sea as the sun breaks through. Win and the war ends.',
      briefing: 'Ghost: So the little dawn bird finally found me. — Ratna: End this, Dawn-1. All of us are with you.',
      rings: 2, enemies: 1, boats: 0, escort: false, ghost: true, time: 240, reward: 1500 }
  ];
  Dawn.UPGRADES = [
    { id: 'sensor', name: 'Ring Sensor', desc: 'Rings ping farther on radar', price: 300, max: 3, effect: 'Radar range +35% / level' },
    { id: 'lamps', name: 'Fog Lamps', desc: 'See rings through fog sooner', price: 350, max: 3, effect: 'Ring visibility +30% / level' },
    { id: 'rack', name: 'Missile Rack', desc: '+2 missiles per level', price: 400, max: 3, effect: '+2 missiles / level' },
    { id: 'flares', name: 'Flare Pack', desc: '+4 flares per level', price: 250, max: 3, effect: '+4 flares / level' },
    { id: 'armor', name: 'Armor Plating', desc: '+40 hull per level', price: 450, max: 3, effect: '+40 max hull / level' },
    { id: 'engine', name: 'Afterburner Engine', desc: 'Higher top speed', price: 500, max: 3, effect: '+12% top speed / level' },
    { id: 'tank', name: 'Drop Tank', desc: '+fuel per level', price: 300, max: 3, effect: '+25 max fuel / level' }
  ];
  Dawn.BASE = { credits: 600, missiles: 4, flares: 4, hull: 100, fuel: 100, speed: 420 };
  Dawn.RING_POINTS = 100; // per ring, before combo multiplier
  Dawn.KILL_POINTS = 250; // per enemy or boat destroyed
  Dawn.saveKey = 'dawn-falcon-save-v1';
  window.Dawn = Dawn;
})();
