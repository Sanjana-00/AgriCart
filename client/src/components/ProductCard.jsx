
import React from "react";
import { Sprout, Plus, Trash2 } from "lucide-react";

const fallbackImage =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600";

const money = (n) =>
  `₹${Number(n || 0).toFixed(2).replace(/\.?0+$/, "")}`;

export default function ProductCard({ p, user, add, edit, del, open }) {
  const id = p._id || p.id;

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={() => open(p)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          open(p);
        }
      }}
    >
      <div className="product-image">
        <img
          src={p.image || fallbackImage}
          alt={p.name}
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        <span className="product-tag">{p.category}</span>
      </div>

      <div className="product-content">
        <div className="product-farmer">
          <Sprout size={13} />
          {p.farmer}
        </div>

        <h3>{p.name}</h3>
        <p>{p.description || "Fresh produce from a local farm."}</p>

        <div className="product-stock">
          {p.quantity > 0
            ? `${p.quantity} ${p.unit} available`
            : "Out of stock"}
        </div>

        <div className="product-bottom">
          <div>
            <strong>{money(p.price)}</strong>
            <small> / {p.unit}</small>
          </div>

          {user?.role === "Farmer" ? (
            <div className="card-actions">
              <button
                className="icon-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  edit(p);
                }}
              >
                Edit
              </button>

              <button
                className="icon-btn danger"
                onClick={(event) => {
                  event.stopPropagation();
                  del(id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              className="add-btn"
              disabled={!p.quantity}
              onClick={(event) => {
                event.stopPropagation();
                add(p);
              }}
            >
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
