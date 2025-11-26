const express = require("express");
const router = express.Router();
const {
  getHolidays,
  createHoliday,
} = require("../controllers/holidaysController");

router.get("/", getHolidays);
router.post("/", createHoliday);

module.exports = router;
