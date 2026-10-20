// ============================================================
// 🔊 EFECTOS DE AUDIO Y VISUALES (Calibrados y Potentes)
// ============================================================

// Canal de audio único compartido
let audioCtx = null;

const getAudioContext = async () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return audioCtx;
};

// 1. BIP de producto (Claro, nítido y con duración perceptible)
export const playBeep = async () => {
  try {
    const ctx = await getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frecuencia agradable (950 Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, ctx.currentTime);

    // Volumen audible (0.35) con caída suave
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {
    console.warn('Audio no permitido por el navegador:', e);
  }
};

// 2. CAJA REGISTRADORA ("Cha-Ching" brillante de 2 tonos)
export const playChaChing = async () => {
  try {
    const ctx = await getAudioContext();
    const ahora = ctx.currentTime;

    // Primer tono (Moneda 1 - 1050 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1050, ahora);
    gain1.gain.setValueAtTime(0.4, ahora);
    gain1.gain.exponentialRampToValueAtTime(0.01, ahora + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ahora);
    osc1.stop(ahora + 0.18);

    // Segundo tono (Campana aguda de caja registradora - 1560 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1560, ahora + 0.1);
    gain2.gain.setValueAtTime(0.45, ahora + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ahora + 0.1);
    osc2.stop(ahora + 0.55);
  } catch (e) {
    console.warn('Audio no permitido por el navegador:', e);
  }
};

// 3. Lluvia de Confeti puro
export const launchConfetti = () => {
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  for (let i = 0; i < 45; i++) {
    const p = document.createElement('div');
    p.className = 'pos-confetti-particle';
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${50 + (Math.random() * 30 - 15)}%`;
    p.style.top = '45%';
    p.style.setProperty('--tx', `${(Math.random() - 0.5) * 500}px`);
    p.style.setProperty('--ty', `${Math.random() * 350 - 180}px`);
    p.style.setProperty('--rot', `${Math.random() * 360}deg`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
};
