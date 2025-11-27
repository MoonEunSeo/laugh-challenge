import express from "express";
import {
  saveLaughEvent,
  saveLlmResult,
  getEventsBySession,
  getLaughFinalEvents
} from "../controllers/laughEventController.js";
import supabase from "../supabase/supabase.js";


const router = express.Router();

router.post("/", saveLaughEvent);

router.post("/llm-result", saveLlmResult);

router.get("/final", getLaughFinalEvents);

router.get("/list", async (req, res) => {
  try {
    const idx = req.query.event_index;
    // Supabase 조회 쿼리 생성
    let query = supabase.from("laugh_events").select("*");

    if (idx !== undefined) {
      query = query.eq("event_index", Number(idx));
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error });
    }

    return res.json({
      ok: true,
      index: idx,
      data
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:session_uuid", getEventsBySession);

export default router;
