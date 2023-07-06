const express = require("express");
const router = express.Router();
const expressError = require("../expressError");
const db = require("../db");

// will actually be "/companies" in app.js file when use these routes
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
