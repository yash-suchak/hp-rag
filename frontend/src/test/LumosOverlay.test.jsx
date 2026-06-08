import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LumosOverlay } from '../components/LumosOverlay';

// Mock useLumos so we can manually trigger the cast callback
vi.mock('../hooks/useLumos', () => ({
  useLumos: vi.fn(),
}));

import { useLumos } from '../hooks/useLumos';

describe('LumosOverlay', () => {
  let onComplete;

  beforeEach(() => {
    onComplete = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();   // Fix 5 — prevent lumos_cast leaking between tests
  });

  it('renders the dark overlay in covering phase on mount', () => {
    const { container } = render(<LumosOverlay onComplete={onComplete} />);
    // Covers the whole screen — must have the overlay class, no lumos text yet
    expect(container.firstChild.className).toContain('overlay');
    expect(screen.queryByText(/lumos/i)).not.toBeInTheDocument();
  });

  it('does not show hint text immediately after mount', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    expect(screen.queryByText(/wave your wand/i)).not.toBeInTheDocument();
  });

  it('hint text appears after 1500ms', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByText(/wave your wand/i)).toBeInTheDocument();
  });

  it('hint text does NOT appear before 1500ms', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(1499));
    expect(screen.queryByText(/wave your wand/i)).not.toBeInTheDocument();
  });

  it('useLumos is called with the cast handler on mount', () => {
    render(<LumosOverlay onComplete={onComplete} />);
    expect(useLumos).toHaveBeenCalledTimes(1);
    expect(useLumos).toHaveBeenCalledWith(expect.any(Function));
  });

  // Fix 4 — removed duplicate render; now also asserts bloom position matches cast coords
  it('bloom appears at the cast coordinates when cast is triggered', () => {
    vi.useFakeTimers();
    const { container } = render(<LumosOverlay onComplete={onComplete} />);
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 300, y: 400 }));
    const bloom = container.querySelector('.bloom');
    expect(bloom).toBeInTheDocument();
    expect(bloom.style.left).toBe('300px');
    expect(bloom.style.top).toBe('400px');
  });

  it('Lumos text appears after cast is triggered', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 200, y: 300 }));
    expect(screen.getByText(/lumos/i)).toBeInTheDocument();
  });

  it('onComplete is called after 3000ms following cast', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 200, y: 300 }));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('sessionStorage is set when onComplete is called', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 200, y: 300 }));
    act(() => vi.advanceTimersByTime(3000));
    expect(sessionStorage.getItem('lumos_cast')).toBe('1');
    // cleanup handled by afterEach
  });

  // Fix 6 — hint text must vanish when phase transitions from 'covering' to 'casting'
  it('hint text disappears when cast is triggered', () => {
    vi.useFakeTimers();
    render(<LumosOverlay onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByText(/wave your wand/i)).toBeInTheDocument();
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 200, y: 300 }));
    expect(screen.queryByText(/wave your wand/i)).not.toBeInTheDocument();
  });

  it('overlay gets revealing class after 2200ms of cast', () => {
    vi.useFakeTimers();
    const { container } = render(<LumosOverlay onComplete={onComplete} />);
    const castHandler = useLumos.mock.calls[0][0];
    act(() => castHandler({ x: 200, y: 300 }));
    act(() => vi.advanceTimersByTime(2200));
    // In non-scoped CSS modules, styles.revealing === 'revealing'
    expect(container.firstChild.className).toContain('revealing');
  });
});
