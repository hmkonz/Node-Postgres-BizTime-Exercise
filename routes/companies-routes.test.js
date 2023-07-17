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
        companies (code, name, description) VALUES ('testCompany','TestCompany', 'This is a test company')
        RETURNING code, name`
  );

  company = result.rows[0];
  testCompany = {...result.rows[0], description: "This is a test company"};
 
});


// after each test, delete any data created by test
afterEach(async function () {
  await db.query("DELETE FROM companies");
});


// close db connection
afterAll(async function () {
  await db.end();
});


/** GET /companies - returns `{companies: [{code, name}]}` */
describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const response = await request(app).get(`/companies`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({companies: [company]});
  });
});

/** GET /companies/[code] - return data about a specific company: `{company: {code, name, description, invoices: [id, ...]}}` */
describe("GET /companies/:code", () => {
  test("Gets a specific company", async () => {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    const invoiceId = [];
    testCompany.invoices = invoiceId;

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: testCompany});
   });
 });

 /** POST /companies - create company from data; return '{company: {code, name, description}}' */
describe ("POST /companies", () => {
  test("Creates a new company", async () => {
    const response = await request(app).post('/companies').send({code: "testcompany2", name: 'TestCompany2', description: "This is test company 2" });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({company: {code: "testcompany2", name: "TestCompany2", description: "This is test company 2"}
    });
  });
});

/* PUT /companies/[code] - update company; return '{company: {code, name, description}}' */
describe ("PUT /companies/:id", () => {
  test("Updates a specific company", async () => {
    const response = await request(app).put(`/companies/${testCompany.code}`).send({name: "TestCompany2", description: "This is now test company #2"});

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: {code: "testCompany", name: "TestCompany2", description:"This is now test company #2" }
    });
  });
});

/* DELETE /companies/[code] - delete company
 * return '{status: 'deleted'} */
describe ("DELETE /companies/:code", () => {
  test("Deletes a specific company", async () => {
    const response = await request(app).delete(`/companies/${company.code}`);

    expect(response.statusCode).toEqual(200); 
    expect(response.body).toEqual({ status: "deleted" });
  });
});


