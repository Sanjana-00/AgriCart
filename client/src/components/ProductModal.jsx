
import React from "react";
import { X } from "lucide-react";

export default function ProductModal({
  editing,
  productForm,
  setProductForm,
  categories,
  saveProduct,
  setShowProduct
}) {
  return (
    <div className="modal-backdrop">
      <form
        className="modal-card product-modal"
        onSubmit={saveProduct}
      >
        <button
          type="button"
          className="modal-close"
          onClick={() => setShowProduct(false)}
        >
          <X size={18} />
        </button>

        <span className="eyebrow green">FARMER WORKSPACE</span>
        <h2>{editing ? "Edit produce" : "List new produce"}</h2>

        <label>
          Product name
          <input
            required
            value={productForm.name}
            onChange={e =>
              setProductForm({
                ...productForm,
                name: e.target.value
              })
            }
          />
        </label>

        <div className="form-two">
          <label>
            Category
            <select
              value={productForm.category}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  category: e.target.value
                })
              }
            >
              {categories
                .filter(c => c !== "All")
                .map(c => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>

          <label>
            Unit
            <select
              value={productForm.unit}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  unit: e.target.value
                })
              }
            >
              {["kg", "bunch", "piece", "dozen", "litre"].map(unit => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-two">
          <label>
            Price
            <input
              required
              type="number"
              min="0"
              value={productForm.price}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  price: e.target.value
                })
              }
            />
          </label>

          <label>
            Quantity
            <input
              required
              type="number"
              min="0"
              value={productForm.quantity}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  quantity: e.target.value
                })
              }
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows="3"
            value={productForm.description}
            onChange={e =>
              setProductForm({
                ...productForm,
                description: e.target.value
              })
            }
          />
        </label>

        <label>
          Image URL
          <input
            value={productForm.image}
            onChange={e =>
              setProductForm({
                ...productForm,
                image: e.target.value
              })
            }
            placeholder="Paste an image URL"
          />
        </label>

        <button className="btn btn-primary full">
          {editing ? "Save changes" : "Add produce"}
        </button>
      </form>
    </div>
  );
}
