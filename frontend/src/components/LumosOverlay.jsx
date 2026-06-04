import { useState, useCallback, useEffect } from 'react';
import { useLumos } from '../hooks/useLumos';
import styles from './LumosOverlay.module.css';

export function LumosOverlay({ onComplete }) {
  const [phase, setPhase] = useState('covering'); // covering | casting | revealing
  const [bloom, setBloom] = useState(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleCast = useCallback(({ x, y }) => {
    setBloom({ x, y });
    setPhase('casting');
    setTimeout(() => setPhase('revealing'), 2200);
    setTimeout(() => {
      sessionStorage.setItem('lumos_cast', '1');
      onComplete();
    }, 3000);
  }, [onComplete]);

  useLumos(handleCast);

  return (
    <div className={`${styles.overlay} ${phase === 'revealing' ? styles.revealing : ''}`}>
      {phase === 'covering' && showHint && (
        <p className={styles.hint}>✦&nbsp; Wave your wand in a circle to cast Lumos &nbsp;✦</p>
      )}
      {bloom && (
        <div
          className={styles.bloom}
          style={{ left: bloom.x, top: bloom.y }}
        />
      )}
      {(phase === 'casting' || phase === 'revealing') && (
        <span className={styles.lumos}>Lumos ✦</span>
      )}
    </div>
  );
}
