const express = require("express");
const router = express.Router();
const {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  getClientById
} = require("../controllers/clientController");

router.get("/", getAllClients);
router.get("/:id", getClientById);  // New route to get client by ID
router.post("/", createClient);
// router.put("/:id", updateClient);
router.patch("/:id", updateClient);  // Changed from PUT to PATCH
router.delete("/:id", deleteClient);

module.exports = router;
