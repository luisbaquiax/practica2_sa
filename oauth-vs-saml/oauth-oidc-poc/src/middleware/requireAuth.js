/**
 * Protege rutas verificando que exista un tokenSet en la sesión del servidor.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({
      error: "No autenticado",
      login: "/auth/login",
    });
  }
  next();
}

module.exports = requireAuth;
