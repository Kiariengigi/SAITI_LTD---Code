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
  );
};

export default ProductGrid;
