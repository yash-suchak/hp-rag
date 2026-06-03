import { useState } from 'react';
import styles from './SearchForm.module.css';

const BOOKS = [
  { value: '', label: 'All Seven Books' },
  { value: '1', label: 'Book I — Sorcerer\'s Stone' },
  { value: '2', label: 'Book II — Chamber of Secrets' },
  { value: '3', label: 'Book III — Prisoner of Azkaban' },
  { value: '4', label: 'Book IV — Goblet of Fire' },
  { value: '5', label: 'Book V — Order of the Phoenix' },
  { value: '6', label: 'Book VI — Half-Blood Prince' },
  { value: '7', label: 'Book VII — Deathly Hallows' },
];

export function SearchForm({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [bookNumber, setBookNumber] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmit({ question: question.trim(), bookNumber: bookNumber || null });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <span className={styles.wandIcon}>🪄</span>
        <input
          className={styles.input}
          type="text"
          placeholder="Ask a question of the wizarding world…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <div className={styles.row}>
        <select
          className={styles.select}
          value={bookNumber}
          onChange={e => setBookNumber(e.target.value)}
          disabled={isLoading}
        >
          {BOOKS.map(b => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>

        <button
          className={styles.button}
          type="submit"
          disabled={!question.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spin}>✦</span>
              Summoning&hellip;
            </>
          ) : (
            <>
              <span className={styles.wandTip}>✦</span>
              Accio Answer!
              <span className={styles.wandTip}>✦</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
