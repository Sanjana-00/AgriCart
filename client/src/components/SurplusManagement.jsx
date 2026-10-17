import React, { useEffect, useState } from "react";
import { Leaf, Upload, Save, RefreshCw } from "lucide-react";

const API = "http://localhost:5000/api";
const MAX_IMAGE_SIZE = 650 * 1024;

const reasons = [
  "Surplus Stock",
  "Near Harvest Freshness Limit",
  "Seasonal Surplus",
  "Other"
];

async function compressPhoto(file) {
  if (!file?.type.startsWith("image/")) {
    throw new Error("Please select a valid image.");
  }

  const url = URL.createObjectURL(file);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Could not read the image."));
      img.src = url;
    });

    const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");

    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.75;
    let result = canvas.toDataURL("image/jpeg", quality);

    while (result.length > MAX_IMAGE_SIZE && quality > 0.3) {
      quality -= 0.1;
      result = canvas.toDataURL("image/jpeg", quality);
    }

    if (result.length > MAX_IMAGE_SIZE) {
      throw new Error("Image is too large. Please select a smaller photo.");
    }

    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
}

export default function SurplusManagement({ user }) {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Request failed.");
    }

    return result;
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/products");
      const all = Array.isArray(result) ? result : result.products || [];
      const mine = all.filter(product => product.farmer === user?.name);

      setProducts(mine);

      const initial = {};
      mine.forEach(product => {
        const id = String(product._id || product.id);
        initial[id] = {
          rescueEnabled: product.rescueEnabled ?? false,
          rescuePrice: product.rescuePrice ?? "",
          rescueQuantity: product.rescueQuantity ?? "",
          rescueImage: product.rescueImage || "",
          rescueExpiry: localDateTime(product.rescueExpiry),
          rescueReason: product.rescueReason || "Surplus Stock"
        };
      });

      setOffers(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [user?.name]);

  function updateOffer(id, field, value) {
    setOffers(previous => ({
      ...previous,
      [id]: { ...previous[id], [field]: value }
    }));
    setError("");
    setMessage("");
  }

  async function handlePhoto(id, file) {
    if (!file) return;

    try {
      setError("");
      const photo = await compressPhoto(file);
      updateOffer(id, "rescueImage", photo);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveOffer(product) {
    const id = String(product._id || product.id);
    const offer = offers[id];

    if (!offer) return;

    if (offer.rescueEnabled) {
      const price = Number(offer.rescuePrice);
      const quantity = Number(offer.rescueQuantity);
      const expiry = new Date(offer.rescueExpiry);

      if (!Number.isFinite(price) || price <= 0 || price >= product.price) {
        setError(`Reduced price must be below the regular price of ₹${product.price}.`);
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > product.quantity) {
        setError(`Enter a quantity from 0 up to ${product.quantity} ${product.unit}.`);
        return;
      }

      if (!offer.rescueExpiry || Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
        setError("Choose an expiry date and time in the future.");
        return;
      }

      if (!offer.rescueImage) {
        setError("Please upload a photo for the surplus offer.");
        return;
      }
    }

    setSaving(id);
    setError("");
    setMessage("");

    try {
      const updated = await apiRequest(`/products/${id}/surplus`, {
        method: "PUT",
        body: JSON.stringify({
          farmer: user?.name,
          rescueEnabled: Boolean(offer.rescueEnabled),
          rescuePrice: offer.rescuePrice === "" ? null : Number(offer.rescuePrice),
          rescueQuantity: offer.rescueQuantity === "" ? 0 : Number(offer.rescueQuantity),
          rescueImage: offer.rescueImage || "",
          rescueExpiry: offer.rescueExpiry || null,
          rescueReason: offer.rescueReason || "Surplus Stock"
        })
      });

      setProducts(previous =>
        previous.map(item =>
          String(item._id || item.id) === id ? updated : item
        )
      );

      setOffers(previous => ({
        ...previous,
        [id]: {
          rescueEnabled: updated.rescueEnabled ?? false,
          rescuePrice: updated.rescuePrice ?? "",
          rescueQuantity: updated.rescueQuantity ?? "",
          rescueImage: updated.rescueImage || "",
          rescueExpiry: localDateTime(updated.rescueExpiry),
          rescueReason: updated.rescueReason || "Surplus Stock"
        }
      }));

      setMessage(
        offer.rescueEnabled
          ? `Surplus offer saved for ${product.name}!`
          : `Surplus offer disabled for ${product.name}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  }

  
async function deleteOffer(product) {
  const id = String(product._id || product.id);

  if (!window.confirm(`Delete the surplus offer for ${product.name}?`)) {
    return;
  }

  setSaving(id);
  setError("");
  setMessage("");

  try {
    await apiRequest(`/products/${id}/surplus`, {
      method: "DELETE",
      body: JSON.stringify({ farmer: user?.name })
    });

    setOffers(previous => ({
      ...previous,
      [id]: {
        rescueEnabled: false,
        rescuePrice: "",
        rescueQuantity: "",
        rescueImage: "",
        rescueExpiry: "",
        rescueReason: "Surplus Stock"
      }
    }));

    setMessage(`Surplus offer deleted for ${product.name}.`);
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving("");
  }
}

  return (
    <section style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: "28px 20px 50px"
    }}>
      <header style={{
        padding: 26,
        background: "#eaf5e8",
        color: "#174e32",
        borderRadius: 18,
        marginBottom: 24
      }}>
        <h1 style={{ marginTop: 0 }}>
          <Leaf size={27} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Manage Surplus Produce
        </h1>
        <p style={{ marginBottom: 0 }}>
          Publish discounted surplus offers separately from your regular listings.
        </p>
      </header>

      {error && (
        <p role="alert" style={{ background: "#fff0ef", color: "#9b2e27", padding: 14, borderRadius: 10 }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ background: "#e9f7eb", color: "#21643b", padding: 14, borderRadius: 10 }}>
          {message}
        </p>
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 18
      }}>
        <h2>Your products</h2>
        <button type="button" onClick={loadProducts} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products found for this farmer. Add products in My Produce first.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 20
        }}>
          {products.map(product => {
            const id = String(product._id || product.id);
            const offer = offers[id] || {};

            return (
              <article key={id} style={{
                border: "1px solid #dce7dc",
                borderRadius: 16,
                padding: 20,
                minWidth: 0
              }}>
                <h3 style={{ marginTop: 0 }}>{product.name}</h3>
                <p style={{ color: "#65786a", lineHeight: 1.7 }}>
                  Regular price: ₹{Number(product.price).toFixed(2)} / {product.unit}<br />
                  Available stock: {product.quantity} {product.unit}
                </p>

                <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "18px 0" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(offer.rescueEnabled)}
                    onChange={event => updateOffer(id, "rescueEnabled", event.target.checked)}
                  />
                  Enable surplus offer
                </label>

                {offer.rescueEnabled && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <label>
                      Reduced price (₹)
                      <input
                        type="number"
                        min="0.01"
                        max={Number(product.price) - 0.01}
                        step="0.01"
                        value={offer.rescuePrice ?? ""}
                        onChange={event => updateOffer(id, "rescuePrice", event.target.value)}
                        placeholder="Enter reduced price"
                        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Surplus quantity ({product.unit})
                      <input
                        type="number"
                        min="0.01"
                        max={product.quantity}
                        step="any"
                        value={offer.rescueQuantity ?? ""}
                        onChange={event => updateOffer(id, "rescueQuantity", event.target.value)}
                        placeholder="Enter quantity"
                        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Offer expiry
                      <input
                        type="datetime-local"
                        min={localDateTime(new Date())}
                        value={offer.rescueExpiry || ""}
                        onChange={event => updateOffer(id, "rescueExpiry", event.target.value)}
                        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Reason
                      <select
                        value={offer.rescueReason || "Surplus Stock"}
                        onChange={event => updateOffer(id, "rescueReason", event.target.value)}
                        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
                      >
                        {reasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Surplus product photo
                      <span style={{ display: "block", marginTop: 6 }}>
                        <Upload size={16} style={{ verticalAlign: "middle" }} /> Select photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          handlePhoto(id, file);
                        }}
                        style={{ display: "block", width: "100%", marginTop: 8 }}
                      />
                    </label>

                    {offer.rescueImage && (
                      <div>
                        <img
                          src={offer.rescueImage}
                          alt={`${product.name} surplus`}
                          style={{
                            width: "100%",
                            height: 180,
                            objectFit: "cover",
                            borderRadius: 12
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => updateOffer(id, "rescueImage", "")}
                          style={{ marginTop: 8 }}
                        >
                          Remove photo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                
<button
  type="button"
  disabled={saving === id}
  onClick={() => saveOffer(product)}
  style={{
    width: "100%",
    marginTop: 20,
    padding: 12,
    border: 0,
    borderRadius: 10,
    background: "#176b40",
    color: "white",
    fontWeight: 700,
    cursor: "pointer"
  }}
>
  <Save size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
  {saving === id ? "Saving..." : "Save surplus offer"}
</button>

{offer.rescueEnabled && (
  <button
    type="button"
    disabled={saving === id}
    onClick={() => deleteOffer(product)}
    style={{
      width: "100%",
      marginTop: 10,
      padding: 12,
      border: "1px solid #b42318",
      borderRadius: 10,
      background: "#fff",
      color: "#b42318",
      fontWeight: 700,
      cursor: "pointer"
    }}
  >
    {saving === id ? "Deleting..." : "Delete Surplus Offer"}
  </button>
)}

              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}