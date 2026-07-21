import express from "express";
import { investigateCVE } from "../controllers/cveController.js";

const router = express.Router();

router.post("/", investigateCVE);

export default router;