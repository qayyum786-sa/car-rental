import React from "react";

// Example car brands and their logo URLs
const carBrands = [
  {
    name: "Toyota",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_logo.png",
  },
  {
    name: "BMW",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
  },
  {
    name: "Mercedes-Benz",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
  },
  {
    name: "Audi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Audi_logo.svg",
  },
  {
    name: "Honda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_logo.svg",
  },
];

export default function CarsPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Car Brands</h1>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {carBrands.map((brand) => (
          <div
            key={brand.name}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "center",
              width: "150px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              style={{ width: "80px", height: "80px", objectFit: "contain" }}
            />
            <h3 style={{ marginTop: "1rem" }}>{brand.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );    
}