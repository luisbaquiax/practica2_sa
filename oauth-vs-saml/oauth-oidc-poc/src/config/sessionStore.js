const session = require("express-session");
const MySQLStoreFactory = require("express-mysql-session");
const pool = require("./db");

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({}, pool);

sessionStore
  .onReady()
  .then(() => console.log("[sessionStore] MySQLStore listo"))
  .catch((error) => {
    console.error("[sessionStore] Error inicializando MySQLStore:", error);
  });

module.exports = sessionStore;
