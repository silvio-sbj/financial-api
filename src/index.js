const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

//Middlewares
app.use(express.json());

function verifyIfCustomerExists(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found!" });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

//Routes
app.post("/accounts", (req, res) => {
  const { cpf, name } = req.body;

  const customersAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customersAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    id: uuidv4(),
    cpf,
    name,
    statement: [],
  });

  return res.status(201).send();
});

app.get("/statement", verifyIfCustomerExists, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.post("/deposit", verifyIfCustomerExists, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const operation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(operation);
  return res.status(201).send();
});

app.post("/withdraw", verifyIfCustomerExists, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds!" });
  }

  const operation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(operation);
  return res.status(201).send();
});

app.get("/statement/date", verifyIfCustomerExists, (req, res) => {
  const { date } = req.query;
  const { customer } = req;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.get("/accounts", verifyIfCustomerExists, (req, res) => {
  const { customer } = req;
  return res.json(customer);
});

app.put("/accounts", verifyIfCustomerExists, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;
  return res.status(204).send();
});

app.delete("/accounts", verifyIfCustomerExists, (req, res) => {
  const { customer } = req;
  customers.splice(customer, 1);
  return res.status(204).send();
});

app.get("/balance", verifyIfCustomerExists, (req, res) => {
  const { customer } = req;
  const balance = getBalance(customer.statement);
  return res.json(balance);
});

module.exports = app;