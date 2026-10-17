import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShoppingCart } from "lucide-react";

const API = "http://localhost:5000/api";

export default function SurplusDeals({ addToCart }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/products/surplus`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load surplus deals.");
      }

      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  
function addSurplusToCart(product) {
  const surplusProduct = {
    ...product,
    price: Number(product.rescuePrice),
    quantity: Number(product.rescueQuantity),
    quantityAvailable: Number(product.rescueQuantity),
    id: product._id || product.id,
    productId: product._id || product.id,
    isSurplus: true
  };

  addToCart(surplusProduct);
}


  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: 28 }}>
      <header style={{
        background: "#eaf5e8",
        padding: 28,
        borderRadius: 18,
        marginBottom: 24,
        color: "#174e32"
      }}>
        <h1>🌱 Surplus Deals</h1>
        <p>Fresh produce at reduced prices. Save money and reduce food waste!</p>

        <button
          type="button"
          onClick={loadOffers}
          disabled={loading}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          <RefreshCw
            size={15}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          {loading ? "Refreshing..." : "Refresh offers"}
        </button>
      </header>

      {loading && <p>Loading surplus deals...</p>}

      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          Could not load offers: {error}
        </p>
      )}

      {!loading && !error && offers.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: 40,
          background: "#fff",
          borderRadius: 16
        }}>
          <h2>No surplus deals available right now</h2>
          <p>Please check again when farmers publish new offers.</p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 22
      }}>
        {offers.map(product => {
          const original = Number(product.price);
          const reduced = Number(product.rescuePrice);
          const quantity = Number(product.rescueQuantity);
          const image = product.rescueImage || product.image;
          const discount = original > 0
            ? Math.round(((original - reduced) / original) * 100)
            : 0;

          return (
            <article key={product._id} style={{
              background: "#fff",
              border: "1px solid #dce7dc",
              borderRadius: 16,
              overflow: "hidden"
            }}>
              {image ? (
                <img
                  src={image}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div style={{
                  height: 200,
                  display: "grid",
                  placeItems: "center",
                  background: "#edf4e9",
                  fontSize: 55
                }}>
                  🥕
                </div>
              )}

              <div style={{ padding: 18 }}>
                <span style={{
                  background: "#e1f5e5",
                  color: "#176b40",
                  padding: "5px 9px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {discount}% OFF
                </span>

                <h2>{product.name}</h2>
                <p style={{ color: "#607568" }}>
                  Farmer: {product.farmer}
                </p>

                <p>
                  <strong style={{ fontSize: 23, color: "#176b40" }}>
                    ₹{reduced.toFixed(2)}
                  </strong>{" "}
                  <span style={{
                    textDecoration: "line-through",
                    color: "#888"
                  }}>
                    ₹{original.toFixed(2)}
                  </span>
                  {" "}/ {product.unit}
                </p>

                <p>Offer quantity: {quantity} {product.unit}</p>
                <p>Reason: {product.rescueReason || "Surplus Stock"}</p>

                <p style={{ fontSize: 13, color: "#607568" }}>
                  Expires: {product.rescueExpiry
                    ? new Date(product.rescueExpiry).toLocaleString()
                    : "Not specified"}
                </p>

                <button
                  type="button"
                  disabled={quantity <= 0 || !Number.isFinite(reduced) || reduced <= 0}
                  onClick={() => addSurplusToCart(product)}
                  style={{
                    width: "100%",
                    padding: 12,
                    border: 0,
                    borderRadius: 10,
                    background: "#176b40",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <ShoppingCart
                    size={16}
                    style={{ verticalAlign: "middle", marginRight: 6 }}
                  />
                  Add to Cart
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}