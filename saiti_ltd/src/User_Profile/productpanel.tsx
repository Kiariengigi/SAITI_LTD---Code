// ProductsPanel.tsx
import { useState } from "react";
import { type Product, PAGE_SIZE } from "./Types";

// ── ActionsMenu ───────────────────────────────────────────────────────────────

interface ActionsMenuProps {
  productName: string;
  onEdit?:      (name: string) => void;
  onDuplicate?: (name: string) => void;
  onView?:      (name: string) => void;
  onDelete?:    (name: string) => void;
}

function ActionsMenu({ productName, onEdit, onDuplicate, onView, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "Edit",         handler: () => onEdit?.(productName) },
    { label: "Duplicate",    handler: () => onDuplicate?.(productName) },
    { label: "View Details", handler: () => onView?.(productName) },
    { label: "Delete",       handler: () => onDelete?.(productName), danger: true },
  ];

  return (
    <div className="dropdown">
      <button
        className="btn btn-sm btn-light border-0 px-2 py-1"
        style={{ letterSpacing: 2, color: "#999", lineHeight: 1, fontSize: 18 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
      >
        •••
      </button>

      {/* Bootstrap dropdown-menu shown manually to avoid Popper dependency */}
      {open && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1040 }}
            onClick={() => setOpen(false)}
          />
          <ul
            className="dropdown-menu show shadow border"
            style={{ zIndex: 1050, minWidth: 150, right: 0, left: "auto" }}
          >
            {actions.map(({ label, handler, danger }, i) => (
              <li key={label}>
                {i > 0 && <hr className="dropdown-divider my-0" />}
                <button
                  className={`dropdown-item small ${danger ? "text-danger" : ""}`}
                  onClick={() => { handler?.(); setOpen(false); }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── ProductsPanel ─────────────────────────────────────────────────────────────

interface ProductsPanelProps {
  products: Product[];
}

export default function ProductsPanel({ products }: ProductsPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      p.productId.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const visiblePages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1, 2];
    if (page > 4) pages.push("...");
    const start = Math.max(3, page - 1);
    const end   = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1, totalPages);
    return pages;
  };

  return (
    <div
      className="card border rounded-4 shadow-sm d-flex flex-column flex-grow-1 overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Table ── */}
      <div className="flex-grow-1 overflow-auto">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              {["Product Name", "Product ID", "Price", "Current Stock", "Type", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-muted fw-medium small border-0 py-3 px-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.map((product, i) => (
              <tr key={product.id}>
                {/* Name + avatar */}
                <td className="px-3 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        background: `hsl(${(i * 47 + 200) % 360}, 18%, 88%)`,
                      }}
                    />
                    <span className="fw-medium" style={{ fontSize: 14, color: "#222" }}>
                      {product.name}
                    </span>
                  </div>
                </td>

                {/* Product ID */}
                <td
                  className="px-3 py-3 text-secondary"
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}
                >
                  {product.productId}
                </td>

                {/* Price */}
                <td
                  className="px-3 py-3 fw-semibold"
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#333" }}
                >
                  {product.price.toFixed(2)} KSH
                </td>

                {/* Stock — red when low */}
                <td
                  className={`px-3 py-3 fw-medium ${product.stock < 10 ? "text-danger" : ""}`}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}
                >
                  {product.stock.toFixed(2)} PC
                </td>

                {/* Type badge */}
                <td className="px-3 py-3">
                  <span className="badge rounded-pill text-secondary bg-light border small fw-medium px-3 py-2">
                    {product.type}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 text-center">
                  <ActionsMenu productName={product.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer: Search + Pagination ── */}
      <div className="card-footer bg-white border-top d-flex flex-wrap align-items-center justify-content-between gap-3 px-3 py-3">

        {/* Search */}
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "24px 0 0 24px" }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#aaa" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="form-control border-start-0 small"
            placeholder="Search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              borderRadius: "0 24px 24px 0",
              fontSize: 13,
              background: "#fafafa",
              boxShadow: "none",
            }}
          />
        </div>

        {/* Pagination */}
        <nav aria-label="Product table pagination">
          <ul className="pagination pagination-sm mb-0 gap-1">
            {/* Previous */}
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link rounded-2 border small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#444" }}
              >
                ‹ Previous
              </button>
            </li>

            {/* Page numbers */}
            {visiblePages().map((p, i) =>
              p === "..." ? (
                <li key={`ellipsis-${i}`} className="page-item disabled">
                  <span
                    className="page-link border-0 bg-transparent text-muted"
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}
                  >
                    …
                  </span>
                </li>
              ) : (
                <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
                  <button
                    className="page-link rounded-2 border"
                    onClick={() => setPage(p as number)}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      minWidth: 32,
                      textAlign: "center",
                      background: page === p ? "#111" : undefined,
                      borderColor: page === p ? "#111" : undefined,
                      color: page === p ? "#fff" : "#555",
                    }}
                  >
                    {String(p as number).padStart(2, "0")}
                  </button>
                </li>
              )
            )}

            {/* Next */}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link rounded-2 border small"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#444" }}
              >
                Next ›
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}