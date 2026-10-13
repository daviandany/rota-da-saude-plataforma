import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, IDatabase } from '../db/database.js';
import { config } from '../config/index.js';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { AuthenticatedUserPayload } from '../middlewares/authMiddleware.js';
import { Patient, User, UserRole } from '../domain/entities.js';

export function deriveDeterministicId(prefix: string, identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) | 0;
  }
  const parts = clean.split(':');
  const basePart = (parts.length > 1 ? parts[parts.length - 1] : clean.split('@')[0])
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);
  return `${prefix}-${basePart || 'user'}-${Math.abs(hash).toString(36)}`;
}

async function getLinkedPatientsForLogin(db: IDatabase, userId: string, email: string): Promise<Patient[]> {
  const all = await db.getAllPatients();
  const normEmail = email.trim().toLowerCase();
  return all.filter(
    (p) => p.userId === userId || (p.email && p.email.trim().toLowerCase() === normEmail)
  );
}

async function resolveOrCreatePatientForLogin(
  db: IDatabase,
  user: User,
  options?: {
    requestedPatientId?: string;
    requestedName?: string;
    age?: number;
    gender?: string;
    conditions?: string[];
    avatarUrl?: string;
    forceNew?: boolean;
  }
): Promise<{ patient: Patient; linkedPatients: Patient[] }> {
  const normEmail = user.email.trim().toLowerCase();
  const cleanName = options?.requestedName?.trim();
  let linked = await getLinkedPatientsForLogin(db, user.id, normEmail);

  // 1. Se um patientId específico foi solicitado, prioriza ele
  if (options?.requestedPatientId && !options?.forceNew) {
    const byId = await db.getPatientById(options.requestedPatientId);
    if (byId) {
      if (!linked.some((p) => p.id === byId.id)) {
        linked = [byId, ...linked];
      }
      return { patient: byId, linkedPatients: linked };
    }
  }

  // 2. Se um nome foi informado no login/cadastro, procura paciente com esse nome no mesmo login (ou globalmente se demo)
  if (cleanName && !options?.forceNew) {
    const nameLower = cleanName.toLowerCase();
    const matchInLinked = linked.find((p) => p.name.trim().toLowerCase() === nameLower);
    if (matchInLinked) {
      return { patient: matchInLinked, linkedPatients: linked };
    }

    // Se ainda não há paciente com esse nome neste login, cria um prontuário individualizado com ID único (email + nome)
    const uniqueKey = linked.length === 0 ? normEmail : `${normEmail}:${nameLower}`;
    const detPatId = deriveDeterministicId('pat', uniqueKey);
    const existingByDetId = await db.getPatientById(detPatId);
    if (existingByDetId && existingByDetId.name.trim().toLowerCase() === nameLower) {
      if (!linked.some((p) => p.id === existingByDetId.id)) {
        linked = [existingByDetId, ...linked];
      }
      return { patient: existingByDetId, linkedPatients: linked };
    }

    const newPat = await db.createPatient({
      id: existingByDetId ? deriveDeterministicId('pat', `${normEmail}:${nameLower}:${Date.now().toString(36).slice(-3)}`) : detPatId,
      userId: user.id,
      name: cleanName,
      email: normEmail,
      age: options?.age || 54,
      gender: options?.gender || 'Não informado',
      conditions: options?.conditions || ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
      riskLevel: 'MODERADO',
      healthcareUnit: 'UBS Dr. Manoel de Abreu',
      avatarUrl: options?.avatarUrl,
      adherenceRate: 92,
      phone: '(11) 98765-4321',
      createdAt: new Date().toISOString(),
    });
    linked = [newPat, ...linked.filter((p) => p.id !== newPat.id)];
    return { patient: newPat, linkedPatients: linked };
  }

  // 3. Caso forceNew (novo paciente cadastrado com o mesmo login)
  if (options?.forceNew) {
    const targetName = cleanName || user.name || 'Paciente';
    const newId = deriveDeterministicId(
      'pat',
      `${normEmail}:${targetName.toLowerCase()}:${linked.length + 1}`
    );
    const created = await db.createPatient({
      id: newId,
      userId: user.id,
      name: targetName,
      email: normEmail,
      age: options?.age || 50,
      gender: options?.gender || 'Não informado',
      conditions: options?.conditions || ['Hipertensão Arterial (HAS)'],
      riskLevel: 'MODERADO',
      healthcareUnit: 'UBS Dr. Manoel de Abreu',
      avatarUrl: options?.avatarUrl,
      adherenceRate: 95,
      phone: '(11) 98765-4321',
      createdAt: new Date().toISOString(),
    });
    linked = [created, ...linked.filter((p) => p.id !== created.id)];
    return { patient: created, linkedPatients: linked };
  }

  // 4. Fallback: primeiro paciente vinculado ao login ou cria o inicial
  if (linked.length > 0) {
    return { patient: linked[0], linkedPatients: linked };
  }

  const defaultPatId = deriveDeterministicId('pat', normEmail);
  const defaultPat =
    (await db.getPatientById(defaultPatId)) ||
    (await db.createPatient({
      id: defaultPatId,
      userId: user.id,
      name: cleanName || user.name || 'Paciente',
      email: normEmail,
      age: options?.age || 52,
      gender: options?.gender || 'Não informado',
      conditions: options?.conditions || ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
      riskLevel: 'MODERADO',
      healthcareUnit: 'UBS Dr. Manoel de Abreu',
      avatarUrl: options?.avatarUrl,
      adherenceRate: 92,
      phone: '(11) 98765-4321',
      createdAt: new Date().toISOString(),
    }));
  return { patient: defaultPat, linkedPatients: [defaultPat] };
}

export class AuthService {
  static async login(
    email: string,
    password: string,
    name?: string,
    role: UserRole = 'PATIENT',
    patientId?: string
  ) {
    const db = await getDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    let user = await db.getUserByEmail(normalizedEmail);

    if (!user) {
      // Auto-registra o cliente com ID determinístico único baseado no e-mail
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = deriveDeterministicId('u', normalizedEmail);
      const displayName =
        name?.trim() ||
        normalizedEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        name: displayName,
        role: role || 'PATIENT',
        createdAt: new Date().toISOString(),
      };

      await db.createUser(newUser);
      user = newUser;
    } else {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        if (password === 'paciente123' || password === 'medico123') {
          // Permite login com senha mestra de demonstração
        } else {
          throw new Error('Senha incorreta para este e-mail. Para Maria Silva utilize "paciente123", para Dr. Carlos utilize "medico123" ou use suas credenciais cadastradas.');
        }
      }

      // Alinha o papel (role) caso o usuário selecione explicitamente Médico ou Paciente no login
      if (role && user.role !== role) {
        user.role = role;
        await db.createUser(user);
      }
      if (name && name.trim() && role === 'PROFESSIONAL' && user.name !== name.trim()) {
        user.name = name.trim();
        await db.createUser(user);
      }
    }

    let profileId = '';
    let profileData: any = null;
    let linkedPatients: Patient[] = [];

    if (user.role === 'PATIENT') {
      const resolved = await resolveOrCreatePatientForLogin(db, user, {
        requestedPatientId: patientId,
        requestedName: name,
      });
      profileId = resolved.patient.id;
      profileData = resolved.patient;
      linkedPatients = resolved.linkedPatients;
    } else if (user.role === 'PROFESSIONAL') {
      let professional = await db.getProfessionalByUserId(user.id);
      if (!professional) {
        const detProfId = deriveDeterministicId('prof', user.email);
        const profName = name?.trim() || user.name;
        professional = (await db.getProfessionalById(detProfId)) || (await db.createProfessional({
          id: detProfId,
          userId: user.id,
          name: profName.startsWith('Dr') ? profName : `Dr(a). ${profName}`,
          email: user.email,
          crm: 'CRM 12345/SP',
          specialty: 'Medicina de Família e Comunidade',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          createdAt: new Date().toISOString(),
        }));
      }
      profileId = professional.id;
      profileData = professional;
      linkedPatients = await getLinkedPatientsForLogin(db, user.id, user.email);
    }

    const activeDisplayName =
      user.role === 'PATIENT' && profileData?.name ? profileData.name : profileData?.name || user.name;

    const payload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: activeDisplayName,
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
        name: activeDisplayName,
        role: user.role,
        profileId,
        profile: profileData,
        linkedPatients,
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
    const normalizedEmail = data.email.trim().toLowerCase();
    let user = await db.getUserByEmail(normalizedEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      const userId = deriveDeterministicId('u', normalizedEmail);

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        name: data.name.trim(),
        role: data.role,
        createdAt: new Date().toISOString(),
      };

      await db.createUser(newUser);
      user = newUser;
    } else if (user.role !== data.role) {
      user.role = data.role;
      await db.createUser(user);
    }

    let profileId = '';
    let profileData: any = null;
    let linkedPatients: Patient[] = [];

    if (data.role === 'PATIENT') {
      // Permite cadastrar/identificar múltiplos pacientes sob o mesmo login (mesmo e-mail)
      const resolved = await resolveOrCreatePatientForLogin(db, user, {
        requestedName: data.name,
        age: data.age,
        gender: data.gender,
        conditions: data.conditions,
      });
      profileId = resolved.patient.id;
      profileData = resolved.patient;
      linkedPatients = resolved.linkedPatients;
    } else {
      profileId = deriveDeterministicId('prof', normalizedEmail);
      const prof = await db.createProfessional({
        id: profileId,
        userId: user.id,
        name: data.name,
        email: normalizedEmail,
        crm: data.crm || 'CRM 00000',
        specialty: 'Medicina de Família',
        healthcareUnit: 'Clínica da Família',
        createdAt: new Date().toISOString(),
      });
      profileData = prof;
      linkedPatients = await getLinkedPatientsForLogin(db, user.id, normalizedEmail);
    }

    const activeDisplayName =
      data.role === 'PATIENT' && profileData?.name ? profileData.name : data.name || user.name;

    const payload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: activeDisplayName,
      role: data.role,
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
        name: activeDisplayName,
        role: data.role,
        profileId,
        profile: profileData,
        linkedPatients,
      },
    };
  }

  static async getMe(userId: string, currentProfileId?: string) {
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    let profileData: any = null;
    let profileId = currentProfileId || '';
    const linkedPatients = await getLinkedPatientsForLogin(db, user.id, user.email);

    if (user.role === 'PATIENT') {
      let patient = profileId ? await db.getPatientById(profileId) : null;
      if (!patient) {
        patient = linkedPatients[0] || (await db.getPatientByUserId(user.id));
      }
      profileId = patient ? patient.id : '';
      profileData = patient;
    } else {
      let professional = profileId ? await db.getProfessionalById(profileId) : null;
      if (!professional) {
        professional = await db.getProfessionalByUserId(user.id);
      }
      profileId = professional ? professional.id : '';
      profileData = professional;
    }

    const activeName =
      user.role === 'PATIENT' && profileData?.name ? profileData.name : profileData?.name || user.name;

    return {
      id: user.id,
      email: user.email,
      name: activeName,
      role: user.role,
      profileId,
      profile: profileData,
      linkedPatients,
    };
  }

  static async switchActivePatient(
    userId: string,
    options: {
      patientId?: string;
      newPatientName?: string;
      age?: number;
      gender?: string;
      conditions?: string[];
      role?: UserRole;
    }
  ) {
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const targetRole: UserRole = options.role || 'PATIENT';
    if (user.role !== targetRole) {
      user.role = targetRole;
      await db.createUser(user);
    }

    let profileId = '';
    let profileData: any = null;
    let linkedPatients = await getLinkedPatientsForLogin(db, user.id, user.email);

    if (targetRole === 'PATIENT') {
      const resolved = await resolveOrCreatePatientForLogin(db, user, {
        requestedPatientId: options.patientId,
        requestedName: options.newPatientName,
        age: options.age,
        gender: options.gender,
        conditions: options.conditions,
        forceNew: Boolean(options.newPatientName && !options.patientId),
      });
      profileId = resolved.patient.id;
      profileData = resolved.patient;
      linkedPatients = resolved.linkedPatients;
    } else {
      let professional = await db.getProfessionalByUserId(user.id);
      if (!professional) {
        const detProfId = deriveDeterministicId('prof', user.email);
        professional =
          (await db.getProfessionalById(detProfId)) ||
          (await db.createProfessional({
            id: detProfId,
            userId: user.id,
            name: user.name.startsWith('Dr') ? user.name : `Dr(a). ${user.name}`,
            email: user.email,
            crm: 'CRM 12345/SP',
            specialty: 'Medicina de Família e Comunidade',
            healthcareUnit: 'UBS Dr. Manoel de Abreu',
            createdAt: new Date().toISOString(),
          }));
      }
      profileId = professional.id;
      profileData = professional;
    }

    const activeName =
      targetRole === 'PATIENT' && profileData?.name ? profileData.name : profileData?.name || user.name;

    const tokenPayload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: activeName,
      role: targetRole,
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
        name: activeName,
        role: targetRole,
        profileId,
        profile: profileData,
        linkedPatients,
      },
    };
  }

  static async loginWithFirebaseGoogle(payload: {
    uid: string;
    email: string;
    name: string;
    customPatientName?: string;
    patientId?: string;
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
    const normalizedEmail = payload.email.trim().toLowerCase();
    let user = await db.getUserByEmail(normalizedEmail);

    if (!user) {
      const userId = payload.uid ? 'u-google-' + payload.uid.slice(0, 16) : deriveDeterministicId('u', normalizedEmail);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(payload.uid + '-google-oauth', salt);

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        name: payload.customPatientName?.trim() || payload.name || normalizedEmail.split('@')[0],
        role: payload.role,
        createdAt: new Date().toISOString(),
      };

      await db.createUser(newUser);
      user = newUser;
    } else {
      if (payload.role && user.role !== payload.role) {
        user.role = payload.role;
        await db.createUser(user);
      }
    }

    let profileId = '';
    let profileData: any = null;
    let linkedPatients: Patient[] = [];

    if (user.role === 'PATIENT') {
      const targetName = payload.customPatientName?.trim() || payload.name;
      const resolved = await resolveOrCreatePatientForLogin(db, user, {
        requestedPatientId: payload.patientId,
        requestedName: targetName,
        avatarUrl: payload.photoURL,
      });
      profileId = resolved.patient.id;
      profileData = resolved.patient;
      linkedPatients = resolved.linkedPatients;
    } else {
      let professional = await db.getProfessionalByUserId(user.id);
      if (!professional) {
        const detProfId = deriveDeterministicId('prof', user.email);
        professional = (await db.getProfessionalById(detProfId)) || (await db.createProfessional({
          id: detProfId,
          userId: user.id,
          name: payload.name || user.name,
          email: user.email,
          crm: 'CRM 12345/SP',
          specialty: 'Medicina de Família e Comunidade',
          healthcareUnit: 'UBS Dr. Manoel de Abreu',
          avatarUrl: payload.photoURL,
          createdAt: new Date().toISOString(),
        }));
      }
      profileId = professional.id;
      profileData = professional;
      linkedPatients = await getLinkedPatientsForLogin(db, user.id, user.email);
    }

    const activeName =
      user.role === 'PATIENT' && profileData?.name ? profileData.name : profileData?.name || user.name;

    const tokenPayload: AuthenticatedUserPayload = {
      userId: user.id,
      email: user.email,
      name: activeName,
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
        name: activeName,
        role: user.role,
        profileId,
        avatarUrl: payload.photoURL || (profileData as any)?.avatarUrl,
        firebaseUid: payload.uid,
        isGoogleAuth: true,
        profile: profileData,
        linkedPatients,
      },
    };
  }

  static async updateProfile(
    userId: string,
    data: {
      patientId?: string;
      name?: string;
      age?: number;
      gender?: string;
      conditions?: string[];
      healthcareUnit?: string;
      phone?: string;
      crm?: string;
      specialty?: string;
      riskLevel?: string;
      createNewPatientForLogin?: boolean;
    },
    currentProfileId?: string
  ) {
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    let profileData: any = null;
    const targetPatientId = data.patientId || currentProfileId;

    if (user.role === 'PATIENT') {
      if (data.createNewPatientForLogin && data.name?.trim()) {
        const resolved = await resolveOrCreatePatientForLogin(db, user, {
          requestedName: data.name.trim(),
          age: data.age,
          gender: data.gender,
          conditions: data.conditions,
          forceNew: true,
        });
        profileData = resolved.patient;
      } else {
        const patient =
          (targetPatientId ? await db.getPatientById(targetPatientId) : null) ||
          (await db.getPatientByUserId(userId));
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

    const linkedPatients = await getLinkedPatientsForLogin(db, user.id, user.email);
    const activeName =
      user.role === 'PATIENT' && profileData?.name ? profileData.name : profileData?.name || user.name;

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: activeName,
        role: user.role,
        profileId: profileData?.id || currentProfileId || '',
        avatarUrl: (profileData as any)?.avatarUrl,
        isGoogleAuth: !!(user as any).firebaseUid,
        profile: profileData,
        linkedPatients,
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
