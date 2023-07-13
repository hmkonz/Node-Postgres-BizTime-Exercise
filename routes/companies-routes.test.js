// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";
// npm package
const request = require("supertest");
// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

// create a company before we run each test that we know will be there
beforeEach(async function () {
  let result = await db.query(
    `INSERT INTO 
        companies (code) VALUES ('testCompany','TestCompany', 'xyz')
        RETURNING id, code, name, description`
  );
  testCompany = result.rows[0];
});

// after each test, delete any data created by test
afterEach(async function () {
  await db.query("DELETE FROM companies");
});

// close db connection
afterAll(async function () {
  await db.end();
});

/** GET /companies - returns `{companies: [company, ...]}` */
describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(200);
  });
});
