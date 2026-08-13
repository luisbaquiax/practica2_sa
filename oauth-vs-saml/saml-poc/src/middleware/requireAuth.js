/**
 * Protege rutas verificando que exista una sesión SAML válida
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.saml) {
    return res.status(401).json({
      error: "No autenticado",
      login: "/saml/login",
    });
  }
  next();
}

module.exports = requireAuth;
