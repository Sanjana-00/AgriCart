import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  description: { type: String, default: "", maxlength: 1000 },
  farmer: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: "text", category: "text", farmer: "text" });

export default mongoose.model("Product", productSchema);
