require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const sessionStore = require("./src/config/sessionStore");
const samlRoutes = require("./src/routes/saml");
const { initSamlProviders } = require("./src/config/samlProvider");

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(
  session({
    key: "saml_poc_session",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hora
      httpOnly: true,
      secure: false, // poner en true si sirves por HTTPS
    },
  })
);

app.use("/saml", samlRoutes);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    autenticado: Boolean(req.session.saml),
    rutas: ["/saml/metadata", "/saml/login", "/saml/profile", "/saml/logout"],
  });
});

const PORT = process.env.PORT || 4000;

// el intercambio de metadata con Keycloak es
initSamlProviders()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SAML 2.0 POC corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "No se pudieron inicializar los providers SAML:",
      err.message
    );
    console.error(
      "¿Está Keycloak levantado? Revisa docker compose y KC_IDP_METADATA_URL en tu .env"
    );
    process.exit(1);
  });
