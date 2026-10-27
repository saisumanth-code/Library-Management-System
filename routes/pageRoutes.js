const express = require("express");
const router = express.Router();
const { getHome, getDashboard } = require("../controllers/pageController");

router.get("/", getHome);
router.get("/dashboard", getDashboard);

module.exports = router;
