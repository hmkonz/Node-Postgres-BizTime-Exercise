const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// will actually be "/invoices" in app.js file when use these routes

/** GET / => list of invoices.
 *
 * =>  {invoices: [{id, comp_code}, ...]}
 *
 * */
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    // results.rows =
    // [
    //   { id: 4, comp_code: 'ibm' },
    //   { id: 11, comp_code: 'apple' },
    //   { id: 13, comp_code: 'apple' },
    //   { id: 15, comp_code: 'ibm' }
    // ]
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] => detail on invoice
 *
 * =>  {invoices: {id,
 *                amt,
 *                paid,
 *                add_date,
 *                paid_date,
 *                company: {code, name, description}}}
 *
 * */
router.get("/:id", async (req, res, next) => {
  try {
    // set the id (i.e. 4) found as a parameter in the url (i.e. '/invoices/4') to the variable id
    const { id } = req.params;
    const results = await db.query(
      `SELECT id, 
                comp_code,
                amt, 
                paid, 
                add_date, 
                paid_date,
                companies.name,
                companies.description 
        FROM invoices
            INNER JOIN companies ON (invoices.comp_code=companies.code)
        WHERE id=$1`,
      [id]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find an invoice with an id of ${id}`, 404);
    }
    // set first (and only) object in results.rows array to a variable (data)
    const data = results.rows[0];

    // data =
    // {
    //     id: 11,
    //     comp_code: 'apple',
    //     amt: 100,
    //     paid: false,
    //     add_date: 2023-07-10T06:00:00.000Z,
    //     paid_date: null,
    //     name: 'apple',
    //     description: 'Maker of OSX.'
    //   }

    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };

    // invoice =
    // {
    //     id: 11,
    //     amt: 100,
    //     paid: false,
    //     add_date: 2023-07-10T06:00:00.000Z,
    //     paid_date: null,
    //     company: { code: 'apple', name: 'apple', description: 'Maker of OSX.' }
    //  }

    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

/** POST / => add new invoice
 *
 * {comp_code, amt}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * */

router.post("/", async (req, res, next) => {
  try {
    // set the invoice company code (i.e. apple) and amt found as contents of the request.body to 'comp_code and 'amt'
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    // results.rows[0] =
    // {
    //     id: 19,
    //     comp_code: 'dell',
    //     amt: 1000,
    //     paid: false,
    //     add_date: 2023-07-10T06:00:00.000Z,
    //     paid_date: null
    //   }

    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[code] => update invoice
 *
 * {amt, paid}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * If paying unpaid invoice, set paid_date; if marking as unpaid, clear paid_date.
 * */
router.put("/:id", async (req, res, next) => {
  try {
    // set the id (i.e. 4) found as a parameter in the url (i.e. '/invoices/4') to the variable id
    const { id } = req.params;
    // set the amt and paid found as content of the request.body to 'amt' and 'paid'
    const { amt, paid } = req.body;
    // initialize paidDate as null
    let paidDate = null;
    // retrieve invoice with a specific invoice id and show if paid or not
    // currResult.rows[0] = i.e. { paid: false, paid_date: null } or { paid: true, paid_date: 2023-07-11T06:00:00.000Z }
    const currResult = await db.query(
      `SELECT paid, paid_date
         FROM invoices
         WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    // set variable equal to the paid_date retrieved above in currResult.rows[0]
    const currPaidDate = currResult.rows[0].paid_date;
    // if paid_date is null but paid is true, set paidDate to today's date.
    // if paid is false, set paidDate = null
    // else if paid is true and paid_date is not null, set paidDate to what paid_date equals (currPaidDate)
    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }
    // use paidDate as the value of paid_date when updating a specific invoice
    const result = await db.query(
      `UPDATE invoices
         SET amt=$1, paid=$2, paid_date=$3
         WHERE id=$4
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** DELETE /[code] => delete invoice
 *
 * => {status: "deleted"}
 *
 */
router.delete("/:id", async (req, res, next) => {
  try {
    // set the id (i.e. 4) found as a parameter in the url (i.e. '/invoices/4') to the variable id
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`No such invoice with an id of ${id}`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
