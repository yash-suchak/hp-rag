import { useMemo } from 'react';
import styles from './Starfield.module.css';

const COLORS = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffd700', '#c084fc'];

function makeStar(id, r, minOp, maxOp, colorPool) {
  const dur = 2.5 + Math.random() * 7;
  return {
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    r,
    opacity: minOp + Math.random() * (maxOp - minOp),
    color: colorPool[Math.floor(Math.random() * colorPool.length)],
    dur,
    delay: Math.random() * dur,
  };
}

export function Starfield() {
  const stars = useMemo(() => {
    const out = [];
    let id = 0;
    const white = ['#ffffff'];
    const mixed = COLORS;

    for (let i = 0; i < 60; i++) out.push({ ...makeStar(id++, 0.7, 0.1, 0.25, white),  tier: 'dim'    });
    for (let i = 0; i < 70; i++) out.push({ ...makeStar(id++, 1.2, 0.3, 0.58, mixed),  tier: 'medium' });
    for (let i = 0; i < 40; i++) out.push({ ...makeStar(id++, 1.9, 0.5, 0.8,  mixed),  tier: 'bright' });
    for (let i = 0; i < 18; i++) out.push({ ...makeStar(id++, 2.7, 0.65, 0.95, mixed), tier: 'bright' });
    for (let i = 0; i < 8;  i++) out.push({ ...makeStar(id++, 3.8, 0.8, 1.0,  ['#ffffff','#ffd700']), tier: 'bright' });

    return out;
  }, []);

  return (
    <svg className={styles.root} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {stars.map(s => (
        <circle
          key={s.id}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill={s.color}
          opacity={s.opacity}
          className={styles[s.tier]}
          style={{ animationDuration: `${s.dur}s`, animationDelay: `-${s.delay}s` }}
        />
      ))}
    </svg>
  );
}
