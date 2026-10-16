
import React from "react";

const money = (n) =>
  `₹${Number(n || 0).toFixed(2).replace(/\.?0+$/, "")}`;

export default function Summary({ subtotal, deliveryFee }) {
  return (
    <>
      <div className="summary-line">
        <span>Subtotal</span>
        <b>{money(subtotal)}</b>
      </div>

      <div className="summary-line">
        <span>Delivery</span>
        <b>{deliveryFee ? money(deliveryFee) : "Free"}</b>
      </div>

      <div className="summary-total">
        <span>Total</span>
        <strong>{money(subtotal + deliveryFee)}</strong>
      </div>

      <small className="hint">
        Free delivery on orders of ₹300 or more.
      </small>
    </>
  );
}
