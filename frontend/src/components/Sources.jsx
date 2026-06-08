import styles from './Sources.module.css';

const BOOK_COLORS = {
  "Harry Potter and the Sorcerer's Stone": '#a855f7',
  "Harry Potter and the Chamber of Secrets": '#3b82f6',
  "Harry Potter and the Prisoner of Azkaban": '#10b981',
  "Harry Potter and the Goblet of Fire": '#f59e0b',
  "Harry Potter and the Order of the Phoenix": '#ef4444',
  "Harry Potter and the Half-Blood Prince": '#8b5cf6',
  "Harry Potter and the Deathly Hallows": '#6b7280',
};

const SHORT_TITLES = {
  "Harry Potter and the Sorcerer's Stone": "Sorcerer's Stone",
  "Harry Potter and the Chamber of Secrets": "Chamber of Secrets",
  "Harry Potter and the Prisoner of Azkaban": "Prisoner of Azkaban",
  "Harry Potter and the Goblet of Fire": "Goblet of Fire",
  "Harry Potter and the Order of the Phoenix": "Order of the Phoenix",
  "Harry Potter and the Half-Blood Prince": "Half-Blood Prince",
  "Harry Potter and the Deathly Hallows": "Deathly Hallows",
};

export function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;

  const sorted = [...sources].sort((a, b) => a.book_number - b.book_number);

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Passages retrieved from</p>
      <div className={styles.chips}>
        {sorted.map((s) => (
          <span
            key={s.book_number}
            className={styles.chip}
            style={{ '--chip-color': BOOK_COLORS[s.book] || '#d4af37' }}
          >
            [{s.book_number}] {SHORT_TITLES[s.book] || s.book}
          </span>
        ))}
      </div>
    </div>
  );
}
