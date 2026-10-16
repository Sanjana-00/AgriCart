import Product from "../models/Product.js";

export async function listProducts({ search = "", category = "" } = {}) {
  const filter = { available: true };
  if (category && category !== "All") filter.category = category;
  if (search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
      { farmer: { $regex: escaped, $options: "i" } }
    ];
  }
  return Product.find(filter).sort({ createdAt: -1 }).lean();
}
