import jwt from "jsonwebtoken";
import { db } from "./db.js";
const JWT_SECRET = process.env.JWT_SECRET || "koni-bandung-porprov-2026-super-secure-key";
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      assigned_post_id: user.assigned_post_id
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Akses ditolak: Token autentikasi tidak ditemukan." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi kedaluwarsa atau token tidak valid. Silakan login kembali." });
  }
}
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = {
      id: "usr_viewer_guest",
      username: "tamu_pimpinan",
      email: "viewer@koni-bandung.or.id",
      full_name: "Tamu / Viewer Pimpinan",
      role: "viewer",
      assigned_post_id: null
    };
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = {
      id: "usr_viewer_guest",
      username: "tamu_pimpinan",
      email: "viewer@koni-bandung.or.id",
      full_name: "Tamu / Viewer Pimpinan",
      role: "viewer",
      assigned_post_id: null
    };
    next();
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Akses ditolak: Autentikasi diperlukan." });
    }
    if (req.user.role === "admin" || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Akses ditolak: Peran Anda (${req.user.role}) tidak memiliki izin untuk tindakan ini.`
    });
  };
}
function logAudit(user, action, module, recordId, details, req) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, module, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user ? user.id : "anon",
      user ? user.username : "tamu",
      user ? user.role : "none",
      action,
      module,
      recordId,
      details,
      ip
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
export {
  authMiddleware,
  generateToken,
  logAudit,
  optionalAuth,
  requireRole
};
