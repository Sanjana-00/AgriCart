
import { Router } from "express";
import { getFarmerAnalytics } from "../controllers/farmerAnalyticsController.js";

const router = Router();

router.get("/", getFarmerAnalytics);

export default router;
