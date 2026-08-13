const { Issuer } = require("openid-client");
require("dotenv").config();

let client;

/**
 * Esto tiene que resolverse ANTES de levantar el servidor Express.
 */
async function initClient() {
  const issuer = await Issuer.discover(process.env.KC_ISSUER);

  console.log("[oidc] Issuer descubierto:", issuer.issuer);
  console.log(
    "[oidc] authorization_endpoint:",
    issuer.metadata.authorization_endpoint
  );
  console.log("[oidc] token_endpoint:", issuer.metadata.token_endpoint);
  console.log("[oidc] userinfo_endpoint:", issuer.metadata.userinfo_endpoint);
  console.log(
    "[oidc] end_session_endpoint:",
    issuer.metadata.end_session_endpoint
  );

  client = new issuer.Client({
    client_id: process.env.KC_CLIENT_ID,
    client_secret: process.env.KC_CLIENT_SECRET,
    redirect_uris: [process.env.KC_REDIRECT_URI],
    response_types: ["code"],
  });

  return client;
}

function getClient() {
  if (!client) {
    throw new Error(
      "El cliente OIDC no se ha inicializado. Llama a initClient() en el arranque de la app (app.js) antes de usar las rutas."
    );
  }
  return client;
}

module.exports = { initClient, getClient };
