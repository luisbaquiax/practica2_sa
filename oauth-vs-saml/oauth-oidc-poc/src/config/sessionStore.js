//config/sessionStore.js

const MySQLStore = require("express-mysql-session")(require("express-session"));
require("dotenv").config();

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
});

/*
sessionStore
  .onReady()
  .then(() => {
    console.log("MySQLStore listo, tabla sessions verificada/creada.");
  })
  .catch((error) => {
    console.error("Error creando MySQLStore:", error);
  });
*/

module.exports = sessionStore;
