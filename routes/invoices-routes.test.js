// Tell Node that we're in test "mode" so can connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";
// npm package
const request = require("supertest");
// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;

// create a company and invoice before we run each test that we know will be there
beforeEach(async function () {
  await db.query(
    `INSERT INTO
    companies (code, name, description)
    VALUES ('testCompany', 'TestCompany', 'This is a test company')`
    );
    
    let result = await db.query(
    `INSERT INTO
    invoices (comp_code, amt, paid, paid_date)
    VALUES ('testCompany', 1000, false, null)
    RETURNING id, amt, paid, paid_date`
    );
  invoice = result.rows[0];
  testInvoice = {...result.rows[0], comp_code: "testCompany"};
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
    expect(response.body).toEqual({invoices: [{id: testInvoice.id, comp_code: testInvoice.comp_code}] })
  });
});



/** GET /invoices/[id] - return data about a specific invoice: `{invoice: invoice}` */
describe("GET /invoices/:id", () => {
  test("Gets a specific invoice", async () => {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    const company = { code: "testCompany", name: "TestCompany", description: "This is a test company"};
    const date = new Date();
    const add_date =  date.toISOString();  
    console.log('This is add_date:', add_date);
    
    const expectedInvoice = {...invoice, add_date, company};
    console.log('This is expectedInvoice:', expectedInvoice);
    console.log('This is response.body:', response.body);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoice: expectedInvoice});
  });
 }); 

/** POST /invoices - create invoice from data; return '{invoice: invoice}' */
describe ("POST /invoices", () => {
  // let today = new Date();
  // console.log('This is today:', today.setHours(0,0,0,0));
  test("Creates a new invoice", async () => {
    const response = await request(app).post('/invoices').send({comp_code: "testCompany", amt: 250});
  
    expect(response.statusCode).toEqual(201);
    // expect(response.body).toEqual({invoice: {id: expect.any(Number), comp_code: "testcompany", amt: 250, paid: false, add_date: "2023-07-17T06:00:00.000Z",
    // paid_date: null}
    // });
  });
});

/* PUT /invoices/[id] - update invoice; return '{invoice: invoice}' */
describe ("PUT /invoices/:id", () => {
  test("Updates a specific invoice", async () => {
    const response = await request(app).put(`/invoices/${testInvoice.id}`).send({amt: 200, paid: false});
   
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoice: {id: expect.any(Number), comp_code: "testCompany", amt: 200, paid: false, add_date: '2023-07-17T06:00:00.000Z',
    paid_date: null}
    });
  });
});

/* DELETE /invoices/[id] - delete invoice
 * return '{status: 'deleted'} */
describe ("DELETE /invoices/:id", () => {
  test("Deletes a specific invoice", async () => {
    const response = await request(app).delete(`/invoices/${testInvoice.id}`);
    
    expect(response.statusCode).toEqual(200); 
    expect(response.body).toEqual({ status: "deleted" });
  });
});




