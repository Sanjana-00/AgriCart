
import React from "react";
import { Plus } from "lucide-react";
import Reviews from "../components/Reviews.jsx";

export default function ProductDetails({
  selectedProduct,
  fallbackImage,
  setScreen,
  setSelectedProduct,
  money,
  user,
  addToCart,
  pid
}) {
  return (
    <section className="product-details-page">
      <button
        className="btn btn-outline"
        onClick={() => {
          setScreen("home");
          setSelectedProduct(null);
        }}
      >
        ← Back to marketplace
      </button>

      <div className="product-details-layout">
        <img
          className="product-details-image"
          src={selectedProduct.image || fallbackImage}
          alt={selectedProduct.name}
          onError={e => {
            e.currentTarget.src = fallbackImage;
          }}
        />

        <div className="product-details-info">
          <span className="eyebrow green">
            {selectedProduct.category}
          </span>

          <h1>{selectedProduct.name}</h1>

          <p>
            {selectedProduct.description ||
              "Fresh produce from a local farm."}
          </p>

          <p>Farmer: {selectedProduct.farmer}</p>

          <h2>
            {money(selectedProduct.price)} / {selectedProduct.unit}
          </h2>

          <p>
            {selectedProduct.quantity} {selectedProduct.unit} available
          </p>

          {user?.role === "Customer" && (
            <button
              className="btn btn-primary"
              disabled={!selectedProduct.quantity}
              onClick={() => addToCart(selectedProduct)}
            >
              <Plus size={17} /> Add to cart
            </button>
          )}
        </div>
      </div>

      <Reviews
        productId={pid(selectedProduct)}
        customer={
          user?.role === "Customer"
            ? { name: user.name, phone: user.phone }
            : null
        }
      />
    </section>
  );
}
