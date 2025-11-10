const express = require("express");
const router = express.Router();
const {
  test,
  play,
  analyze,
  analyzeJson,
  analyzeMulti,
  analyzeFEN,
  performance,
  newGame,
  undo,
  config,
  goInfinite,
  stop,
  analyzePGN,
} = require("../controllers/serverControllers");

// --- Basic Health Check ---
router.get("/testing", test);

// --- Play / Best Move ---
router.post("/play", play);

// --- Analyze (raw output) ---
router.post("/analyze", analyze);

// --- Analyze JSON (structured output) ---
router.post("/analyze-json", analyzeJson);

// --- MultiPV Analysis ---
router.post("/analyze-multi", analyzeMulti);

// --- Analyze custom FEN position ---
router.post("/fen", analyzeFEN);

// --- Engine Performance / Stats ---
router.get("/performance", performance);

// --- New Game / Reset Engine ---
router.post("/newgame", newGame);

// --- Undo Last Move(s) ---
router.post("/undo", undo);

// --- Engine Configuration ---
router.post("/config", config);

// --- Infinite Search / Stop ---
router.post("/go-infinite", goInfinite);
router.post("/stop", stop);

// --- Analyze PGN / Full Game ---
router.post("/analyze-pgn", analyzePGN);

module.exports = router;
