import { useEffect, useRef } from 'react';

const COLORS = ['#ffd700', '#ffaa00', '#ff8800', '#ff6600', '#fff0a0', '#c084fc'];

export function useSparks() {
  const lastTouchTime = useRef(0);

  useEffect(() => {
    const root = document.getElementById('sparks-root');
    if (!root) return;

    function spawnSparks(x, y) {
      const count = 12 + Math.floor(Math.random() * 6);

      for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';

        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed;
        const size = 3 + Math.random() * 5;
        const duration = 350 + Math.random() * 350;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        spark.style.cssText = `
          left: ${x - size / 2}px;
          top: ${y - size / 2}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          box-shadow: 0 0 ${size * 2}px ${color};
          --tx: ${tx}px;
          --ty: ${ty}px;
          --duration: ${duration}ms;
        `;

        root.appendChild(spark);
        setTimeout(() => spark.remove(), duration + 50);
      }
    }

    function onTouch(e) {
      const t = e.touches[0];
      if (!t) return;
      lastTouchTime.current = Date.now();
      spawnSparks(t.clientX, t.clientY);
    }

    function onClick(e) {
      // Suppress the synthetic click that fires ~300ms after a touch
      if (Date.now() - lastTouchTime.current < 500) return;
      spawnSparks(e.clientX, e.clientY);
    }

    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('click', onClick);
    };
  }, []);
}
