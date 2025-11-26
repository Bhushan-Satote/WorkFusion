const mongoose = require("mongoose");

const HolidaysSchema = new mongoose.Schema(
  {
    holiday_name: { type: String, required: true },
    holiday_date: { type: Date, required: true },
    is_weekend: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holidays", HolidaysSchema);
