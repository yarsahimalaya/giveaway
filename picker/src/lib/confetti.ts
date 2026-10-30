import confetti from "canvas-confetti";

const COLORS = ["#6C3BFF", "#FFC93C", "#FF5C7A", "#22C996", "#3DB8FF", "#FFFFFF"];
const base = { colors: COLORS, zIndex: 1000, disableForReducedMotion: true };

export function cannons() {
  confetti({ ...base, particleCount: 110, angle: 60, spread: 62, startVelocity: 68, origin: { x: 0, y: 0.9 } });
  confetti({ ...base, particleCount: 110, angle: 120, spread: 62, startVelocity: 68, origin: { x: 1, y: 0.9 } });
}

export function starBurst() {
  confetti({
    ...base,
    particleCount: 70,
    spread: 360,
    startVelocity: 36,
    scalar: 1.25,
    gravity: 0.6,
    ticks: 240,
    shapes: ["star"],
    colors: ["#FFC93C", "#FFE08A", "#FF5C7A", "#FFFFFF"],
    origin: { x: 0.5, y: 0.38 },
  });
}

export function burstFrom(el: Element) {
  const r = el.getBoundingClientRect();
  confetti({
    ...base,
    particleCount: 36,
    spread: 75,
    startVelocity: 28,
    scalar: 0.85,
    origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
  });
}

export function rain(ms = 2600) {
  const end = performance.now() + ms;
  const frame = () => {
    confetti({ ...base, particleCount: 3, angle: 60, spread: 55, startVelocity: 55, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 3, angle: 120, spread: 55, startVelocity: 55, origin: { x: 1, y: 0.75 } });
    if (performance.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
