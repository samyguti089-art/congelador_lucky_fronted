// ============================================================
// 🔊 EFECTOS DE AUDIO Y VISUALES (Cero dependencias npm)
// ============================================================

// 1. Bip suave al agregar productos o pulsar botones
export const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

// 2. Sonido de caja registradora ("Cha-ching") al cerrar la venta
export const playChaChing = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playTone(987.77, 0, 0.15);     // Nota 1
    playTone(1318.51, 0.1, 0.35);  // Nota 2 (campanilla)
  } catch (e) {}
};

// 3. Lluvia de Confeti puro en pantalla
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
