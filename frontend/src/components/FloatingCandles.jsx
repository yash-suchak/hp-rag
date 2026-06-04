import styles from './FloatingCandles.module.css';

const CANDLES = [
  { left: '3%',  top: '18%', delay: '0s',    dur: '6s'   },
  { left: '6%',  top: '58%', delay: '2.2s',  dur: '7.5s' },
  { left: '94%', top: '24%', delay: '1s',    dur: '5.8s' },
  { left: '97%', top: '63%', delay: '3.1s',  dur: '6.8s' },
];

export function FloatingCandles() {
  return (
    <div className={styles.root} aria-hidden="true">
      {CANDLES.map((c, i) => (
        <div
          key={i}
          className={styles.candle}
          style={{
            left: c.left,
            top: c.top,
            '--float-delay': c.delay,
            '--float-dur': c.dur,
          }}
        >
          <div className={styles.flame}>
            <div className={styles.flameCore} />
          </div>
          <div className={styles.wick} />
          <div className={styles.body} />
        </div>
      ))}
    </div>
  );
}
