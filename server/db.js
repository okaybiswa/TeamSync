require("temporal-polyfill/global");
require("dotenv/config");

const postgres = require("@prisma/orm-postgres/runtime").default;
const contractJson = require("./prisma/contract.json");

const db = postgres({
  contractJson,
  url: process.env.DATABASE_URL,
});

module.exports = db;