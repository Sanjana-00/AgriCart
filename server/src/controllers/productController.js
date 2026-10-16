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
