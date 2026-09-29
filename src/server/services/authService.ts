import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database';
import { config } from '../config';
import { AuthenticatedUserPayload } from '../middlewares/authMiddleware';
import { User, UserRole } from '../domain/entities';

export class AuthService {
  static async login(email: string, password: string) {
    const db = await getDatabase();
    const user = await db.getUserByEmail(email);

    if (!user) {
      throw new Error('Credenciais inválidas. Verifique o e-mail informado.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Credenciais inválidas. Verifique a senha digitada.');
    }

    let profileId = '';
    let profileData: any = null;

    if (user.role === 'PATIENT') {
      const patient = await db.getPatientByUserId(user.id);
      if (patient) {
        profileId = patient.id;
        profileData = patient;
      }
    } else if (user.role === 'PROFESSIONAL') {
      const professional = await db.getProfessionalByUserId(user.id);
      if (professional) {
        profileId = professional.id;
        profileData = professional;
      }
    }

    const payload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId,
    };

    const token = jwt.sign(payload, config.jwtSecret as jwt.Secret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId,
        profile: profileData,
      },
    };
  }

  static async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    age?: number;
    gender?: string;
    crm?: string;
    conditions?: string[];
  }) {
    const db = await getDatabase();
    const existing = await db.getUserByEmail(data.email);
    if (existing) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const userId = 'u-' + Date.now();

    const newUser: User = {
      id: userId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    await db.createUser(newUser);

    let profileId = '';
    let profileData: any = null;

    if (data.role === 'PATIENT') {
      profileId = 'pat-' + Date.now();
      const patient = await db.createPatient({
        id: profileId,
        userId,
        name: data.name,
        email: data.email,
        age: data.age || 45,
        gender: data.gender || 'Não informado',
        conditions: data.conditions || ['HAS'],
        riskLevel: 'MODERADO',
        healthcareUnit: 'Clínica da Família',
        adherenceRate: 100,
        createdAt: new Date().toISOString(),
      });
      profileData = patient;
    } else {
      profileId = 'prof-' + Date.now();
      // add professional
      profileData = {
        id: profileId,
        userId,
        name: data.name,
        email: data.email,
        crm: data.crm || 'CRM 00000',
        specialty: 'Medicina de Família',
        healthcareUnit: 'Clínica da Família',
        createdAt: new Date().toISOString(),
      };
    }

    const payload: AuthenticatedUserPayload = {
      userId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      profileId,
    };

    const token = jwt.sign(payload, config.jwtSecret as jwt.Secret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        profileId,
        profile: profileData,
      },
    };
  }

  static async getMe(userId: string) {
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    let profileData: any = null;
    let profileId = '';

    if (user.role === 'PATIENT') {
      const patient = await db.getPatientByUserId(user.id);
      profileId = patient ? patient.id : '';
      profileData = patient;
    } else {
      const professional = await db.getProfessionalByUserId(user.id);
      profileId = professional ? professional.id : '';
      profileData = professional;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId,
      profile: profileData,
    };
  }
}
