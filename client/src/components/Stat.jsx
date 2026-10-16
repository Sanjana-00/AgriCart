
import React from "react";

export default function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
