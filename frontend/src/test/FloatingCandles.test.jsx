import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FloatingCandles } from '../components/FloatingCandles';

describe('FloatingCandles', () => {
  it('renders exactly 4 candles', () => {
    const { container } = render(<FloatingCandles />);
    // Each candle is a div with class "candle"
    const candles = container.querySelectorAll('.candle');
    expect(candles).toHaveLength(4);
  });

  it('each candle has a flame element', () => {
    const { container } = render(<FloatingCandles />);
    const flames = container.querySelectorAll('.flame');
    expect(flames).toHaveLength(4);
  });

  it('each candle has a flame core element', () => {
    const { container } = render(<FloatingCandles />);
    const flameCores = container.querySelectorAll('.flameCore');
    expect(flameCores).toHaveLength(4);
  });

  it('each candle has a wick element', () => {
    const { container } = render(<FloatingCandles />);
    const wicks = container.querySelectorAll('.wick');
    expect(wicks).toHaveLength(4);
  });

  it('each candle has a body element', () => {
    const { container } = render(<FloatingCandles />);
    const bodies = container.querySelectorAll('.body');
    expect(bodies).toHaveLength(4);
  });

  it('root element is aria-hidden', () => {
    const { container } = render(<FloatingCandles />);
    const root = container.firstChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('candles have float delay and duration CSS variables', () => {
    const { container } = render(<FloatingCandles />);
    const candles = container.querySelectorAll('.candle');
    candles.forEach(candle => {
      expect(candle.style.getPropertyValue('--float-delay')).toBeTruthy();
      expect(candle.style.getPropertyValue('--float-dur')).toBeTruthy();
    });
  });

  it('candles are positioned with left and top styles', () => {
    const { container } = render(<FloatingCandles />);
    const candles = container.querySelectorAll('.candle');
    candles.forEach(candle => {
      expect(candle.style.left).toBeTruthy();
      expect(candle.style.top).toBeTruthy();
    });
  });
});
