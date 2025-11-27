import express from "express";
import { getYoutubeRecommendations } from "../controllers/youtubeController.js";

const router = express.Router();

router.post("/recommend", getYoutubeRecommendations);

export default router;
