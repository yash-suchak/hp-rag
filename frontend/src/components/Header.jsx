import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.crest}>✦</div>
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
