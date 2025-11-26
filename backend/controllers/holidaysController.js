const Holidays = require("../models/Holidays");

// Get all holidays
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holidays.find();
    res.status(200).json({
      success: true,
      message: "Holidays fetched successfully",
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching holidays",
      error: error.message,
    });
  }
};

// Create a new holiday
exports.createHoliday = async (req, res) => {
  try {
    const holiday = new Holidays(req.body);
    await holiday.save();
    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating holiday",
      error: error.message,
    });
  }
};
