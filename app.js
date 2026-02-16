// ========================================
// Harmonic Lab — app.js
// Secciones: State, UI Bindings, Audio, Visual, MIDI (preparado)
// ========================================

// ---- STATE ----
const state = {
  freq: 440,
  harmonic: 1,
  duty: 0.5,
  mix: 50,         // 0 = solo fundamental, 100 = solo armónico
  vibrato: false,
  bitcrush: false,
  bitcrushIntensity: 8,
  audioReady: false,
  autoPlay: false,
  animTime: 0,
};

// ---- UI BINDINGS ----
const ui = {
  freqSlider: document.getElementById('freqSlider'),
  freqValue: document.getElementById('freqValue'),
  harmonicSlider: document.getElementById('harmonicSlider'),
  harmonicValue: document.getElementById('harmonicValue'),
  dutySelect: document.getElementById('dutySelect'),
  mixSlider: document.getElementById('mixSlider'),
  mixValue: document.getElementById('mixValue'),
  audioOnBtn: document.getElementById('audioOnBtn'),
  playBtn: document.getElementById('playBtn'),
  autoBtn: document.getElementById('autoBtn'),
  vibratoCheck: document.getElementById('vibratoCheck'),
  bitcrushCheck: document.getElementById('bitcrushCheck'),
  bitcrushSlider: document.getElementById('bitcrushSlider'),
  bitcrushValue: document.getElementById('bitcrushValue'),
  bitcrushIntensityLabel: document.getElementById('bitcrushIntensityLabel'),
  waveSvg: document.getElementById('waveSvg'),
  wavePath: document.getElementById('wavePath'),
  nodesGroup: document.getElementById('nodesGroup'),
};

// Slider / select bindings
ui.freqSlider.addEventListener('input', () => {
  state.freq = Number(ui.freqSlider.value);
  ui.freqValue.textContent = state.freq;
});

ui.harmonicSlider.addEventListener('input', () => {
  state.harmonic = Number(ui.harmonicSlider.value);
  ui.harmonicValue.textContent = state.harmonic;
  updateNodes();
});

ui.dutySelect.addEventListener('change', () => {
  state.duty = Number(ui.dutySelect.value);
});

ui.mixSlider.addEventListener('input', () => {
  state.mix = Number(ui.mixSlider.value);
  ui.mixValue.textContent = state.mix;
});

ui.vibratoCheck.addEventListener('change', () => {
  state.vibrato = ui.vibratoCheck.checked;
});

ui.bitcrushCheck.addEventListener('change', () => {
  state.bitcrush = ui.bitcrushCheck.checked;
  ui.bitcrushIntensityLabel.classList.toggle('hidden', !state.bitcrush);
});

ui.bitcrushSlider.addEventListener('input', () => {
  state.bitcrushIntensity = Number(ui.bitcrushSlider.value);
  ui.bitcrushValue.textContent = state.bitcrushIntensity;
});

ui.audioOnBtn.addEventListener('click', initAudio);
ui.playBtn.addEventListener('click', playNote);
ui.autoBtn.addEventListener('click', toggleAuto);

// ---- AUDIO ----
let audioCtx = null;
let masterGain = null;
let autoInterval = null;

function initAudio() {
  if (audioCtx) {
    audioCtx.resume();
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.35; // ganancia conservadora
  masterGain.connect(audioCtx.destination);

  state.audioReady = true;
  ui.audioOnBtn.classList.add('active');
  ui.audioOnBtn.textContent = 'Audio OK';
  ui.playBtn.disabled = false;
  ui.autoBtn.disabled = false;
}

/**
 * Genera un PeriodicWave para onda de pulso con un duty cycle dado.
 * Se construyen los coeficientes de Fourier de una onda rectangular
 * con ancho `duty` (0–1).
 */
function buildPulseWave(ctx, duty, numHarmonics) {
  numHarmonics = numHarmonics || 64;
  const real = new Float32Array(numHarmonics);
  const imag = new Float32Array(numHarmonics);
  real[0] = 0;
  imag[0] = 0;
  for (let k = 1; k < numHarmonics; k++) {
    // Coeficiente de Fourier para onda de pulso: (2/(k*pi)) * sin(k*pi*duty)
    real[k] = 0;
    imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

/**
 * Crea un nodo de bitcrush simple usando un ScriptProcessorNode
 * (sample-and-hold / cuantización temporal).
 */
function createBitcrushNode(ctx, intensity) {
  const bufferSize = 4096;
  const node = ctx.createScriptProcessor(bufferSize, 1, 1);
  let lastSample = 0;
  let counter = 0;
  node.onaudioprocess = function (e) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    const step = Math.max(1, Math.round(intensity));
    for (let i = 0; i < input.length; i++) {
      if (counter % step === 0) {
        lastSample = input[i];
      }
      output[i] = lastSample;
      counter++;
    }
  };
  return node;
}

/**
 * Toca una nota corta (~0.3s) con envelope rápido.
 * Dos canales de pulso: fundamental (f0) y armónico (f0*n).
 * Segundo canal con detune aleatorio +/- 5 cents (estilo Game Boy).
 */
function playNote() {
  if (!state.audioReady || !audioCtx) return;

  const now = audioCtx.currentTime;
  const f0 = state.freq;
  const n = state.harmonic;
  const duty = state.duty;
  const mixRatio = state.mix / 100; // 0 = fundamental, 1 = armónico

  const pulseWave = buildPulseWave(audioCtx, duty);

  // Ganancias de mezcla
  const gainFund = 1 - mixRatio;
  const gainHarm = mixRatio;

  // Detune aleatorio para efecto Game Boy (±5 cents)
  const detuneA = (Math.random() - 0.5) * 10; // -5 a +5 cents
  const detuneB = (Math.random() - 0.5) * 10;

  // ---- Canal 1: Fundamental ----
  const osc1 = audioCtx.createOscillator();
  osc1.setPeriodicWave(pulseWave);
  osc1.frequency.value = f0;
  osc1.detune.value = detuneA;

  const gain1 = audioCtx.createGain();
  gain1.gain.value = 0;

  // ---- Canal 2: Armónico ----
  const osc2 = audioCtx.createOscillator();
  osc2.setPeriodicWave(pulseWave);
  osc2.frequency.value = f0 * n;
  osc2.detune.value = detuneB;

  const gain2 = audioCtx.createGain();
  gain2.gain.value = 0;

  // ---- Vibrato (LFO) ----
  let lfo1, lfo2, lfoGain1, lfoGain2;
  if (state.vibrato) {
    const lfoFreq = 5 + Math.random() * 2; // 5–7 Hz
    const lfoDepth = 3; // cents

    lfo1 = audioCtx.createOscillator();
    lfo1.frequency.value = lfoFreq;
    lfoGain1 = audioCtx.createGain();
    lfoGain1.gain.value = lfoDepth;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(osc1.detune);
    lfo1.start(now);
    lfo1.stop(now + 0.4);

    lfo2 = audioCtx.createOscillator();
    lfo2.frequency.value = lfoFreq;
    lfoGain2 = audioCtx.createGain();
    lfoGain2.gain.value = lfoDepth;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(osc2.detune);
    lfo2.start(now);
    lfo2.stop(now + 0.4);
  }

  // ---- Nodo sumador ----
  const sumGain = audioCtx.createGain();
  sumGain.gain.value = 1;

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(sumGain);
  gain2.connect(sumGain);

  // ---- Bitcrush (opcional) ----
  let outputNode = sumGain;
  let bitcrushNode = null;
  if (state.bitcrush) {
    bitcrushNode = createBitcrushNode(audioCtx, state.bitcrushIntensity);
    sumGain.connect(bitcrushNode);
    outputNode = bitcrushNode;
  }

  outputNode.connect(masterGain);

  // ---- Envelope (attack 10ms, decay 250ms) ----
  const attack = 0.01;
  const decay = 0.25;
  const peakFund = gainFund * 0.5;
  const peakHarm = gainHarm * 0.5;

  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(peakFund, now + attack);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(peakHarm, now + attack);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.35);
  osc2.stop(now + 0.35);

  // Limpieza
  const cleanup = () => {
    try {
      osc1.disconnect();
      osc2.disconnect();
      gain1.disconnect();
      gain2.disconnect();
      sumGain.disconnect();
      if (bitcrushNode) bitcrushNode.disconnect();
    } catch (_) { /* ya desconectado */ }
  };
  osc1.onended = cleanup;
}

function toggleAuto() {
  state.autoPlay = !state.autoPlay;
  ui.autoBtn.classList.toggle('active', state.autoPlay);
  ui.autoBtn.textContent = state.autoPlay ? 'Auto ON' : 'Auto';

  if (state.autoPlay) {
    // 120 bpm = 500ms por beat
    playNote();
    autoInterval = setInterval(playNote, 500);
  } else {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

// ---- VISUAL (SVG standing wave) ----
const SVG_W = 800;
const SVG_H = 220;
const SVG_MID = SVG_H / 2;
const AMP = 85;

/**
 * Dibuja los nodos (puntos donde sin(n*pi*x)=0)
 */
function updateNodes() {
  const n = state.harmonic;
  const group = ui.nodesGroup;
  // Limpiar nodos previos
  while (group.firstChild) group.removeChild(group.firstChild);

  // Nodos en x = k/n para k = 0..n
  for (let k = 0; k <= n; k++) {
    const xNorm = k / n;
    const cx = xNorm * SVG_W;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', SVG_MID);
    circle.setAttribute('r', 5);
    circle.setAttribute('class', 'node-circle');
    group.appendChild(circle);
  }
}

/**
 * Loop de animación: dibuja y(x,t) = sin(n*pi*x) * sin(omega*t)
 */
let lastTimestamp = 0;

function animationLoop(timestamp) {
  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // omega basado en la frecuencia fundamental (visual más lento para legibilidad)
  const omega = 2 * Math.PI * 2; // 2 Hz visual
  state.animTime += dt;

  const n = state.harmonic;
  const sinT = Math.sin(omega * state.animTime);

  // Construir path
  const steps = 200;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const xNorm = i / steps;
    const x = xNorm * SVG_W;
    const y = SVG_MID - AMP * Math.sin(n * Math.PI * xNorm) * sinT;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  ui.wavePath.setAttribute('d', d);

  requestAnimationFrame(animationLoop);
}

// Arrancar animación y nodos iniciales
updateNodes();
requestAnimationFrame(animationLoop);

// ---- MIDI STATE (preparado para WebMIDI — sin implementar todavía) ----

/**
 * Arquitectura preparada para WebMIDI.
 *
 * Cuando se implemente:
 * 1. Llamar a navigator.requestMIDIAccess()
 * 2. Listar outputs en midiState.availableDevices
 * 3. Conectar al dispositivo seleccionado → midiState.selectedOutput
 * 4. Usar sendNoteOn / sendNoteOff / sendPitchBend para comunicarse
 *    con un sintetizador externo (p.ej. Arturia MicroFreak).
 *
 * En index.html se deberá añadir:
 *   - <select id="midiDeviceSelect"> para elegir dispositivo
 *   - <button id="midiConnectBtn"> para conectar
 *   - Controles opcionales de canal MIDI, pitch bend range, etc.
 */
const midiState = {
  available: false,          // ¿WebMIDI está disponible en el navegador?
  access: null,              // MIDIAccess object
  availableDevices: [],      // Lista de MIDIOutput
  selectedOutput: null,      // MIDIOutput activo
  channel: 0,               // Canal MIDI (0–15)
  lastNote: null,            // Última nota enviada (para NoteOff)
};

/**
 * Placeholder: inicializar WebMIDI.
 * Llamar cuando el usuario pulse "Connect MIDI".
 */
function initMIDI() {
  // TODO: implementar
  // if (navigator.requestMIDIAccess) {
  //   navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
  // }
  console.log('[MIDI] initMIDI() — pendiente de implementar');
}

/**
 * Placeholder: enviar NoteOn.
 * @param {number} note — nota MIDI (0–127)
 * @param {number} velocity — velocidad (0–127)
 */
function sendNoteOn(note, velocity) {
  if (!midiState.selectedOutput) return;
  // TODO: midiState.selectedOutput.send([0x90 | midiState.channel, note, velocity]);
  console.log('[MIDI] NoteOn', note, velocity);
}

/**
 * Placeholder: enviar NoteOff.
 * @param {number} note — nota MIDI (0–127)
 */
function sendNoteOff(note) {
  if (!midiState.selectedOutput) return;
  // TODO: midiState.selectedOutput.send([0x80 | midiState.channel, note, 0]);
  console.log('[MIDI] NoteOff', note);
}

/**
 * Placeholder: enviar Pitch Bend.
 * @param {number} value — valor de pitch bend (0–16383, 8192 = centro)
 */
function sendPitchBend(value) {
  if (!midiState.selectedOutput) return;
  // const lsb = value & 0x7F;
  // const msb = (value >> 7) & 0x7F;
  // TODO: midiState.selectedOutput.send([0xE0 | midiState.channel, lsb, msb]);
  console.log('[MIDI] PitchBend', value);
}

/**
 * Placeholder: convertir frecuencia a nota MIDI más cercana.
 * @param {number} freq — frecuencia en Hz
 * @returns {number} nota MIDI (0–127)
 */
function freqToMidi(freq) {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}
