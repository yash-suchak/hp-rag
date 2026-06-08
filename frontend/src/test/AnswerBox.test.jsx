import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerBox } from '../components/AnswerBox';

describe('AnswerBox', () => {
  it('renders nothing when no answer and not loading', () => {
    const { container } = render(<AnswerBox answer="" isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when answer is undefined and not loading', () => {
    const { container } = render(<AnswerBox isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  // Fix 7 — check wrapper class, not just non-null existence
  it('renders the wrapper with correct class when isLoading is true', () => {
    const { container } = render(<AnswerBox answer="" isLoading={true} />);
    expect(container.firstChild.className).toContain('wrapper');
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('shows loading spinner text when isLoading=true', () => {
    render(<AnswerBox answer="" isLoading={true} />);
    expect(screen.getByText(/consulting the ancient tomes/i)).toBeInTheDocument();
  });

  // Fix 7 — assert the actual spinner character rather than any span
  it('shows the ✦ spinner character when loading', () => {
    render(<AnswerBox answer="" isLoading={true} />);
    expect(screen.getByText('✦')).toBeInTheDocument();
  });

  it('shows answer text when provided and not loading', () => {
    render(<AnswerBox answer="Harry Potter is a wizard." isLoading={false} />);
    expect(screen.getByText('H')).toBeInTheDocument();
  });

  it('renders every character of the answer as a span', () => {
    const answer = 'ABC';
    const { container } = render(<AnswerBox answer={answer} isLoading={false} />);
    const spans = container.querySelectorAll('p > span');
    expect(spans.length).toBe(3);
    expect(spans[0].textContent).toBe('A');
    expect(spans[1].textContent).toBe('B');
    expect(spans[2].textContent).toBe('C');
  });

  it('renders <br> for newline characters in answer', () => {
    const { container } = render(<AnswerBox answer={'A\nB'} isLoading={false} />);
    expect(container.querySelector('br')).toBeInTheDocument();
  });

  it('each span has an animation delay style', () => {
    const { container } = render(<AnswerBox answer="Hi" isLoading={false} />);
    const spans = container.querySelectorAll('p > span');
    expect(spans[0].style.animationDelay).toBe('0ms');
    expect(spans[1].style.animationDelay).toBe('16ms');
  });

  it('does not show loading spinner when answer is present and not loading', () => {
    render(<AnswerBox answer="Some answer" isLoading={false} />);
    expect(screen.queryByText(/consulting the ancient tomes/i)).not.toBeInTheDocument();
  });
});
