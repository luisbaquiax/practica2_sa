const express = require("express");
const { generators } = require("openid-client");
const { getClient } = require("../config/oidcClient");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

/**
 * Decodifica un JWT SIN verificar la firma, solo para mostrar
 * header/payload en pantalla durante el video. NUNCA usar esto
 * para validar un token en código real - eso lo hace la librería
 * internamente contra las llaves públicas (JWKS) del issuer.
 */
function decodeJwtForDisplay(token) {
  if (!token) return null;
  const [headerB64, payloadB64] = token.split(".");
  const decode = (b64) =>
    JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  return {
    header: decode(headerB64),
    payload: decode(payloadB64),
  };
}

// GET /auth/login
router.get("/login", (req, res) => {
  const client = getClient();

  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const state = generators.state();
  const nonce = generators.nonce();

  // Estos valores de un solo uso viven en la sesión del servidor,
  // los necesitamos para validar la respuesta en /callback.
  req.session.oidc = { code_verifier, state, nonce };

  const authorizationUrl = client.authorizationUrl({
    scope: "openid profile email",
    code_challenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  res.redirect(authorizationUrl);
});

// GET /auth/callback
router.get("/callback", async (req, res) => {
  const client = getClient();
  const { code_verifier, state, nonce } = req.session.oidc || {};

  if (!code_verifier || !state) {
    return res
      .status(400)
      .send(
        "Falta el estado de la sesión OIDC. Reinicia el login desde /auth/login"
      );
  }

  const params = client.callbackParams(req);

  try {
    const tokenSet = await client.callback(
      process.env.KC_REDIRECT_URI,
      params,
      {
        code_verifier,
        state,
        nonce,
      }
    );

    req.session.tokens = {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      refresh_token: tokenSet.refresh_token,
      expires_at: tokenSet.expires_at,
    };

    delete req.session.oidc;

    res.redirect("/auth/profile");
  } catch (err) {
    console.error("[auth/callback] Error intercambiando code por tokens:", err);
    res
      .status(500)
      .json({ error: "Fallo el intercambio de tokens", detalle: err.message });
  }
});

// GET /auth/profile
router.get("/profile", requireAuth, async (req, res) => {
  const client = getClient();

  try {
    // Esta llamada ES el concepto de delegación: usamos el access_token para
    // pedirle datos al Authorization Server en nombre del usuario, sin volver
    // a pedirle su password a la app.
    const userinfo = await client.userinfo(req.session.tokens.access_token);

    res.json({
      concepto:
        "El access_token se usa para llamar APIs en nombre del usuario (delegación/OAuth2). El id_token es para que ESTA app sepa quién inició sesión (autenticación/OIDC).",
      id_token_decodificado: decodeJwtForDisplay(req.session.tokens.id_token),
      access_token_decodificado: decodeJwtForDisplay(
        req.session.tokens.access_token
      ),
      userinfo_obtenido_con_access_token: userinfo,
    });
  } catch (err) {
    console.error("[auth/profile] Error consultando userinfo:", err);
    res
      .status(500)
      .json({ error: "Fallo al consultar userinfo", detalle: err.message });
  }
});

// GET /auth/logout
router.get("/logout", (req, res) => {
  const client = getClient();
  const idToken = req.session.tokens ? req.session.tokens.id_token : undefined;

  const endSessionUrl = client.endSessionUrl({
    id_token_hint: idToken,
    post_logout_redirect_uri:
      process.env.KC_POST_LOGOUT_REDIRECT_URI || "http://localhost:3000/",
  });

  req.session.destroy((err) => {
    if (err)
      console.error("[auth/logout] Error destruyendo sesión local:", err);
    res.redirect(endSessionUrl);
  });
});

module.exports = router;
