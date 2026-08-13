const router = require("express").Router();
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

function bitToBool(value) {
  if (Buffer.isBuffer(value)) return value[0] === 1;
  return Boolean(value);
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await pool.query("SELECT * FROM usuarios WHERE username = ?", [
    username,
  ]);
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return res.status(401).json({ message: "Credenciales incorrectas." });
  }

  if (!bitToBool(usuario.activo)) {
    return res.status(403).json({ message: "Usuario deshabilitado." });
  }

  req.session.userId = usuario.id_usuario;
  req.session.username = usuario.username;

  res.json({ message: "Login exitoso.", username: usuario.username });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ message: "Error al cerrar sesión." });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada exitosamente." });
  });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM usuarios WHERE id_usuario = ?",
    [req.session.userId]
  );
  const usuario = rows[0];

  if (!usuario) {
    return res.status(404).json({ message: "Usuario no encontrado." });
  }

  if (!(await bcrypt.compare(currentPassword, usuario.password_hash))) {
    return res
      .status(401)
      .json({ message: "La contraseña actual no es correcta." });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?",
    [newHash, req.session.userId]
  );

  // revocar todas las demás sesiones activas de este usuario
  await pool.query(
    `DELETE FROM sessions
     WHERE JSON_EXTRACT(data, '$.userId') = ?
     AND session_id != ?`,
    [req.session.userId, req.sessionID]
  );

  res.json({ message: "Contraseña actualizada exitosamente." });
});

router.get("/public", (req, res) => {
  res.json({ message: "Esta es una página pública." });
});

router.get("/protected", requireAuth, (req, res) => {
  res.json({
    message: `Hola ${req.session.username}, esta es una página protegida.`,
  });
});

module.exports = router;
