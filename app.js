/** BizTime express application. */

const express = require("express");

const app = express();
const ExpressError = require("./expressError");

// middleware that parses JSON request bodies
app.use(express.json());

const companiesRoutes = require("./routes/companies");
// using all the companies routes (companiesRoutes) under the prefix "/companies"
app.use("/companies", companiesRoutes);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  // pass err to the 'next' middleware
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  // oritinal code
  // res.status(err.status || 500);
  // return res.json({
  //   error: err,
  //   message: err.message
  // });

  // the default status is 500, Internal Server Error
  let status = err.status || 500;

  // set the status and alert the user
  return res.status(status).json({
    error: {
      message: err.message,
      status: status,
    },
  });
});

module.exports = app;
