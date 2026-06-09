import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLumos } from '../hooks/useLumos';

/** Generate evenly-spaced points on a circle — every point is ~6.3px apart
 *  (radius=80, n=80 → circumference ≈503px, spacing ≈6.3px > 5px threshold). */
function makeCircularPoints(cx = 200, cy = 200, r = 80, n = 80) {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n),
    y: cy + r * Math.sin((2 * Math.PI * i) / n),
  }));
}

function dispatchPoints(points) {
  points.forEach(({ x, y }) => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
  });
}

function dispatchTouchPoints(points) {
  points.forEach(({ x, y }) => {
    const e = new Event('touchmove');
    e.touches = [{ clientX: x, clientY: y }];
    window.dispatchEvent(e);
  });
}

describe('useLumos', () => {
  let onCast;

  beforeEach(() => {
    onCast = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches mousemove event listener on mount', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    const { unmount } = renderHook(() => useLumos(onCast));
    expect(spy.mock.calls.filter(([e]) => e === 'mousemove').length).toBeGreaterThan(0);
    unmount();
  });

  it('removes mousemove listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useLumos(onCast));
    unmount();
    expect(spy.mock.calls.filter(([e]) => e === 'mousemove').length).toBeGreaterThan(0);
  });

  it('attaches touchmove event listener on mount', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    const { unmount } = renderHook(() => useLumos(onCast));
    expect(spy.mock.calls.filter(([e]) => e === 'touchmove').length).toBeGreaterThan(0);
    unmount();
  });

  it('removes touchmove listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useLumos(onCast));
    unmount();
    expect(spy.mock.calls.filter(([e]) => e === 'touchmove').length).toBeGreaterThan(0);
  });

  it('DOES call onCast with circular touch gesture', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => dispatchTouchPoints(makeCircularPoints(200, 200, 80, 80)));
    expect(onCast).toHaveBeenCalledTimes(1);
    expect(onCast).toHaveBeenCalledWith(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
    unmount();
  });

  it('does NOT call onCast for fewer than MIN_POINTS (50) events', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: i * 20, clientY: 0 }));
      }
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  it('does NOT call onCast for random non-circular linear movement', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      // 80 points in a straight line — not a circle
      for (let i = 0; i < 80; i++) {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: i * 10, clientY: 0 }));
      }
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  it('does NOT call onCast when radius is too small (< 30px)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    // Circle with radius 10px — below MIN_RADIUS
    act(() => dispatchPoints(makeCircularPoints(200, 200, 10, 80)));
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  it('DOES call onCast with {x, y} when a circular path is traced', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    const points = makeCircularPoints(200, 200, 80, 80);
    act(() => dispatchPoints(points));
    expect(onCast).toHaveBeenCalledTimes(1);
    // The callback is called with {x, y} of the last point
    expect(onCast).toHaveBeenCalledWith(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
    unmount();
  });

  it('does not call onCast more than once (idempotent)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    const points = makeCircularPoints(200, 200, 80, 80);
    // Trace the circle twice
    act(() => {
      dispatchPoints(points);
      dispatchPoints(points);
    });
    expect(onCast).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('ignores points that are too close to the previous point (< 5px)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      // All points at same location — distance < 5px → all ignored after first
      for (let i = 0; i < 80; i++) {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
      }
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  // Fix 9 — renamed to match what is actually being verified
  it('does not call onCast for 150 straight-line points (non-circular movement)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      for (let i = 0; i < 150; i++) {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: i * 10, clientY: 0 }));
      }
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  // Fix 3a — high-variance jagged path: alternating inner/outer radius triggers variance guard.
  // An ellipse won't do — smooth ellipses have MAD/avg ≈ 0.3 which is below the 0.55 threshold.
  // Alternating r=50 and r=200 gives avg=125, MAD=75, ratio=0.6 > 0.55. ✓
  it('does NOT call onCast for a high-variance jagged circular path (zigzag in/out)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      const points = Array.from({ length: 80 }, (_, i) => {
        const theta = (2 * Math.PI * i) / 80;
        const r = i % 2 === 0 ? 200 : 50;   // alternating outer/inner
        return { x: 300 + r * Math.cos(theta), y: 300 + r * Math.sin(theta) };
      });
      dispatchPoints(points);
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  it('does not call onCast when touchmove fires with no touches', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => {
      const e = new Event('touchmove');
      e.touches = [];
      window.dispatchEvent(e);
    });
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });

  // Fix 3b — oversized circle (radius > MAX_RADIUS 280px) is rejected
  it('does NOT call onCast when circle radius exceeds MAX_RADIUS (280px)', () => {
    const { unmount } = renderHook(() => useLumos(onCast));
    act(() => dispatchPoints(makeCircularPoints(400, 400, 350, 80)));
    expect(onCast).not.toHaveBeenCalled();
    unmount();
  });
});
