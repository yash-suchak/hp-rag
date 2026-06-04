import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <svg className={styles.crest} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="50,5 5,110 95,110" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="50" cy="78" r="24" stroke="currentColor" strokeWidth="3" />
        <line x1="50" y1="5" x2="50" y2="110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h1 className={styles.title}>Platform 9¾</h1>
      <p className={styles.subtitle}>
        Seek knowledge from the seven sacred tomes
      </p>
      <div className={styles.divider}>
        <span>⚡</span>
        <span className={styles.line} />
        <span>⚡</span>
      </div>
    </header>
  );
}
