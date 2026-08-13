const fs = require("fs");
const path = require("path");
const samlify = require("samlify");
require("dotenv").config();


samlify.setSchemaValidator({
  validate: () => Promise.resolve("skipped-for-poc"),
});

let sp;
let idp;


async function initSamlProviders() {
  const idpMetadataRes = await fetch(process.env.KC_IDP_METADATA_URL);

  if (!idpMetadataRes.ok) {
    throw new Error(
      `No se pudo obtener el metadata SAML de Keycloak (HTTP ${idpMetadataRes.status}). ¿Está el realm/client bien configurado?`
    );
  }

  const idpMetadataXml = await idpMetadataRes.text();

  idp = samlify.IdentityProvider({
    metadata: idpMetadataXml,
  });

  const privateKey = fs.readFileSync(
    path.join(__dirname, "..", "..", "keys", "privkey.pem")
  );
  const certificate = fs.readFileSync(
    path.join(__dirname, "..", "..", "keys", "cert.pem")
  );

  sp = samlify.ServiceProvider({
    entityID: process.env.KC_SP_ENTITY_ID,

    // Estos 3 flags DEBEN coincidir con los atributos del client SAML en
    // Keycloak (realm-export.json) o la validación de firma va a fallar:
    authnRequestsSigned: true, // == saml.client.signature: false
    wantAssertionsSigned: true, // == saml.assertion.signature: true
    wantMessageSigned: true, // == saml.server.signature: true

    signingCert: certificate,
    privateKey,
    isAssertionEncrypted: false,

    assertionConsumerService: [
      {
        Binding: samlify.Constants.namespace.binding.post,
        Location: process.env.KC_ACS_URL,
      },
    ],
    singleLogoutService: [
      {
        Binding: samlify.Constants.namespace.binding.post,
        Location: process.env.KC_ACS_URL.replace("/acs", "/logout/callback"),
      },
    ],
  });

  console.log("[saml] SP e IdP inicializados");
  console.log("[saml] SP entityID:", sp.entityMeta.getEntityID());
  console.log("[saml] IdP entityID:", idp.entityMeta.getEntityID());
  console.log(
    "[saml] IdP SSO endpoint:",
    idp.entityMeta.getSingleSignOnService(
      samlify.Constants.namespace.binding.redirect
    )
  );

  return { sp, idp };
}

function getProviders() {
  if (!sp || !idp) {
    throw new Error(
      "Los providers SAML no se han inicializado. Llama a initSamlProviders() en app.js antes de usar las rutas."
    );
  }
  return { sp, idp };
}

module.exports = { initSamlProviders, getProviders };
