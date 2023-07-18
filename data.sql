\c biztime

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS companies_industries;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE industries (
    code TEXT PRIMARY KEY,
    industry_name TEXT NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    industries_code TEXT NOT NULL REFERENCES industries ON DELETE CASCADE,
    PRIMARY KEY (comp_code, industries_code)
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);


INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries
  VALUES ('it', 'Information Technology'),
         ('eng', 'Engineering'),
         ('electronics', 'Consumer Electronics'),
         ('ss', 'Software Services');

INSERT INTO companies_industries 
   VALUES ('apple', 'electronics'),
          ('apple', 'ss'),
          ('ibm', 'it'),
          ('apple', 'it'),
          ('ibm', 'electronics'),
          ('apple', 'eng'),
          ('ibm', 'eng');

