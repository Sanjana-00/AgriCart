
import React from "react";
import { Package } from "lucide-react";

export default function Empty({ title, text, action, actionText }) {
  return (
    <div className="empty-state">
      <span>
        <Package size={27} />
      </span>

      <h3>{title}</h3>
      <p>{text}</p>

      {action && (
        <button className="btn btn-primary" onClick={action}>
          {actionText}
        </button>
      )}
    </div>
  );
}
