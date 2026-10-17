import Product from "../models/Product.js";
import { listProducts } from "../services/productService.js";

export async function getProducts(req, res, next) {
  try {
    const products = await listProducts({ search: String(req.query.search || ""), category: String(req.query.category || "") });
    res.json(products);
  } catch (error) { next(error); }
}

export async function createProduct(req, res, next) {
  try {
    const { name, category, price, unit, quantity, description = "", farmer, image = "" } = req.body || {};
    if (!name?.trim() || !category?.trim() || !unit?.trim() || !farmer?.trim() ||
        !Number.isFinite(Number(price)) || Number(price) <= 0 ||
        !Number.isFinite(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({ message: "Enter valid name, category, farmer, unit, positive price, and non-negative quantity." });
    }
    const product = await Product.create({
      name: name.trim(), category: category.trim(), price: Number(price), unit: unit.trim(),
      quantity: Number(quantity), description, farmer: farmer.trim(), image
    });
    res.status(201).json(product);
  } catch (error) { next(error); }
}

export async function updateProduct(req, res, next) {
  try {
    const updates = {};
    for (const key of ["name", "category", "unit", "description", "farmer", "image"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.price !== undefined) {
      if (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0) return res.status(400).json({ message: "Price must be greater than zero." });
      updates.price = Number(req.body.price);
    }
    if (req.body.quantity !== undefined) {
      if (!Number.isFinite(Number(req.body.quantity)) || Number(req.body.quantity) < 0) return res.status(400).json({ message: "Quantity cannot be negative." });
      updates.quantity = Number(req.body.quantity);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (error) { next(error); }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (error) { next(error); }
}

// Get active surplus offers for the customer marketplace
export async function getSurplusOffers(req, res, next) {
  try {
    const now = new Date();

    const offers = await Product.find({
      available: true,
      quantity: { $gt: 0 },
      rescueEnabled: true,
      rescuePrice: { $gt: 0 },
      rescueQuantity: { $gt: 0 },
      rescueExpiry: { $gt: now }
    }).sort({ rescueExpiry: 1 });

    res.json(offers);
  } catch (error) {
    next(error);
  }
}

// Create or update a surplus offer for an existing product
export async function saveSurplusOffer(req, res, next) {
  try {
    const {
      farmer,
      rescueEnabled,
      rescuePrice,
      rescueQuantity,
      rescueImage,
      rescueExpiry,
      rescueReason
    } = req.body || {};

    if (typeof rescueEnabled !== "boolean") {
      return res.status(400).json({
        message: "Please enable or disable the surplus offer."
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    // Basic ownership check for this development version.
    if (!farmer || product.farmer !== String(farmer).trim()) {
      return res.status(403).json({
        message: "You cannot manage this farmer's product."
      });
    }

    if (rescueEnabled) {
      const price = Number(rescuePrice);
      const quantity = Number(rescueQuantity);
      const expiry = new Date(rescueExpiry);

      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        price >= product.price
      ) {
        return res.status(400).json({
          message: "The reduced price must be positive and lower than the regular price."
        });
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > product.quantity
      ) {
        return res.status(400).json({
          message: "Surplus quantity must be positive and cannot exceed current stock."
        });
      }

      if (
        !rescueExpiry ||
        Number.isNaN(expiry.getTime()) ||
        expiry <= new Date()
      ) {
        return res.status(400).json({
          message: "Please select a future expiry date and time."
        });
      }

      const validReasons = [
        "Surplus Stock",
        "Near Harvest Freshness Limit",
        "Seasonal Surplus",
        "Other"
      ];

      if (rescueReason && !validReasons.includes(rescueReason)) {
        return res.status(400).json({
          message: "Invalid surplus offer reason."
        });
      }

      if (
        typeof rescueImage !== "string" ||
        rescueImage.length > 950000
      ) {
        return res.status(400).json({
          message: "Please provide a valid, compressed surplus photo."
        });
      }

      product.rescueEnabled = true;
      product.rescuePrice = price;
      product.rescueQuantity = quantity;
      product.rescueImage = rescueImage;
      product.rescueExpiry = expiry;
      product.rescueReason = rescueReason || "Surplus Stock";
    }

    

if (!rescueEnabled) {
  product.rescueEnabled = false;
  product.rescuePrice = null;
  product.rescueQuantity = 0;
  product.rescueImage = "";
  product.rescueExpiry = null;
  product.rescueReason = "Surplus Stock";
}

await product.save();

return res.json(product);


  } catch (error) {
    next(error);
  }
}


export async function deleteSurplusOffer(req, res, next) {
  try {
    const { farmer } = req.body || {};

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (!farmer || product.farmer !== String(farmer).trim()) {
      return res.status(403).json({
        message: "You cannot manage this farmer's product."
      });
    }

    product.rescueEnabled = false;
    product.rescuePrice = null;
    product.rescueQuantity = 0;
    product.rescueImage = "";
    product.rescueExpiry = null;
    product.rescueReason = "Surplus Stock";

    await product.save();

    return res.json({
      message: "Surplus offer deleted successfully.",
      product
    });
  } catch (error) {
    next(error);
  }
}
