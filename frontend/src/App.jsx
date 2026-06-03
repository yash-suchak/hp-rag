import { useState } from 'react';
import './App.css';
import { useSparks } from './hooks/useSparks';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { AnswerBox } from './components/AnswerBox';
import { Sources } from './components/Sources';

const API_URL = 'http://localhost:8000';

export default function App() {
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useSparks();

  async function handleQuery({ question, bookNumber }) {
    setIsLoading(true);
    setAnswer('');
    setSources([]);
    setError('');

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          book_number: bookNumber ? parseInt(bookNumber, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <Header />

      <main className="main">
        <SearchForm onSubmit={handleQuery} isLoading={isLoading} />

        {error && (
          <p className="error">{error}</p>
        )}

        <AnswerBox answer={answer} isLoading={isLoading} />

        {!isLoading && answer && (
          <Sources sources={sources} />
        )}
      </main>

      <footer className="footer">
        <p>✦ &nbsp;Powered by Hogwarts archives &amp; Claude&nbsp;&nbsp;✦</p>
      </footer>
    </div>
  );
}
