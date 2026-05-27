import { useState } from "react";

export default function Logo({ size = 32 }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "8px",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: `${size * 0.4}px`,
        }}
      >
        GI
      </div>
    );
  }

  return (
    <img
      src="/assets/logo.png"
      alt="Logo INSTA"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: "8px",
        objectFit: "cover",
        display: "block",
      }}
      onError={() => setError(true)}
    />
  );
}
