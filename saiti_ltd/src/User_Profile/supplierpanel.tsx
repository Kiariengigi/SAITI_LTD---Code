import type { Supplier } from "./Types";

// ── CircularProgress ──────────────────────────────────────────────────────────

interface CircularProgressProps {
  value: number;
  color: string;
  size?: number;
}

function CircularProgress({ value, color, size = 44 }: CircularProgressProps) {
  const r      = (size - 6) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="position-relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#111",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── SupplierPanel ─────────────────────────────────────────────────────────────

interface SupplierPanelProps {
  supplier: Supplier;
}

export default function SupplierPanel({ supplier }: SupplierPanelProps) {
  const metrics = [
    { label: "Fulfillment Rate", value: supplier.fulfillmentRate, color: "#F59E0B" },
    { label: "Customer Rating",  value: supplier.customerRating,  color: "#22C55E" },
  ];

  return (
    <div
      className="card border rounded-4 shadow-sm d-flex flex-column align-items-center"
      style={{
        width: 220,
        flexShrink: 0,
        padding: "32px 24px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Avatar */}
      <div
        className="rounded-circle border d-flex align-items-center justify-content-center mb-3"
        style={{ width: 88, height: 88, background: "#f8f8f8", borderColor: "#e5e7eb !important" }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="22" fill="#f0f0f0" />
          <path d="M8 36 L20 16 L28 28 L32 22 L40 36Z" fill="#2B4FD8" />
        </svg>
      </div>

      {/* Identity */}
      <div className="text-center mb-3">
        <div className="fw-bold" style={{ fontSize: 17, color: "#111", letterSpacing: "-0.3px" }}>
          {supplier.name}
        </div>
        <div className="text-muted small">{supplier.role}</div>
        <div className="text-muted small">{supplier.location}</div>
      </div>

      {/* Metrics */}
      <div className="w-100">
        {metrics.map(({ label, value, color }) => (
          <div
            key={label}
            className="d-flex align-items-center justify-content-between py-2 border-top"
          >
            <span className="small text-secondary">{label}</span>
            <CircularProgress value={value} color={color} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-3 text-muted"
        style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.02em" }}
      >
        Member since: {supplier.memberSince}
      </div>
    </div>
  );
}