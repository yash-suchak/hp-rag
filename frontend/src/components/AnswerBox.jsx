import { useMemo } from 'react';
import styles from './AnswerBox.module.css';

export function AnswerBox({ answer, isLoading }) {
  const chars = useMemo(() => {
    if (!answer) return [];
    return answer.split('').map((char, i) => ({ char, i }));
  }, [answer]);

  if (!answer && !isLoading) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.cornerTL} />
      <div className={styles.cornerTR} />
      <div className={styles.cornerBL} />
      <div className={styles.cornerBR} />

      {isLoading ? (
        <div className={styles.loading}>
          <span className={styles.spinner}>✦</span>
          <span className={styles.loadingText}>Consulting the ancient tomes&hellip;</span>
        </div>
      ) : (
        <p className={styles.text}>
          {chars.map(({ char, i }) => (
            <span
              key={i}
              className={styles.char}
              style={{ animationDelay: `${i * 16}ms` }}
            >
              {char === '\n' ? <br /> : char}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
