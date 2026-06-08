import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock hooks with DOM side-effects
vi.mock('../hooks/useSparks', () => ({ useSparks: vi.fn() }));
vi.mock('../hooks/useLumos', () => ({ useLumos: vi.fn() }));

// Mock decorative background components so they don't interfere
vi.mock('../components/FloatingCandles', () => ({ FloatingCandles: () => null }));
vi.mock('../components/Starfield', () => ({ Starfield: () => null }));

// Mock LumosOverlay — we test it in isolation in LumosOverlay.test.jsx.
// Here we only care about whether App renders it based on sessionStorage.
vi.mock('../components/LumosOverlay', () => ({
  LumosOverlay: ({ onComplete }) => (
    <div data-testid="lumos-overlay">
      <button data-testid="lumos-complete" onClick={onComplete}>
        Complete Lumos
      </button>
    </div>
  ),
}));

const MOCK_RESPONSE = {
  answer: 'Harry Potter is the Boy Who Lived.',
  sources: [
    { book: "Harry Potter and the Sorcerer's Stone", book_number: 1, score: 0.95 },
  ],
};

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  // ---------- LumosOverlay visibility ----------

  it('renders the LumosOverlay when sessionStorage does NOT have lumos_cast', () => {
    render(<App />);
    expect(screen.getByTestId('lumos-overlay')).toBeInTheDocument();
  });

  it('does NOT render the LumosOverlay when sessionStorage has lumos_cast', () => {
    sessionStorage.setItem('lumos_cast', '1');
    render(<App />);
    expect(screen.queryByTestId('lumos-overlay')).not.toBeInTheDocument();
  });

  it('hides the LumosOverlay after onComplete is called', async () => {
    render(<App />);
    expect(screen.getByTestId('lumos-overlay')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('lumos-complete'));
    expect(screen.queryByTestId('lumos-overlay')).not.toBeInTheDocument();
  });

  // ---------- Core layout ----------

  it('renders the Header', () => {
    sessionStorage.setItem('lumos_cast', '1');
    render(<App />);
    expect(screen.getByText(/Hogwarts Oracle/i)).toBeInTheDocument();
  });

  it('renders the SearchForm input and button', () => {
    sessionStorage.setItem('lumos_cast', '1');
    render(<App />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accio answer/i })).toBeInTheDocument();
  });

  it('renders the footer', () => {
    sessionStorage.setItem('lumos_cast', '1');
    render(<App />);
    expect(screen.getByText(/powered by hogwarts/i)).toBeInTheDocument();
  });

  // ---------- Successful API call ----------

  it('shows answer in AnswerBox after a successful query', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    }));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Who is Harry?');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText('H')).toBeInTheDocument();
    });
  });

  it('shows sources after a successful query', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    }));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Who is Harry?');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/passages retrieved from/i)).toBeInTheDocument();
    });
  });

  it('sends the correct payload to the API (no book selected)', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Who is Hermione?');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/ask');
    const body = JSON.parse(opts.body);
    expect(body.question).toBe('Who is Hermione?');
    expect(body.book_number).toBeNull();
  });

  // Fix 2 — parseInt(bookNumber) branch: ensures value is sent as integer not string
  it('sends book_number as an integer when a book is selected', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await userEvent.selectOptions(
      screen.getByRole('combobox'),
      'Book III — Prisoner of Azkaban'
    );
    await userEvent.type(screen.getByRole('textbox'), 'Who is Sirius?');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.book_number).toBe(3);        // integer, not string '3'
    expect(typeof body.book_number).toBe('number');
  });

  it('shows loading state while fetching', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    let resolvePromise;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(
      new Promise(resolve => { resolvePromise = resolve; })
    ));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'A question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    // While loading, spinner should appear
    expect(screen.getByText(/consulting the ancient tomes/i)).toBeInTheDocument();

    // Cleanup
    resolvePromise({ ok: true, json: async () => MOCK_RESPONSE });
    await waitFor(() => expect(screen.queryByText(/consulting/i)).not.toBeInTheDocument());
  });

  it('sources do NOT appear while loading', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    let resolvePromise;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(
      new Promise(resolve => { resolvePromise = resolve; })
    ));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Another question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    expect(screen.queryByText(/passages retrieved from/i)).not.toBeInTheDocument();

    resolvePromise({ ok: true, json: async () => MOCK_RESPONSE });
    await waitFor(() => screen.getByText(/passages retrieved from/i));
  });

  // ---------- Failed API call (non-ok response) ----------

  it('shows error message when API returns non-ok status', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal Server Error' }),
    }));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'A bad question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error when API non-ok response json fails', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new Error('bad json'); },
    }));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/error 503/i)).toBeInTheDocument();
    });
  });

  // ---------- Network error ----------

  it('shows error message when fetch throws a network error', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'A question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows generic fallback when error has no message', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    // Throw an error-like object without a message
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue({}));

    render(<App />);
    await userEvent.type(screen.getByRole('textbox'), 'Question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // ---------- State reset on new query ----------

  it('clears previous answer when a new query starts', async () => {
    sessionStorage.setItem('lumos_cast', '1');

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RESPONSE })
      .mockReturnValueOnce(new Promise(() => {})) // second call stays pending
    );

    render(<App />);
    const input = screen.getByRole('textbox');

    // First query
    await userEvent.type(input, 'First question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));
    await waitFor(() => screen.getByText('H'));

    // Second query — clear and retype
    await userEvent.clear(input);
    await userEvent.type(input, 'Second question');
    await userEvent.click(screen.getByRole('button', { name: /accio answer/i }));

    // During second fetch: sources label from first query must be gone
    expect(screen.queryByText(/passages retrieved from/i)).not.toBeInTheDocument();
  });
});
