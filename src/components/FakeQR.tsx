export function FakeQR({ seed, size = 160 }: { seed: string; size?: number }) {
  const n = 21;
  const cells: boolean[] = [];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < n * n; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    cells.push(((h >>> 0) % 100) > 50);
  }
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      role="img"
      aria-label="Emergency health record QR code"
      className="rounded-md border border-border bg-white p-1"
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        if (isFinder(r, c)) return null;
        return on ? <rect key={i} x={c} y={r} width={1} height={1} fill="#0f172a" /> : null;
      })}
      {[
        [0, 0],
        [0, n - 7],
        [n - 7, 0],
      ].map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={c} y={r} width={7} height={7} fill="#0f172a" />
          <rect x={c + 1} y={r + 1} width={5} height={5} fill="#fff" />
          <rect x={c + 2} y={r + 2} width={3} height={3} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}
