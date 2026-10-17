import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSurplusOffers,
  saveSurplusOffer,
  deleteSurplusOffer
} from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Surplus produce routes
router.get("/surplus", getSurplusOffers);
router.put("/:id/surplus", saveSurplusOffer);
router.delete("/:id/surplus", deleteSurplusOffer);
export default router;