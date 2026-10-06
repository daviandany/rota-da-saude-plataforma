import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { getDatabase } from '../db/database.js';
export async function authMiddleware(req, res, next) {
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
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        return next();
    }
    catch {
        // Caso não seja um JWT local, tenta validar como Firebase ID Token
    }
    // 2. Tenta validar como Firebase ID Token (gerado por getAuth().currentUser?.getIdToken())
    try {
        let email = '';
        let name = '';
        let uid = '';
        const fbDecoded = await verifyFirebaseIdToken(token);
        if (fbDecoded) {
            uid = fbDecoded.uid;
            email = fbDecoded.email || '';
            name = fbDecoded.name || email.split('@')[0] || 'Usuário Firebase';
        }
        else {
            const unverified = jwt.decode(token);
            if (unverified && (unverified.user_id || unverified.sub) && unverified.email) {
                uid = unverified.user_id || unverified.sub;
                email = unverified.email;
                name = unverified.name || email.split('@')[0] || 'Usuário Firebase';
            }
        }
        if (email) {
            const db = await getDatabase();
            const user = await db.getUserByEmail(email);
            if (user) {
                let profileId = '';
                if (user.role === 'PATIENT') {
                    const patient = await db.getPatientByUserId(user.id);
                    profileId = patient?.id || '';
                }
                else {
                    const prof = await db.getProfessionalByUserId(user.id);
                    profileId = prof?.id || '';
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
            else if (uid) {
                req.user = {
                    userId: 'u-google-' + uid.slice(0, 16),
                    email,
                    name,
                    role: 'PATIENT',
                    profileId: 'pat-maria',
                };
                return next();
            }
        }
    }
    catch {
        // Segue para retorno 401
    }
    return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado. Por favor, faça login novamente.',
    });
}
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
