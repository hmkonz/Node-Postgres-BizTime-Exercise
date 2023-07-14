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
  let res = await db.query(
    `INSERT INTO
    companies (code, name, description)
    VALUES ('testCompany', 'Test Company', 'This is a test company')`
    );
    
    let result = await db.query(
    `INSERT INTO
    invoices (comp_code, amt, paid, paid_date)
    VALUES ('testCompany', 1000, false, null)
    RETURNING id, amt, paid, add_date, paid_date`
    );
    
    testInvoice = result.rows[0];
   
});


// after each test, delete any data created by test
afterEach(async function () {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
   
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
    expect(response.body).toEqual({invoices: [testInvoice] })
  });
});

/** GET /invoices/[id] - return data about one invoice: `{invoice: invoice}` */
describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    let company = response.body.invoice.company;
    console.log(response.body);
    console.log({invoice: testInvoice, company: company});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoice: testInvoice});
  });
});


