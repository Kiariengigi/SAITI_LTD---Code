import React, { useState } from "react";

interface ProductCardProps {
  name?: string;
  price?: number;
  image?: React.ReactNode;
  isEmpty?: boolean;
}

const PepsiBottleSmall: React.FC = () => (
  <svg viewBox="0 0 40 70" width="40" height="70" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="2" width="10" height="6" rx="2" fill="#aaa" />
    <rect x="16" y="8" width="8" height="7" rx="1" fill="#0050c8" />
    <path d="M12 15 Q12 20 9 25 L9 55 Q9 62 20 62 Q31 62 31 55 L31 25 Q28 20 28 15 Z" fill="#0050c8" />
    <path d="M9 33 Q15 30 20 33 Q25 36 31 33 L31 40 Q25 43 20 40 Q15 37 9 40 Z" fill="#e30613" />
    <path d="M9 39 Q15 36 20 39 Q25 42 31 39 L31 44 Q25 47 20 44 Q15 41 9 44 Z" fill="white" />
    <text x="20" y="30" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold" fontFamily="Arial">PEPSI</text>
  </svg>
);

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  image,
  isEmpty = false,
}) => {
  const [added, setAdded] = useState(false);

  if (isEmpty) {
    return (
      <div
        style={{
          border: "1.5px solid #e9ecef",
          borderRadius: 12,
          background: "#fff",
          minHeight: 90,
          height: "100%",
        }}
      />
    );
  }

  return (
    <div
      className="card border-0 position-relative"
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        padding: "10px 8px 8px",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        minHeight: 110,
        background: "#fff",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,80,200,0.13)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)";
      }}
    >
      <div className="d-flex justify-content-center mb-1">
        {image || <PepsiBottleSmall />}
      </div>
      {name && (
        <div style={{ fontSize: "0.65rem", color: "#1a1a2e", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
          {name}
        </div>
      )}
      {price !== undefined && (
        <div
          style={{
            fontSize: "0.65rem",
            color: "#6c757d",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          KSH {price.toLocaleString()}
        </div>
      )}
      {/* Add button */}
      <button
        className="btn position-absolute"
        onClick={() => setAdded(!added)}
        style={{
          bottom: 6,
          right: 6,
          width: 22,
          height: 22,
          padding: 0,
          borderRadius: "50%",
          background: added ? "#0050c8" : "#f1f3f5",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          fontWeight: 700,
          color: added ? "white" : "#495057",
          lineHeight: 1,
          transition: "all 0.2s",
        }}
      >
        {added ? "✓" : "+"}
      </button>
    </div>
  );
};

export default ProductCard;
