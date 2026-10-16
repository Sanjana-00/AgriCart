
import React from "react";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Summary from "../components/Summary.jsx";
import Empty from "../components/Empty.jsx";

export default function Cart({
  cart,
  setCart,
  changeQty,
  money,
  subtotal,
  deliveryFee,
  setScreen
}) {
  return (
    <>
      <section className="section-head">
        <div>
          <span className="eyebrow green">YOUR SELECTION</span>
          <h2>Shopping cart</h2>
          <p>Fresh picks, ready for your table.</p>
        </div>
      </section>

      {cart.length ? (
        <div className="checkout-layout">
          <div className="cart-list">
            {cart.map(p => (
              <div className="cart-item" key={p.id}>
                <img src={p.image} alt={p.name} />

                <div className="cart-item-info">
                  <strong>{p.name}</strong>
                  <small>{money(p.price)} / {p.unit}</small>

                  <div className="qty-control">
                    <button onClick={() => changeQty(p.id, -1)}>
                      <Minus size={14} />
                    </button>

                    <span>{p.quantity}</span>

                    <button onClick={() => changeQty(p.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <b>{money(p.price * p.quantity)}</b>

                <button
                  className="icon-btn danger"
                  onClick={() =>
                    setCart(old => old.filter(x => x.id !== p.id))
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Order summary</h3>

            <Summary
              subtotal={subtotal}
              deliveryFee={deliveryFee}
            />

            <button
              className="btn btn-primary full"
              onClick={() => setScreen("checkout")}
            >
              Continue to checkout <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      ) : (
        <Empty
          title="Your cart is waiting"
          text="Browse the marketplace and add some fresh produce."
          action={() => setScreen("home")}
          actionText="Explore produce"
        />
      )}
    </>
  );
}
