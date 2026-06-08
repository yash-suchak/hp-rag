import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

describe('Header', () => {
  it('renders the Deathly Hallows SVG crest', () => {
    const { container } = render(<Header />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('polygon')).toBeInTheDocument();
    expect(container.querySelector('circle')).toBeInTheDocument();
    expect(container.querySelector('line')).toBeInTheDocument();
  });

  it('renders the heading text', () => {
    render(<Header />);
    expect(screen.getByText(/Hogwarts Oracle/i)).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<Header />);
    expect(
      screen.getByText(/Seek knowledge from the seven sacred tomes/i)
    ).toBeInTheDocument();
  });

  it('renders lightning bolt divider', () => {
    const { container } = render(<Header />);
    const divider = container.querySelector('header > div');
    expect(divider).toBeInTheDocument();
    // The divider contains ⚡ characters
    expect(divider.textContent).toContain('⚡');
  });
});
