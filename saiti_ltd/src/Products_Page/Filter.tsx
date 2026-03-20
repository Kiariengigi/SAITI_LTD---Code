import React, { useState } from "react";

interface FilterSectionProps {
  title: string;
  options?: string[];
  type?: "checkbox" | "radio";
  height?: number;
}

const Filter: React.FC<FilterSectionProps> = ({
  title,
  options = [],
  type = "checkbox",
  height = 100,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    if (type === "radio") {
      setSelected([opt]);
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
      );
    }
  };

  return (
    <div
      className="card border-0 mb-2"
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        padding: "12px 14px",
        minHeight: height,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#1a1a2e",
          marginBottom: options.length ? 10 : 0,
        }}
      >
        {title}
      </div>
      {options.map((opt) => (
        <div
          key={opt}
          className="d-flex align-items-center gap-2 mb-1"
          style={{ cursor: "pointer" }}
          onClick={() => toggle(opt)}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: type === "radio" ? "50%" : 3,
              border: selected.includes(opt)
                ? "2px solid #0050c8"
                : "1.5px solid #ced4da",
              background: selected.includes(opt) ? "#0050c8" : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {selected.includes(opt) && (
              <svg viewBox="0 0 10 8" width="8" height="6">
                <polyline
                  points="1,4 3.5,6.5 9,1"
                  stroke="white"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <span style={{ fontSize: "0.72rem", color: "#495057" }}>{opt}</span>
        </div>
      ))}
    </div>
  );
};

const FilterSidebar: React.FC = () => {
  return (
    <div style={{ minWidth: 170, maxWidth: 200 }}>
      <Filter
        title="Brand"
        options={["Pepsi", "7UP", "Mirinda", "Mountain Dew", "Lipton"]}
        height={160}
      />
      <Filter
        title="Stock Status"
        options={["In Stock", "Out of Stock", "Low Stock"]}
        type="radio"
        height={100}
      />
      <Filter
        title="Fulfilment Rating"
        options={["5 Stars", "4 Stars", "3 Stars & below"]}
        type="radio"
        height={100}
      />
    </div>
  );
};

export default FilterSidebar;
