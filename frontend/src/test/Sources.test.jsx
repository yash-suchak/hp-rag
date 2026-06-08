import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sources } from '../components/Sources';

const SAMPLE_SOURCES = [
  { book: "Harry Potter and the Sorcerer's Stone", book_number: 1, score: 0.9 },
  { book: "Harry Potter and the Chamber of Secrets", book_number: 2, score: 0.8 },
];

describe('Sources', () => {
  it('does not render when sources is empty array', () => {
    const { container } = render(<Sources sources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when sources is undefined', () => {
    const { container } = render(<Sources />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when sources is null', () => {
    const { container } = render(<Sources sources={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the label when sources are present', () => {
    render(<Sources sources={SAMPLE_SOURCES} />);
    expect(screen.getByText(/passages retrieved from/i)).toBeInTheDocument();
  });

  it('renders a chip for each source', () => {
    const { container } = render(<Sources sources={SAMPLE_SOURCES} />);
    // Each chip is a span with class "chip"
    const chips = container.querySelectorAll('span');
    expect(chips.length).toBe(SAMPLE_SOURCES.length);
  });

  it('chip text includes the shortened book title', () => {
    render(<Sources sources={SAMPLE_SOURCES} />);
    expect(screen.getByText(/Sorcerer's Stone/i)).toBeInTheDocument();
    expect(screen.getByText(/Chamber of Secrets/i)).toBeInTheDocument();
  });

  it('chip text includes the book number prefix [N]', () => {
    render(<Sources sources={SAMPLE_SOURCES} />);
    expect(screen.getByText(/\[1\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[2\]/)).toBeInTheDocument();
  });

  it('chips are sorted by book_number', () => {
    const reversed = [
      { book: "Harry Potter and the Chamber of Secrets", book_number: 2, score: 0.8 },
      { book: "Harry Potter and the Sorcerer's Stone", book_number: 1, score: 0.9 },
    ];
    const { container } = render(<Sources sources={reversed} />);
    const chips = container.querySelectorAll('span');
    // First chip should be book 1
    expect(chips[0].textContent).toContain('[1]');
    expect(chips[1].textContent).toContain('[2]');
  });

  it('uses fallback book name when title is not in SHORT_TITLES map', () => {
    const unknownSources = [
      { book: 'Some Unknown Book', book_number: 99, score: 0.5 },
    ];
    render(<Sources sources={unknownSources} />);
    expect(screen.getByText(/Some Unknown Book/)).toBeInTheDocument();
  });

  it('chip has a --chip-color CSS variable from BOOK_COLORS', () => {
    const { container } = render(<Sources sources={[SAMPLE_SOURCES[0]]} />);
    const chip = container.querySelector('span');
    // identity-obj-proxy returns class name as string; CSS variable is set via style
    expect(chip.style.getPropertyValue('--chip-color')).toBe('#a855f7');
  });

  it('chip uses fallback gold color for unknown book', () => {
    const { container } = render(
      <Sources sources={[{ book: 'Unknown Book', book_number: 99, score: 0.5 }]} />
    );
    const chip = container.querySelector('span');
    expect(chip.style.getPropertyValue('--chip-color')).toBe('#d4af37');
  });
});
