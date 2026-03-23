import React from "react";
import ProductCard from "./ProductCard";
import Filter from "./Filter";

const products = [
  { id: 1, name: "Pepsi 500ml x 12", price: 690, isEmpty: false },
  { id: 2, isEmpty: true },
  { id: 3, isEmpty: true },
  { id: 4, isEmpty: true },
  { id: 5, isEmpty: true },
  { id: 6, isEmpty: true },
  { id: 7, isEmpty: true },
  { id: 8, isEmpty: true },
  { id: 9, isEmpty: true },
  { id: 10, isEmpty: true },
  { id: 11, isEmpty: true },
  { id: 12, isEmpty: true },
];

const ProductGrid: React.FC = () => {
  return (
    <>
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
            style={{
              borderRadius: "0 24px 24px 0",
              fontSize: 13,
              background: "#fafafa",
              boxShadow: "none",
            }}
          />
        </div>
    <div className="d-flex gap-3 px-3 py-3" style={{ alignItems: "flex-start" }}>
      <Filter />
      <div style={{ flex: 1 }}>
        <div
          className="d-grid gap-2"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            display: "grid",
          }}
        >
          {products.map((p) =>
            p.isEmpty ? (
              <ProductCard key={p.id} isEmpty />
            ) : (
              <ProductCard
                key={p.id}
                name={p.name}
                price={p.price}
              />
            )
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductGrid;
