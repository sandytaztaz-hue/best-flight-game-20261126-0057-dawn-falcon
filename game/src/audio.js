/* DAWN FALCON — WebAudio only: engine hum, ring chime, lock beep, SFX, menu loop. */
(function () {
  'use strict';
  var Dawn = window.Dawn;
  var AudioSys = {
    ctx: null, muted: false, engineOsc: null, engineGain: null, menuTimer: null,
    ensure: function () {
      if (this.ctx || typeof window.AudioContext === 'undefined') return;
      try {
        this.ctx = new window.AudioContext();
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 55;
        this.engineGain.gain.value = 0.0;
        var filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 320;
        this.engineOsc.connect(filt); filt.connect(this.engineGain); this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      } catch (e) { this.ctx = null; }
    },
    setThrottle: function (t) {
      if (!this.ctx || this.muted) return;
      try {
        this.engineGain.gain.value = 0.02 + t * 0.05;
        this.engineOsc.frequency.value = 50 + t * 90;
      } catch (e) {}
    },
    beep: function (freq, dur, type, vol) {
      if (!this.ctx || this.muted) return;
      try {
        var o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'sine'; o.frequency.value = freq || 880;
        g.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (dur || 0.12));
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + (dur || 0.12));
      } catch (e) {}
    },
    ringChime: function (combo) { // pitch rises with combo
      var f = 660 * (1 + (combo - 1) * 0.35);
      this.beep(f, 0.18, 'sine', 0.16); this.beep(f * 1.5, 0.22, 'sine', 0.08);
    },
    lockBeep: function (lock) { this.beep(900 + lock * 900, 0.07, 'square', 0.07); },
    missile: function () { this.beep(300, 0.4, 'sawtooth', 0.12); this.beep(900, 0.3, 'sine', 0.06); },
    cannon: function () { this.beep(140, 0.08, 'square', 0.14); },
    explosion: function () { this.beep(70, 0.6, 'sawtooth', 0.22); this.beep(45, 0.8, 'sine', 0.18); },
    radio: function () { this.beep(1200, 0.05, 'sine', 0.07); this.beep(1500, 0.05, 'sine', 0.07); },
    click: function () { this.beep(700, 0.05, 'sine', 0.08); },
    toggleMute: function () {
      this.muted = !this.muted;
      if (this.engineGain) this.engineGain.gain.value = this.muted ? 0 : 0.04;
      return this.muted;
    },
    startMenuTheme: function () { // short gentle dawn loop, triangle wave
      if (!this.ctx || this.menuTimer) return;
      var notes = [262, 330, 392, 494, 392, 330], i = 0, self = this;
      this.menuTimer = setInterval(function () {
        if (!self.muted) self.beep(notes[i % notes.length], 0.5, 'triangle', 0.05);
        i++;
      }, 420);
    },
    stopMenuTheme: function () { if (this.menuTimer) { clearInterval(this.menuTimer); this.menuTimer = null; } }
  };
  Dawn.Audio = AudioSys;
})();
