
import React from "react";
import { CheckCircle2 } from "lucide-react";
import Summary from "../components/Summary.jsx";

export default function Checkout({
  checkout,
  setCheckout,
  placeOrder,
  loading,
  money,
  cart,
  subtotal,
  deliveryFee
}) {
  return (
    <>
      <section className="section-head">
        <div>
          <span className="eyebrow green">ALMOST THERE</span>
          <h2>Checkout</h2>
          <p>Where should we deliver your fresh produce?</p>
        </div>
      </section>

      <div className="checkout-layout">
        <form className="form-card" onSubmit={placeOrder}>
          <h3>Delivery details</h3>

          <label>
            Full name
            <input
              required
              value={checkout.name}
              onChange={e =>
                setCheckout({ ...checkout, name: e.target.value })
              }
            />
          </label>

          <label>
            Phone number
            <input
              required
              value={checkout.phone}
              onChange={e =>
                setCheckout({ ...checkout, phone: e.target.value })
              }
            />
          </label>

          <label>
            Delivery address
            <textarea
              required
              rows="3"
              value={checkout.address}
              onChange={e =>
                setCheckout({ ...checkout, address: e.target.value })
              }
              placeholder="House number, street, area, city, PIN code"
            />
          </label>

          <div className="notice">
            <CheckCircle2 size={18} />
            Payment method: Cash on Delivery (demo)
          </div>

          <button
            className="btn btn-primary full"
            disabled={loading}
          >
            {loading
              ? "Placing order..."
              : `Place order · ${money(subtotal + deliveryFee)}`}
          </button>
        </form>

        <aside className="summary-card">
          <h3>Your items</h3>

          {cart.map(p => (
            <div className="summary-line" key={p.id}>
              <span>{p.name} × {p.quantity}</span>
              <b>{money(p.price * p.quantity)}</b>
            </div>
          ))}

          <Summary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
          />
        </aside>
      </div>
    </>
  );
}
