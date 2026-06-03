import styles from './Sources.module.css';

const BOOK_COLORS = {
  "Harry Potter and the Sorcerer's Stone.pdf": '#a855f7',
  "Harry Potter and the Chamber of Secrets.pdf": '#3b82f6',
  "Harry Potter and the Prisoner of Azkaban.pdf": '#10b981',
  "Harry Potter and the Goblet of Fire.pdf": '#f59e0b',
  "Harry Potter and the Order of the Phoenix.pdf": '#ef4444',
  "Harry Potter and the Half-Blood Prince.pdf": '#8b5cf6',
  "Harry Potter and the Deathly Hallows.pdf": '#6b7280',
};

const SHORT_TITLES = {
  "Harry Potter and the Sorcerer's Stone.pdf": "Sorcerer's Stone",
  "Harry Potter and the Chamber of Secrets.pdf": "Chamber of Secrets",
  "Harry Potter and the Prisoner of Azkaban.pdf": "Prisoner of Azkaban",
  "Harry Potter and the Goblet of Fire.pdf": "Goblet of Fire",
  "Harry Potter and the Order of the Phoenix.pdf": "Order of the Phoenix",
  "Harry Potter and the Half-Blood Prince.pdf": "Half-Blood Prince",
  "Harry Potter and the Deathly Hallows.pdf": "Deathly Hallows",
};

export function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;

  const unique = sources.filter(
    (s, i, arr) => arr.findIndex(x => x.book === s.book) === i
  );

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Passages retrieved from</p>
      <div className={styles.chips}>
        {unique.map((s, i) => (
          <span
            key={i}
            className={styles.chip}
            style={{ '--chip-color': BOOK_COLORS[s.book] || '#d4af37' }}
          >
            {SHORT_TITLES[s.book] || s.book}
          </span>
        ))}
      </div>
    </div>
  );
}
