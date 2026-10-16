
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import Stat from "../components/Stat.jsx";

export default function Manage({
  user,
  products,
  orders,
  pid,
  money,
  fallbackImage,
  editProduct,
  deleteProduct,
  setEditing,
  setProductForm,
  setShowProduct
}) {
  return (
    <>
      <section className="section-head">
        <div>
          <span className="eyebrow green">FARMER WORKSPACE</span>
          <h2>My produce</h2>
          <p>Manage your listings and keep your stock up to date.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setProductForm({
              name: "",
              category: "Vegetables",
              price: "",
              unit: "kg",
              quantity: "",
              description: "",
              image: ""
            });
            setShowProduct(true);
          }}
        >
          <Plus size={17} /> Add produce
        </button>
      </section>

      <div className="stats-row">
        <Stat
          label="My listings"
          value={products.filter(p => p.farmer === user.name).length}
        />
        <Stat
          label="Available items"
          value={
            products.filter(
              p => p.farmer === user.name && p.quantity > 0
            ).length
          }
        />
        <Stat label="Total orders" value={orders.length} />
      </div>

      <div className="manage-list">
        {products
          .filter(
            p => p.farmer === user.name || p.farmer === "Demo Farmer"
          )
          .map(p => (
            <div className="manage-item" key={pid(p)}>
              <img
                src={p.image || fallbackImage}
                alt={p.name}
              />

              <div className="manage-info">
                <strong>{p.name}</strong>
                <small>
                  {p.category} · {p.quantity} {p.unit} in stock
                </small>
                <b>{money(p.price)}/{p.unit}</b>
              </div>

              <button
                className="icon-btn"
                onClick={() => editProduct(p)}
              >
                Edit
              </button>

              <button
                className="icon-btn danger"
                onClick={() => deleteProduct(pid(p))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
