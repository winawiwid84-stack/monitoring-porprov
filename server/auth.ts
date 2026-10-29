import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'koni-bandung-porprov-2026-super-secure-key';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  assigned_post_id: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      assigned_post_id: user.assigned_post_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'usr_viewer_guest',
      username: 'tamu_pimpinan',
      email: 'viewer@koni-bandung.or.id',
      full_name: 'Tamu / Viewer Pimpinan',
      role: 'viewer',
      assigned_post_id: null,
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    req.user = {
      id: 'usr_viewer_guest',
      username: 'tamu_pimpinan',
      email: 'viewer@koni-bandung.or.id',
      full_name: 'Tamu / Viewer Pimpinan',
      role: 'viewer',
      assigned_post_id: null,
    };
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak: Autentikasi diperlukan.' });
    }

    // 'admin' has full access across all modules
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Akses ditolak: Peran Anda (${req.user.role}) tidak memiliki izin untuk tindakan ini.`
    });
  };
}

// Log audit helper
export function logAudit(
  user: AuthenticatedUser | undefined,
  action: string,
  module: string,
  recordId: string | null,
  details: string,
  req: Request
) {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, module, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user ? user.id : 'anon',
      user ? user.username : 'tamu',
      user ? user.role : 'none',
      action,
      module,
      recordId,
      details,
      ip
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
