// Tell Node that we're in test "mode" so can connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";
// npm package
const request = require("supertest");
// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;


// create a company before we run each test that we know will be there
beforeEach(async function () {
  let result = await db.query(
    `INSERT INTO 
          invoices (comp_code, amt, paid, paid_date) VALUES ('testCompany', 1000, false, null)
          RETURNING id, comp_code, amt, paid, paid_date`
  );
  
  testInvoice = result.rows[0];
  
});


// after each test, delete any data created by test
afterEach(async function () {
  await db.query("DELETE FROM invoices");
});

// close db connection
afterAll(async function () {
  await db.end();
});

/** GET /invoices - returns `{invoices: [invoice, ...]}` */
describe("GET /invoices", function () {
  test("Gets a list of 1 invoice", async function () {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toBe(200);
    // expect(response.body).toEqual({invoices: [testInvoice]})
  });
});
