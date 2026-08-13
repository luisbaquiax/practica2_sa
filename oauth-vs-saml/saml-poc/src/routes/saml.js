const express = require("express");
const { getProviders } = require("../config/samlProvider");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /saml/metadata
router.get("/metadata", (req, res) => {
  const { sp } = getProviders();
  res.header("Content-Type", "text/xml").send(sp.getMetadata());
});

// GET /saml/login
router.get("/login", (req, res) => {
  const { sp, idp } = getProviders();
  const { context } = sp.createLoginRequest(idp, "redirect");
  res.redirect(context);
});

// POST /saml/acs (Assertion Consumer Service)
router.post(
  "/acs",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const { sp, idp } = getProviders();

    try {
      const { samlContent, extract } = await sp.parseLoginResponse(
        idp,
        "post",
        req
      );

      // Guardamos lo esencial en la sesión (server-side, en MySQL)
      req.session.saml = {
        nameID: extract.nameID,
        attributes: extract.attributes || extract.attribute || {},
        sessionIndex:
          extract.sessionIndex || (extract.response && extract.response.id),
        rawAssertionXml: samlContent,
      };

      res.redirect("/saml/profile");
    } catch (err) {
      console.error("[saml/acs] Error parseando la SAML Response:", err);
      res
        .status(400)
        .json({ error: "SAML Response inválida", detalle: err.message });
    }
  }
);

// GET /saml/profile
router.get("/profile", requireAuth, (req, res) => {
  res.json({
    concepto:
      "La SAML Assertion es el equivalente 'todo en uno' del id_token + access_token de OIDC: un solo documento XML firmado que trae identidad (NameID) y atributos (roles, email) juntos.",
    nameID: req.session.saml.nameID,
    atributos: req.session.saml.attributes,
    assertion_xml_cruda: req.session.saml.rawAssertionXml,
  });
});

// GET /saml/logout
router.get("/logout", (req, res) => {
  const { sp, idp } = getProviders();
  const samlSession = req.session.saml;

  if (!samlSession || !samlSession.nameID) {
    return req.session.destroy(() => res.redirect("/"));
  }

  const { context } = sp.createLogoutRequest(idp, "redirect", {
    logoutNameID: samlSession.nameID,
    sessionIndex: samlSession.sessionIndex,
  });

  res.redirect(context);
});

// POST /saml/logout/callback
router.post(
  "/logout/callback",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const { sp, idp } = getProviders();

    try {
      await sp.parseLogoutResponse(idp, "post", req);
    } catch (err) {
      console.error(
        "[saml/logout/callback] Error parseando LogoutResponse:",
        err
      );
    }

    req.session.destroy((err) => {
      if (err)
        console.error(
          "[saml/logout/callback] Error destruyendo sesión local:",
          err
        );
      res.redirect("/");
    });
  }
);

module.exports = router;
