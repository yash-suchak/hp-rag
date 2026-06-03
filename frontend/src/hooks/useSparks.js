import { useEffect } from 'react';

const COLORS = ['#ffd700', '#ffaa00', '#ff8800', '#ff6600', '#fff0a0', '#c084fc'];

export function useSparks() {
  useEffect(() => {
    const root = document.getElementById('sparks-root');
    if (!root) return;

    function spawnSparks(e) {
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
          left: ${e.clientX - size / 2}px;
          top: ${e.clientY - size / 2}px;
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

    window.addEventListener('click', spawnSparks);
    return () => window.removeEventListener('click', spawnSparks);
  }, []);
}
