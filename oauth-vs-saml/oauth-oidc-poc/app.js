require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const sessionStore = require("./src/config/sessionStore");
const authRoutes = require("./src/routes/auth");
const { initClient } = require("./src/config/oidcClient");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(
  session({
    key: "oidc_poc_session",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hora
      httpOnly: true,
      secure: false,
    },
  })
);

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    autenticado: Boolean(req.session.tokens),
    rutas: ["/auth/login", "/auth/callback", "/auth/profile", "/auth/logout"],
  });
});

const PORT = process.env.PORT || 3000;

// El discovery OIDC contra Keycloak es asíncrono (llamada HTTP a
initClient()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`OAuth2 + OIDC POC corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo inicializar el cliente OIDC:", err.message);
    console.error(
      "¿Está Keycloak levantado? Revisa docker compose y KC_ISSUER en tu .env"
    );
    process.exit(1);
  });
