import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  farmer: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["Cash on Delivery"], default: "Cash on Delivery" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  status: { type: String, enum: ["Placed", "Accepted", "Packed", "Delivered", "Cancelled"], default: "Placed" }
}, { timestamps: true });

orderSchema.index({ customerPhone: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
