const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");


// will actually be "/industries" in app.js file when use these routes

/** GET / => list of industries.
 *
 * =>  {industries: [{code, industry_name}, ...]}
 *
 * */
// router.get("/", async (req, res, next) => {
//     try {
//       const results = await db.query(`SELECT code, industry_name FROM industries`);
//       // results.rows = [
//         //   { code: 'it', industry_name: 'Information Technology' },
//         //   { code: 'eng', industry_name: 'Engineering' },
//         //   { code: 'electronics', industry_name: 'Consumer Electronics' },
//         //   { code: 'ss', industry_name: 'Software Services' }
//     // ]
//       return res.json({ industries: results.rows });
//     } catch (err) {
//       return next(err);
//     }
//   });

  /** GET /[code] => detail on industry
  *
  * =>  {industry: {code, industry_name, companies: [code, ...]}}
  *
  * */

router.get("/:code", async (req, res, next) => {
    try {
      // set the code (i.e. eng) found as a parameter in the url (i.e. '/industries/eng') to the variable 'code'
      const { code } = req.params;
  
    // select the code and industry_name of an industry with a specific code (i.e. eng)
      const industryResults = await db.query(
        `SELECT code, industry_name FROM industries WHERE code = $1`, [code]);
   
      // select the companies associated with each industry 
      const companyResults = await db.query(
        `SELECT i.code, i.industry_name, c.code 
        FROM industries as i
        LEFT JOIN companies_industries as ci
        ON i.code=ci.industries_code
        LEFT JOIN companies as c
        ON ci.comp_code=c.code
        WHERE i.code=$1`, [req.params.code]
    );
  
      if (industryResults.rows.length === 0) {
        throw new ExpressError(`Can't find industry with code of ${code}`, 404);
      }
      
      const industry = industryResults.rows[0];
    // industry = [ { code: 'eng', industry_name: 'Engineering' } ]

      const companies = companyResults.rows;
      // companies [
        //     {  code: 'apple', industry_name: 'Engineering'},
        //     { code: 'ibm', industry_name: 'Engineering' }
        // ]
  
      // interate over the array 'companies' using 'map' to get an array of company codes (company.code). industry.companies = [ apple, ibm ] and set that to the vompanies property on industry. industry.companies = [ 'apple', 'ibm' ]
      industry.companies = companies.map((company) => {
        return company.code;
      });

      // This is industry.companies [ 'apple', 'ibm' ]
      // This is industry: {{ code: 'eng', industry_name: 'Engineering',companies: [ 'apple', 'ibm' }}
    
  
      return res.json({industry: industry});
      
    } catch (err) {
      return next(err);
    }
  });

// will actually be "/industries" in app.js file when use these routes

/** GET / => list of industries.
 *
 * =>  {industries: [{code, industry_name, company: [code, ...]}, ...]}
 *
 * */
  
// Route to list all industries with associated company codes
router.get('/', async (req, res) => {
  // select the codes and industry_names of all industries 
  const industriesResults = await db.query(`SELECT code, industry_name FROM industries`);
  const industries = industriesResults.rows;
  // industries = [
  //   { code: 'it', industry_name: 'Information Technology' },
  //   { code: 'eng', industry_name: 'Engineering' },
  //   { code: 'electronics', industry_name: 'Consumer Electronics' },
  //   { code: 'ss', industry_name: 'Software Services' },
  //   { code: 'acct', industry_name: 'Accounting' }
  // ]
  const companiesResults = await db.query(`SELECT code FROM companies`);
  const companies = companiesResults.rows;
  console.log(companies);
  // companies = [ { code: 'apple' }, { code: 'ibm' } ]

  //  select the companies associated with each industry 
  // const companyResults = await db.query(
  //   `SELECT i.code, i.industry_name, c.code 
  //   FROM industries as i
  //   LEFT JOIN companies_industries as ci
  //   ON i.code=ci.industries_code
  //   LEFT JOIN companies as c
  //   ON ci.comp_code=c.code
  //   WHERE i.code=$1`, [req.params.code]
  // );


  // the first map function is used to iterate over each industry object in the industries array
  // For each industry, it filters the companies array to find the companies with a matching industry code
  // the map function is used again to extract the code property of each matching company and create an array of associated company codes
  // Finally, an object is created for each industry, including its code and the array of associated companyCodes.
  // industriesWithCodes variable will hold an array of these objects, representing the industries with their associated company codes.

  const industriesWithCodes = industries.map(function(industry) { 
    const associatedCompanyCodes = companies.filter(function(company) { 
      return company.industry === industry.code; }).map(function(company) { 
        return company.code; }); 
        
    return { code: industry.code, companyCodes: associatedCompanyCodes }; 
    });
  
  return res.json(industriesWithCodes);
  });
  
















/** POST / => add new industry
 *
 * {code, industry_name}  =>  {industry: {code, industry_name}}
 *
 * */
router.post("/", async (req, res, next) => {
    try {
      // set the code and industry_name found as content of the request.body to 'code' and 'industry_name' 
      const { code, industry_name } = req.body;
   
      const results = await db.query(
        `INSERT INTO industries (code, industry_name)
         VALUES ($1, $2)
         RETURNING code, industry_name`,
        [code, industry_name]
      );
      console.log(results.rows);
      console.log(results.rows[0]);
      // results.rows[0] = { code: 'dell', name: 'dell', description: 'xyz' }
      return res.status(201).json({ industry: results.rows[0] });
    } catch (err) {
      return next(err);
    }
  });





module.exports = router;