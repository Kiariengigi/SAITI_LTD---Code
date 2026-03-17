// App.tsx
import Header        from "./Header";
import SupplierPanel from "./supplierpanel";
import ProductsPanel from "./productpanel";
import { SUPPLIER, PRODUCTS } from "./Types";

// ── Hero Banner ───────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <div
      className="position-relative overflow-hidden flex-shrink-0"
      style={{
        height: 160,
        background:
          "linear-gradient(135deg, #7c5024 0%, #c8870a 40%, #8b4513 70%, #3d2008 100%)",
      }}
    >
      {/* Decorative geometric shapes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="position-absolute"
          style={{
            width:  `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            transform: `rotate(${25 + i * 8}deg)`,
            left: `${i * 18}%`,
            top:  `${-20 + i * 12}%`,
          }}
        />
      ))}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function Profile_main() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        body { background: #f5f5f5; }

        /* Bootstrap active page-link colour override */
        .page-item.active .page-link {
          background-color: #111 !important;
          border-color: #111 !important;
          color: #fff !important;
        }

        /* Soften Bootstrap table-hover shade */
        .table-hover > tbody > tr:hover > * {
          --bs-table-bg-state: rgba(0,0,0,0.02);
        }
      `}</style>

      {/* Bootstrap CSS via CDN */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossOrigin="anonymous"
      />

      <div className="d-flex flex-column min-vh-100">
        <Header
          brandName="SAITI_LTD"
          userName={SUPPLIER.name.replace(" ", "_")}
          userRole="Supplier"
        />

        <HeroBanner />

        {/* Main content — overlaps banner with negative margin */}
        <div
          className="d-flex gap-3 flex-grow-1 px-4 pb-4"
          style={{ marginTop: -80 }}
        >
          <SupplierPanel supplier={SUPPLIER} />
          <ProductsPanel products={PRODUCTS} />
        </div>
      </div>
    </>
  );
}