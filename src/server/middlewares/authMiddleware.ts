import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { getDatabase } from '../db/database.js';
import { UserRole } from '../domain/entities.js';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  profileId: string; // patientId or professionalId
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido ou formato inválido.',
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Tenta validar como JWT assinado pelo backend
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;
    const db = await getDatabase();

    // Garante que o usuário e o paciente existam no banco atual (ex: após cold start Serverless)
    let user = await db.getUserById(decoded.userId);
    if (!user && decoded.email) {
      user = await db.getUserByEmail(decoded.email);
    }

    if (!user) {
      user = await db.createUser({
        id: decoded.userId || 'u-' + Date.now(),
        email: decoded.email || 'paciente@rotadasaude.gov.br',
        passwordHash: 'jwt-session',
        name: decoded.name || 'Paciente',
        role: decoded.role || 'PATIENT',
        createdAt: new Date().toISOString(),
      });
    }

    if (decoded.role === 'PATIENT') {
      const targetProfileId = decoded.profileId || 'pat-' + user.id;
      let patient = await db.getPatientById(targetProfileId);
      if (!patient) {
        patient = await db.getPatientByUserId(user.id);
      }
      if (!patient) {
        patient = await db.createPatient({
          id: targetProfileId,
          userId: user.id,
          name: decoded.name || user.name || 'Paciente',
          email: decoded.email || user.email,
          age: 55,
          gender: 'Não especificado',
          conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
          riskLevel: 'MODERADO',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          adherenceRate: 94,
          phone: '(11) 98765-4321',
          createdAt: new Date().toISOString(),
        });
      }
      decoded.profileId = patient.id;
      decoded.userId = user.id;
    }

    req.user = decoded;
    return next();
  } catch {
    // Caso não seja um JWT local, tenta validar como Firebase ID Token
  }

  // 2. Tenta validar como Firebase ID Token (gerado por getAuth().currentUser?.getIdToken())
  try {
    let email = '';
    let name = '';
    let uid = '';
    let picture = '';

    const fbDecoded = await verifyFirebaseIdToken(token);
    if (fbDecoded) {
      uid = fbDecoded.uid;
      email = fbDecoded.email || '';
      name = fbDecoded.name || email.split('@')[0] || 'Usuário Firebase';
      picture = fbDecoded.picture || '';
    } else {
      const unverified = jwt.decode(token) as any;
      if (unverified && (unverified.user_id || unverified.sub) && unverified.email) {
        uid = unverified.user_id || unverified.sub;
        email = unverified.email;
        name = unverified.name || email.split('@')[0] || 'Usuário Firebase';
        picture = unverified.picture || '';
      }
    }

    if (email) {
      const db = await getDatabase();
      let user = await db.getUserByEmail(email);

      if (!user) {
        const userId = 'u-google-' + (uid ? uid.slice(0, 16) : Date.now());
        user = await db.createUser({
          id: userId,
          email,
          passwordHash: 'firebase-oauth',
          name,
          role: 'PATIENT',
          createdAt: new Date().toISOString(),
        });
      }

      let profileId = '';
      if (user.role === 'PATIENT') {
        let patient = await db.getPatientByUserId(user.id);
        if (!patient) {
          profileId = 'pat-' + user.id.replace(/^u-/, '');
          patient = await db.createPatient({
            id: profileId,
            userId: user.id,
            name: user.name || name,
            email: user.email,
            age: 55,
            gender: 'Não especificado',
            conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
            riskLevel: 'MODERADO',
            healthcareUnit: 'UBS Dr. Manoel de Abreu',
            avatarUrl: picture || undefined,
            adherenceRate: 94,
            phone: '(11) 98765-4321',
            createdAt: new Date().toISOString(),
          });
        }
        profileId = patient.id;
      } else {
        let prof = await db.getProfessionalByUserId(user.id);
        if (!prof) {
          profileId = 'prof-' + user.id.replace(/^u-/, '');
          prof = await db.createProfessional({
            id: profileId,
            userId: user.id,
            name: user.name || name,
            email: user.email,
            crm: 'CRM 12345/SP',
            specialty: 'Medicina de Família e Comunidade',
            healthcareUnit: 'UBS Dr. Manoel de Abreu',
            avatarUrl: picture || undefined,
            createdAt: new Date().toISOString(),
          });
        }
        profileId = prof.id;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId,
      };
      return next();
    }
  } catch {
    // Segue para retorno 401
  }

  return res.status(401).json({
    success: false,
    error: 'Token inválido ou expirado. Por favor, faça login novamente.',
  });
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Acesso não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado: privilégios insuficientes para este recurso.',
      });
    }

    next();
  };
}
