import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Existing product details
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0.01
    },

    unit: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000
    },

    farmer: {
      type: String,
      required: true,
      trim: true
    },

    image: {
      type: String,
      default: ""
    },

    available: {
      type: Boolean,
      default: true
    },

    // Food Waste Rescue / Surplus Offer details
    rescueEnabled: {
      type: Boolean,
      default: false
    },

    rescuePrice: {
      type: Number,
      default: null,
      min: 0
    },

    rescueQuantity: {
      type: Number,
      default: 0,
      min: 0
    },

    rescueImage: {
      type: String,
      default: ""
    },

    rescueExpiry: {
      type: Date,
      default: null
    },

    rescueReason: {
      type: String,
      enum: [
        "Surplus Stock",
        "Near Harvest Freshness Limit",
        "Seasonal Surplus",
        "Other"
      ],
      default: "Surplus Stock"
    }
  },
  {
    timestamps: true
  }
);

// Preserve the existing search index
productSchema.index({
  name: "text",
  category: "text",
  farmer: "text"
});

export default mongoose.model("Product", productSchema);