
import React from "react";
import { UserRound, MapPin } from "lucide-react";
import Empty from "../components/Empty.jsx";

export default function Orders({
  orders,
  isFarmer,
  pid,
  money,
  updateOrder,
  setScreen
}) {
  return (
    <>
      <section className="section-head">
        <div>
          <span className="eyebrow green">ORDER ACTIVITY</span>
          <h2>{isFarmer ? "Incoming orders" : "Your orders"}</h2>
          <p>
            {isFarmer
              ? "Keep customers updated as you prepare their produce."
              : "Track your fresh produce orders."}
          </p>
        </div>
      </section>

      {orders.length ? (
        <div className="orders-grid">
          {orders.map(o => (
            <article className="order-card" key={pid(o)}>
              <div className="order-top">
                <span className="order-id">
                  ORDER #{pid(o).slice(-8).toUpperCase()}
                </span>
                <span className={`status status-${o.status.toLowerCase()}`}>
                  {o.status}
                </span>
              </div>

              <div className="order-meta">
                <span>
                  <UserRound size={15} /> {o.customerName}
                </span>
                <span>
                  <MapPin size={15} /> {o.address}
                </span>
              </div>

              <div className="order-products">
                {o.items.map(i => (
                  <div key={String(i.product)}>
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <b>{money(i.price * i.quantity)}</b>
                  </div>
                ))}
              </div>

              <div className="order-bottom">
                <span>
                  {new Date(o.createdAt).toLocaleDateString()}
                </span>
                <strong>{money(o.total)}</strong>
              </div>

              {isFarmer && (
                <div className="order-actions">
                  {(o.status === "Placed"
                    ? ["Accepted", "Cancelled"]
                    : o.status === "Accepted"
                      ? ["Packed", "Cancelled"]
                      : o.status === "Packed"
                        ? ["Delivered"]
                        : []
                  ).map(status => (
                    <button
                      className="btn btn-outline small"
                      key={status}
                      onClick={() => updateOrder(pid(o), status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No orders yet"
          text={
            isFarmer
              ? "Customer orders will appear here."
              : "Your placed orders will appear here."
          }
          action={() => setScreen("home")}
          actionText="Explore produce"
        />
      )}
    </>
  );
}
