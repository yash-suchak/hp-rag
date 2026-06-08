import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Starfield } from '../components/Starfield';

describe('Starfield', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Starfield />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('SVG is aria-hidden', () => {
    const { container } = render(<Starfield />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders exactly 196 circles (60+70+40+18+8)', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(196);
  });

  it('stars have varying radii', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    const radii = new Set([...circles].map(c => c.getAttribute('r')));
    // There are 5 distinct radius values: 0.7, 1.2, 1.9, 2.7, 3.8
    expect(radii.size).toBeGreaterThan(1);
  });

  it('each circle has cx and cy attributes as percentages', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    circles.forEach(circle => {
      expect(circle.getAttribute('cx')).toMatch(/%$/);
      expect(circle.getAttribute('cy')).toMatch(/%$/);
    });
  });

  it('circles have fill and opacity attributes', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    circles.forEach(circle => {
      expect(circle.getAttribute('fill')).toBeTruthy();
      expect(circle.getAttribute('opacity')).toBeTruthy();
    });
  });

  it('dim tier circles have radius 0.7', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    // First 60 are dim tier
    const dimCircles = [...circles].slice(0, 60);
    dimCircles.forEach(c => expect(c.getAttribute('r')).toBe('0.7'));
  });

  it('large tier circles have radius 3.8', () => {
    const { container } = render(<Starfield />);
    const circles = container.querySelectorAll('circle');
    // Last 8 are the largest
    const bigCircles = [...circles].slice(188);
    bigCircles.forEach(c => expect(c.getAttribute('r')).toBe('3.8'));
  });
});
