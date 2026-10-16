
import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast">
      <CheckCircle2 size={18} />
      {message}
    </div>
  );
}
