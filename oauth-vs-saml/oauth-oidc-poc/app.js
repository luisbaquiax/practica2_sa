const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const sessionStore = require("./src/config/sessionStore");

const app = express();

app.use(
  cors({
    origin: "http://localhost:4300",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true si se usa HTTPS
      maxAge: 1000 * 60 * 60, // 1 hora
      sameSite: "lax",
    },
  })
);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor session-based corriendo en puerto ${PORT}`);
});

const authRoutes = require("./src/routes/auth");
app.use("/api/auth", authRoutes);