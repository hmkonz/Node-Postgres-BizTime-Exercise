const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// will actually be "/companies" in app.js file when use these routes

/** GET / => list of companies.
 *
 * =>  {companies: [{code, name, descrip}, {code, name, descrip}, ...]}
 *
 * */
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    // results.rows = [ { code: 'ibm', name: 'IBM' }, { code: 'apple', name: 'apple' } ]
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[code] => detail on company
 *
 * =>  {company: {code, name, descrip, invoices: [id, ...]}}
 *
 * */
router.get("/:code", async (req, res, next) => {
  try {
    // set the code (i.e. apple) found as a parameter in the url (i.e. '/companies/apple') to the variable 'code'
    const { code } = req.params;

    // select the code, name and description of a company with a specific code (i.e. apple)
    const companyResults = await db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`,
      [code]
    );

    // select the id of the invoices associated with the company that has a comp_code that's that same as the code in the query string (i.e. code = apple)
    const invoiceResults = await db.query(
      `SELECT id FROM invoices WHERE comp_code=$1`,
      [code]
    );

    if (companyResults.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    const company = companyResults.rows[0];
    // company = { code: 'apple', name: 'apple', description: 'Maker of OSX.' }

    const invoices = invoiceResults.rows;
    // invoices = [ { id: 11 }, { id: 13 }, { id: 21 } ]

    // interate over the array 'invoices' using 'map' to get an array of invoice ids (invoice.id)
    company.invoices = invoices.map((invoice) => {
      return invoice.id;
    });
    // company.invoices = [ 11, 13, 21 ]

    return res.json(company);
  } catch (err) {
    return next(err);
  }
});

// OR another way of doing it but longer

// const results = await db.query(
//   `SELECT code,
//           name,
//           description,
//           invoices.id,
//           invoices.comp_code,
//           invoices.amt,
//           invoices.paid,
//           invoices.add_date,
//           invoices.paid_date
//     FROM companies
//     INNER JOIN invoices
//     ON (companies.code=invoices.comp_code)
//     WHERE code=$1`,
//   [code]
// );

// results.rows = [
//   {
//     code: 'apple',
//     name: 'apple',
//     description: 'Maker of OSX.',
//     id: 11,
//     comp_code: 'apple',
//     amt: 100,
//     paid: false,
//     add_date: 2023-07-10T06:00:00.000Z,
//     paid_date: null
//   },
//   {
//     code: 'apple',
//     name: 'apple',
//     description: 'Maker of OSX.',
//     id: 13,
//     comp_code: 'apple',
//     amt: 3000,
//     paid: false,
//     add_date: 2023-07-10T06:00:00.000Z,
//     paid_date: null
//   }
// ]

// if (results.rows.length === 0) {
//   throw new ExpressError(`Can't find company with code of ${code}`, 404);
// }
// company.invoices should be an array of the invoice ids listed under each company name so need to iterate over each object in result.rows and add each invoice id to invoiceArray
// invoiceArray = [];

// for (let i = 0; i < results.rows.length; i++) {
//   let data = results.rows[i];

//   invoiceArray.push(data.id);

//   This is data: {
//     code: 'apple',
//     name: 'apple',
//     description: 'Maker of OSX.',
//     id: 11,
//     comp_code: 'apple',
//     amt: 100,
//     paid: false,
//     add_date: 2023-07-10T06:00:00.000Z,
//     paid_date: null
//   }

//   This is invoiceArray: [ 11 ]

//   THis is data: {
//     code: 'apple',
//     name: 'apple',
//     description: 'Maker of OSX.',
//     id: 13,
//     comp_code: 'apple',
//     amt: 3000,
//     paid: false,
//     add_date: 2023-07-10T06:00:00.000Z,
//     paid_date: null
//   }

//   This is invoiceArray: [ 11, 13 ]

// company = {
//   code: data.code,
//   name: data.name,
//   description: data.description,
//   invoices: invoiceArray,
// };
// for each iteration:
// This is company: {
//   code: 'apple',
//   name: 'apple',
//   description: 'Maker of OSX.',
//   invoices: [ 11 ]
// }
// This is company: {
//   code: 'apple',
//   name: 'apple',
//   description: 'Maker of OSX.',
//   invoices: [ 11, 13 ]
// }
// }
// return res.json({ company: company });
// This is company: company
// {
//   code: 'apple',
//   name: 'apple',
//   description: 'Maker of OSX.',
//   invoices: [ 11, 13 ]
// }

/** POST / => add new company
 *
 * {code, name, description}  =>  {company: {code, name, description}}
 *
 * */
router.post("/", async (req, res, next) => {
  try {
    // set the code, name and description found as content of the request.body to 'code', 'name' and 'description'
    const { code, name, description } = req.body;

    const results = await db.query(
      `INSERT INTO companies (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
      [code, name, description]
    );
    // results.rows[0] = { code: 'dell', name: 'dell', description: 'xyz' }
    return res.status(201).json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[code] => update company
 *
 * {name, description}  =>  {company: {code, name, description}}
 *
 * */

router.put("/:code", async (req, res, next) => {
  try {
    // set the code (i.e. apple) found as a parameter in the url (i.e. '/companies/apple') to the variable code
    const { code } = req.params;
    // set the name and description found as content of the request.body to 'name' and 'description'
    const { name, description } = req.body;

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
       WHERE code=$3
       RETURNING code, name, description`,
      [name, description, code]
    );

    // results.rows[0] = { code: 'dell', name: 'dell', description: 'xyzh' } (shows updates)
    if (result.rows.length === 0) {
      throw new ExpressError(`There isn't a company with code of ${code}`, 404);
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** DELETE /[code] => delete company
 *
 * => {status: "added"}
 *
 */
router.delete("/:code", async (req, res, next) => {
  try {
    // set the code (i.e. apple) found as a parameter in the url (i.e. '/companies/apple') to the variable code
    const { code } = req.params;

    const result = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING code`,
      [code]
    );
    // result.rows[0] = { code: 'dell' }
    if (result.rows.length === 0) {
      throw new ExpressError(`No such company with code of ${code}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
