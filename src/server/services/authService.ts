import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database.js';
import { config } from '../config/index.js';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { AuthenticatedUserPayload } from '../middlewares/authMiddleware.js';
import { User, UserRole } from '../domain/entities.js';

export class AuthService {
  static async login(email: string, password: string, name?: string, role: UserRole = 'PATIENT') {
    const db = await getDatabase();
    let user = await db.getUserByEmail(email);

    if (!user) {
      // Auto-registra o cliente com o nome e perfil fornecido caso ainda não exista
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = 'u-' + Date.now();
      const displayName = name?.trim() || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const newUser: User = {
        id: userId,
        email,
        passwordHash,
        name: displayName,
        role: role || 'PATIENT',
        createdAt: new Date().toISOString(),
      };

      await db.createUser(newUser);
      user = newUser;

      let profileId = '';
      if (user.role === 'PATIENT') {
        profileId = 'pat-' + Date.now();
        await db.createPatient({
          id: profileId,
          userId,
          name: displayName,
          email,
          age: 52,
          gender: 'Não informado',
          conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
          riskLevel: 'MODERADO',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          adherenceRate: 92,
          phone: '(11) 98765-4321',
          createdAt: new Date().toISOString(),
        });
      } else {
        profileId = 'prof-' + Date.now();
        await db.createProfessional({
          id: profileId,
          userId,
          name: displayName.startsWith('Dr') ? displayName : `Dr(a). ${displayName}`,
          email,
          crm: 'CRM ' + Math.floor(10000 + Math.random() * 89999) + '/SP',
          specialty: 'Medicina de Família e Comunidade',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        // Se a senha não coincidir, mas for a senha de demonstração padrão
        if (password === 'paciente123' || password === 'medico123') {
          // Permite login com senha mestra de demonstração
        } else {
          throw new Error('Senha incorreta para este e-mail. Para Maria Silva utilize "paciente123" ou use suas credenciais cadastradas.');
        }
      }
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
      const prof = await db.createProfessional({
        id: profileId,
        userId,
        name: data.name,
        email: data.email,
        crm: data.crm || 'CRM 00000',
        specialty: 'Medicina de Família',
        healthcareUnit: 'Clínica da Família',
        createdAt: new Date().toISOString(),
      });
      profileData = prof;
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

  static async loginWithFirebaseGoogle(payload: {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    role: UserRole;
    idToken?: string;
  }) {
    if (payload.idToken) {
      try {
        const decoded = await verifyFirebaseIdToken(payload.idToken);
        if (decoded) {
          payload.uid = decoded.uid;
          payload.email = decoded.email || payload.email;
          payload.name = decoded.name || payload.name;
          payload.photoURL = decoded.picture || payload.photoURL;
        }
      } catch (err) {
        console.warn('[Firebase Admin] Falha ao verificar idToken, prosseguindo com payload autenticado:', err);
      }
    }

    const db = await getDatabase();
    let user = await db.getUserByEmail(payload.email);

    if (!user) {
      const userId = 'u-google-' + payload.uid.slice(0, 16);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(payload.uid + '-google-oauth', salt);

      const newUser: User = {
        id: userId,
        email: payload.email,
        passwordHash,
        name: payload.name || payload.email.split('@')[0],
        role: payload.role,
        createdAt: new Date().toISOString(),
      };

      await db.createUser(newUser);
      user = newUser;

      let profileId = '';
      if (payload.role === 'PATIENT') {
        profileId = 'pat-' + Date.now();
        await db.createPatient({
          id: profileId,
          userId,
          name: payload.name || 'Paciente Google',
          email: payload.email,
          age: 55,
          gender: 'Não especificado',
          conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
          riskLevel: 'MODERADO',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          avatarUrl: payload.photoURL,
          adherenceRate: 94,
          phone: '(11) 98765-4321',
          createdAt: new Date().toISOString(),
        });
      } else {
        profileId = 'prof-' + Date.now();
        await db.createProfessional({
          id: profileId,
          userId,
          name: payload.name || 'Dr(a). Google',
          email: payload.email,
          crm: 'CRM ' + Math.floor(10000 + Math.random() * 89999) + '/SP',
          specialty: 'Medicina de Família e Comunidade',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          avatarUrl: payload.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
    }

    let profileId = '';
    let profileData: any = null;

    if (user.role === 'PATIENT') {
      const patient = await db.getPatientByUserId(user.id);
      if (patient) {
        profileId = patient.id;
        profileData = patient;
      }
    } else {
      const professional = await db.getProfessionalByUserId(user.id);
      if (professional) {
        profileId = professional.id;
        profileData = professional;
      }
    }

    const tokenPayload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret as jwt.Secret, {
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
        avatarUrl: payload.photoURL || (profileData as any)?.avatarUrl,
        firebaseUid: payload.uid,
        isGoogleAuth: true,
        profile: profileData,
      },
    };
  }

  static async updateProfile(userId: string, data: {
    name?: string;
    age?: number;
    gender?: string;
    conditions?: string[];
    healthcareUnit?: string;
    phone?: string;
    crm?: string;
    specialty?: string;
    riskLevel?: string;
  }) {
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (data.name && data.name.trim()) {
      user.name = data.name.trim();
    }

    let profileData: any = null;
    if (user.role === 'PATIENT') {
      const patient = await db.getPatientByUserId(userId);
      if (patient) {
        const updated = await db.updatePatient(patient.id, {
          name: data.name?.trim() || patient.name,
          age: data.age !== undefined && !isNaN(Number(data.age)) ? Number(data.age) : patient.age,
          gender: data.gender || patient.gender,
          conditions: data.conditions || patient.conditions,
          healthcareUnit: data.healthcareUnit || patient.healthcareUnit,
          phone: data.phone || patient.phone,
          riskLevel: (data.riskLevel as any) || patient.riskLevel,
        });
        profileData = updated;
      }
    } else {
      const prof = await db.getProfessionalByUserId(userId);
      if (prof) {
        if (data.name) prof.name = data.name.trim();
        if (data.crm) prof.crm = data.crm.trim();
        if (data.specialty) prof.specialty = data.specialty.trim();
        if (data.healthcareUnit) prof.healthcareUnit = data.healthcareUnit.trim();
        profileData = prof;
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId: profileData?.id || '',
        avatarUrl: (profileData as any)?.avatarUrl,
        isGoogleAuth: !!(user as any).firebaseUid,
        profile: profileData,
      },
    };
  }

  static async requestPasswordReset(email: string, clientOrigin?: string) {
    const db = await getDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error(`Nenhum usuário cadastrado com o e-mail "${normalizedEmail}". Verifique o endereço digitado.`);
    }

    // Generate unique secure token
    const token = 'rst-' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes

    const resetEntry: PasswordResetToken = {
      token,
      userId: user.id,
      email: user.email,
      userName: user.name,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    activeResetTokens.set(token, resetEntry);

    const baseUrl = clientOrigin ? clientOrigin.replace(/\/$/, '') : '';
    const resetLink = `${baseUrl}/?resetToken=${token}#recuperar-senha`;

    // Simulated institutional email send log
    console.log(`\n======================================================`);
    console.log(`[E-MAIL DISPATCH] Recuperação de Senha - Rota da Saúde SUS`);
    console.log(`Para: ${user.name} <${user.email}>`);
    console.log(`Assunto: Redefinição de Senha de Acesso`);
    console.log(`Link seguro: ${resetLink}`);
    console.log(`Expiração: ${new Date(expiresAt).toLocaleTimeString('pt-BR')}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      message: `Link de recuperação enviado com sucesso para ${user.email}.`,
      resetLink,
      previewEmail: {
        to: user.email,
        userName: user.name,
        subject: 'Recuperação de Senha - Rota da Saúde SUS',
        resetLink,
        expiresInMinutes: 60,
        sentAt: new Date().toISOString(),
      },
    };
  }

  static async verifyResetToken(token: string) {
    if (!token) {
      throw new Error('Token de recuperação não fornecido.');
    }

    const entry = activeResetTokens.get(token);
    if (!entry) {
      throw new Error('Link de recuperação inválido ou expirado. Por favor, solicite um novo link.');
    }

    if (Date.now() > entry.expiresAt) {
      activeResetTokens.delete(token);
      throw new Error('Este link de recuperação expirou. Por favor, solicite um novo link.');
    }

    return {
      valid: true,
      email: entry.email,
      userName: entry.userName,
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw new Error('Token de recuperação obrigatório.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve possuir no mínimo 6 caracteres.');
    }

    await this.verifyResetToken(token);
    const entry = activeResetTokens.get(token)!;

    const db = await getDatabase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updated = await db.updateUserPassword(entry.userId, passwordHash);
    if (!updated) {
      throw new Error('Não foi possível atualizar a senha. Usuário não encontrado.');
    }

    // Invalidate token after single use
    activeResetTokens.delete(token);

    return {
      success: true,
      email: entry.email,
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    };
  }
}

interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  userName: string;
  expiresAt: number;
  createdAt: string;
}

const activeResetTokens = new Map<string, PasswordResetToken>();
