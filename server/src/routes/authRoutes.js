import { Router } from "express";
import { requestDemoOtp, verifyDemoOtp } from "../controllers/authController.js";
const router = Router();
router.post("/otp", requestDemoOtp);
router.post("/verify", verifyDemoOtp);
export default router;
