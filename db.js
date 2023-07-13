// /** Database setup for BizTime. */

const { Client } = require("pg");
let DB_URL;

// if running in test "mode", use biztime_test db
// Need to create both databases!

if (process.env.NODE_ENV === "test") {
  DB_URL = "biztime_test";
} else {
  DB_URL = "biztime";
}

let db = new Client({
  host: "/var/run/postgresql/",
  database: DB_URL,
});

db.connect();

module.exports = db;
