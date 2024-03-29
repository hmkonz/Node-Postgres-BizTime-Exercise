const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");


// will actually be "/industries" in app.js file when use these routes

/** GET / => list of industries with their associated company codes
 *
 * =>  {industries: [{code, industry_name, company: [code, ...]}
 *
 * */
  
// Route to list all industries with associated company codes
router.get('/', async (req, res) => {
  try {
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
    // companies = [ { code: 'apple' }, { code: 'ibm' } ]

    const companiesIndustriesResults = await db.query(`SELECT * from companies_industries`);
    const companiesIndustries = companiesIndustriesResults.rows;
  
    // This is companiesIndustriesResults.rows [
      //   { comp_code: 'apple', industries_code: 'electronics' },
      //   { comp_code: 'apple', industries_code: 'ss' },
      //   { comp_code: 'ibm', industries_code: 'it' },
      //   { comp_code: 'apple', industries_code: 'it' },
      //   { comp_code: 'ibm', industries_code: 'electronics' },
      //   { comp_code: 'apple', industries_code: 'eng' },
      //   { comp_code: 'ibm', industries_code: 'eng' }
      // ]


  // the map function is used to iterate over each industry object in the industries array
  const industriesWithCodes = industries.map(function(industry) {
  // For each industry in industries i.e. { code: 'it', industry_name: 'Information Technology' }, filter the companiesIndustries array to find the rows where industries_code has  matches an industry code  
    const associatedCompanyCodes = companiesIndustries.filter(function(comp_ind) {
      // this is the first iteration over companiesIndustries (comp_ind):
      // { comp_code: 'apple', industries_code: 'electronics' } 
      // return an object that contains the comp_ind.industries_code that equals industry.code
      return comp_ind.industries_code === industry.code;}).map(function(ind_code) { 
    
      // ind_code = { comp_code: 'ibm', industries_code: 'it' }  on first iteration where comp_ind.industries_code=industry.code, and { comp_code: 'apple', industries_code: 'it' } on second iteration
      // the map function is used again to extract the comp_code property of each matching industries_code and creates an array of associated comp_codes ["ibm", "apple"]
    
          return ind_code.comp_code;          
      });    
          // Finally, an object is created for each industry, including its code and the array of associated companyCodes.
          // associatedCompanyIndustryCodes = [ 'ibm', 'apple' ]
          return { code: industry.code, companyCodes: associatedCompanyCodes }; 
     

  }); 
  // industriesWithCodes variable will hold an array of objects, representing the industries with their associated company codes.
  // this is industriesWithCodes [
  //   { code: 'it', companyCodes: [ 'ibm', 'apple' ] },
  //   { code: 'eng', companyCodes: [ 'apple', 'ibm' ] },
  //   { code: 'electronics', companyCodes: [ 'apple', 'ibm' ] },
  //   { code: 'ss', companyCodes: [ 'apple' ] },
  //   { code: 'acct', companyCodes: [] }
  // ]
    return res.json(industriesWithCodes);
  } catch(err) {
    return next(err);
  }
});


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
      // results.rows[0] = { code: 'dell', name: 'dell', description: 'xyz' }
      return res.status(201).json({ industry: results.rows[0] });
    } catch (err) {
      return next(err);
    }
  });



// will actually be "/industries/:industryCode/companies" in app.js file when use these routes

/** POST/ => insert a companycode (i.e. "apple") for an specific industry code in the query string (i.e. "HR") into the companies_industries table
 *  
 * (i.e. POST http://localhost:3000/industries/HR/companies in insomnia):
 *    {
 *     "companyCode": "apple"
 *  	}
 * 
 * => // {
      //   "industry": {
      //     "comp_code": "apple",
      //     "industries_code": "HR"
      //   }
      // }
 *
 * */

// Route to associate an industry with a company
router.post('/:industryCode/companies', async (req, res, next) => {
  try {
    const { industryCode } = req.params; // Industry code from the URL i.e. HR
    const { companyCode } = req.body; // Company code from the request body 
    // added in insomnia:
    // i.e.  {
          // "companyCode": "apple"
     	    // }

    // get the code and industry_name of all industries in the industries table
    const industriesResults = await db.query(`SELECT code, industry_name FROM industries`);
    const industries = industriesResults.rows;
    // This is industries:
    //  [
      //   { code: 'it', industry_name: 'Information Technology' },
      //   { code: 'eng', industry_name: 'Engineering' },
      //   { code: 'electronics', industry_name: 'Consumer Electronics' },
      //   { code: 'ss', industry_name: 'Software Services' },
      //   { code: 'acct', industry_name: 'Accounting' },
      //   { code: 'HR', industry_name: 'Human Resources' },
      //   { code: 'fas', industry_name: 'fashion' }
      // ]
    
    // get the code of all companies in the companies table
    const companiesResults = await db.query(`SELECT code FROM companies`);
    const companies = companiesResults.rows;
    // This is companies: [ { code: 'apple' }, { code: 'ibm' } ]

    // Find the industry with the specified code entered in the URL ("HR")
    const industry = industries.find(industry => industry.code === industryCode);
    // This is industry: { code: 'HR', industry_name: 'Human Resources' } 
   
    // if industry with code entered in the URL cannot be found in the industries table, return an error
    if (!industry) { return res.status(404).json({ error: `Industry ${industryCode} not found` }); } 
    
    // Find the company with the code found in req.body (i.e. "companyCode": "apple")
    // {
      // 	"companyCode": "apple"
    // }
    const company = companies.find(company => company.code === companyCode); 
    // This is company { code: 'apple' }

    // if company with companyCode entered in the request body cannot be found in the companies table (i.e. "companyCode": "qwerty" ), return an error
    if (!company) { return res.status(404).json({ error: `Company not found` }); } 
    
    // Insert a row into the companies_industries table with industryCode found in the URL (i.e. "acct") and companyCode found in the body of the request (i.e. "apple")
    const results = await db.query(
      `INSERT INTO companies_industries (comp_code, industries_code)
       VALUES ($1, $2)
       RETURNING comp_code, industries_code`,
      [industryCode, companyCode]
    );
 
    // results.rows[0] = { comp_code: 'apple', industries_code: 'HR' }
    // industry: results.rows[0] = 
      // {
      //   "industry": {
      //     "comp_code": "apple",
      //     "industries_code": "HR"
      //   }
      // }
    return res.json({ industry: results.rows[0] });
 
    
     
  
   
    













  
    // Find the industry with the specified code
    // const industry = await db.query(
    //   `SELECT code, industry_name FROM industries WHERE code = $1`, [industryCode]);
    // console.log(industry);

    // // // Find the company with the specified code
    // const company = await db.query(
    //   `SELECT code FROM companies`);
    // console.log(company);
    
    // // const industry = industries.find(industry => industry.code === code);

    // if (!industry) {
    // return res.status(404).json({ error: 'Industry not found' });
    // }
  
    // const company = companies.find(function(company) {
    //   company.code === companyCode
    // });
    // console.log(company);

    // // /Find the company with the specified code
    // // const company = companies.find(company => company.code === companyCode);
    // // console.log(company);
    // if (!company) {
    // return res.status(404).json({ error: 'Company not found' });
    // }
  
    // // Associate the company with the industry
    // industry.companies.push(companyCode);
  
    // res.json({ message: 'Company associated with industry successfully' });
 
  }catch(err) {
  return next(err)
  }
});


module.exports = router;