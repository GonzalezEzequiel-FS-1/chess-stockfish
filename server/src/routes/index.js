const express = require("express");
const router = express.Router();
const { analyze, play, test } = require("../controllers/serverControllers");

router.get("/testing", test);
router.post("/play", play);
router.post("/analyze", analyze);

module.exports = router;
