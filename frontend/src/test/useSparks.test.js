import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSparks } from '../hooks/useSparks';

function makeTouch(x, y) {
  const e = new Event('touchstart');
  e.touches = [{ clientX: x, clientY: y }];
  return e;
}

describe('useSparks', () => {
  let sparksRoot;

  beforeEach(() => {
    sparksRoot = document.createElement('div');
    sparksRoot.id = 'sparks-root';
    document.body.appendChild(sparksRoot);
  });

  afterEach(() => {
    if (sparksRoot.parentNode) {
      document.body.removeChild(sparksRoot);
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('attaches click and touchstart event listeners on mount', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useSparks());
    expect(spy.mock.calls.filter(([e]) => e === 'click').length).toBeGreaterThan(0);
    expect(spy.mock.calls.filter(([e]) => e === 'touchstart').length).toBeGreaterThan(0);
  });

  it('removes click and touchstart listeners on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useSparks());
    unmount();
    expect(spy.mock.calls.filter(([e]) => e === 'click').length).toBeGreaterThan(0);
    expect(spy.mock.calls.filter(([e]) => e === 'touchstart').length).toBeGreaterThan(0);
  });

  it('does not attach listeners when sparks-root is missing', () => {
    document.body.removeChild(sparksRoot);
    const spy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useSparks());
    expect(spy.mock.calls.filter(([e]) => e === 'click').length).toBe(0);
    expect(spy.mock.calls.filter(([e]) => e === 'touchstart').length).toBe(0);
  });

  it('spawns spark DOM elements on click at click coordinates', () => {
    renderHook(() => useSparks());
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 200, bubbles: true }));
    });
    const sparks = sparksRoot.querySelectorAll('.spark');
    expect(sparks.length).toBeGreaterThanOrEqual(12);
    expect(sparks.length).toBeLessThanOrEqual(18);
  });

  // Fix 8 — assert actual position proximity rather than just non-empty cssText
  it('spark positions are within ±10px of the click coordinates', () => {
    renderHook(() => useSparks());
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 150, clientY: 250, bubbles: true }));
    });
    const sparks = sparksRoot.querySelectorAll('.spark');
    // Spark left = clientX - size/2; size range is 3–8px, so offset is 1.5–4px
    sparks.forEach(spark => {
      const left = parseFloat(spark.style.left);
      const top  = parseFloat(spark.style.top);
      expect(left).toBeGreaterThanOrEqual(140);
      expect(left).toBeLessThanOrEqual(155);
      expect(top).toBeGreaterThanOrEqual(240);
      expect(top).toBeLessThanOrEqual(255);
    });
  });

  it('sparks are removed from the DOM after animation duration', () => {
    vi.useFakeTimers();
    renderHook(() => useSparks());
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 200, bubbles: true }));
    });
    expect(sparksRoot.children.length).toBeGreaterThan(0);
    // Max duration = 350 + 350 + 50 = 750ms; advance past that
    act(() => vi.advanceTimersByTime(800));
    expect(sparksRoot.children.length).toBe(0);
  });

  it('spawns sparks on touchstart at touch coordinates', () => {
    renderHook(() => useSparks());
    act(() => {
      window.dispatchEvent(makeTouch(200, 300));
    });
    const sparks = sparksRoot.querySelectorAll('.spark');
    expect(sparks.length).toBeGreaterThanOrEqual(12);
    sparks.forEach(spark => {
      const left = parseFloat(spark.style.left);
      const top  = parseFloat(spark.style.top);
      expect(left).toBeGreaterThanOrEqual(190);
      expect(left).toBeLessThanOrEqual(205);
      expect(top).toBeGreaterThanOrEqual(290);
      expect(top).toBeLessThanOrEqual(305);
    });
  });

  it('ignores touchstart event with no touches', () => {
    renderHook(() => useSparks());
    act(() => {
      const e = new Event('touchstart');
      e.touches = [];
      window.dispatchEvent(e);
    });
    expect(sparksRoot.children.length).toBe(0);
  });

  it('suppresses synthetic click within 500ms of a touchstart', () => {
    vi.useFakeTimers();
    renderHook(() => useSparks());

    // Fire touchstart → sparks appear
    act(() => window.dispatchEvent(makeTouch(100, 100)));
    const afterTouch = sparksRoot.children.length;
    expect(afterTouch).toBeGreaterThan(0);

    // Fire click immediately after (synthetic mobile click) → should be suppressed
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100, bubbles: true }));
    });
    expect(sparksRoot.children.length).toBe(afterTouch); // no new sparks added

    // After 500ms the guard expires — click should work again
    act(() => vi.advanceTimersByTime(500));
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100, bubbles: true }));
    });
    expect(sparksRoot.children.length).toBeGreaterThan(afterTouch);

    vi.useRealTimers();
  });

  it('multiple clicks spawn additional sparks', () => {
    renderHook(() => useSparks());
    act(() => {
      window.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100, bubbles: true }));
      window.dispatchEvent(new MouseEvent('click', { clientX: 200, clientY: 200, bubbles: true }));
    });
    expect(sparksRoot.children.length).toBeGreaterThanOrEqual(24);
  });
});
