import { useEffect, useRef } from 'react';

const MIN_POINTS = 50;
const MIN_RADIUS = 30;
const MAX_RADIUS = 280;
const MAX_VARIANCE_RATIO = 0.55;
const MIN_COVERAGE = (Math.PI * 3) / 2; // 270°

function isCircle(points) {
  if (points.length < MIN_POINTS) return false;

  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

  const radii = points.map(p => Math.hypot(p.x - cx, p.y - cy));
  const avg = radii.reduce((s, r) => s + r, 0) / radii.length;

  if (avg < MIN_RADIUS || avg > MAX_RADIUS) return false;

  const variance = radii.reduce((s, r) => s + Math.abs(r - avg), 0) / radii.length;
  if (variance / avg > MAX_VARIANCE_RATIO) return false;

  const angles = points.map(p => Math.atan2(p.y - cy, p.x - cx)).sort((a, b) => a - b);

  let maxGap = angles[0] + 2 * Math.PI - angles[angles.length - 1];
  for (let i = 1; i < angles.length; i++) {
    maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
  }

  return 2 * Math.PI - maxGap >= MIN_COVERAGE;
}

export function useLumos(onCast) {
  const buf = useRef([]);
  const fired = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    function processPoint(x, y) {
      if (fired.current) return;

      const p = { x, y };
      if (last.current && Math.hypot(p.x - last.current.x, p.y - last.current.y) < 5) return;
      last.current = p;

      buf.current.push(p);
      if (buf.current.length > 120) buf.current = buf.current.slice(-120);

      if (isCircle(buf.current)) {
        fired.current = true;
        onCast({ x, y });
      }
    }

    function onMouseMove(e) {
      processPoint(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      const t = e.touches[0];
      if (t) processPoint(t.clientX, t.clientY);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [onCast]);
}
