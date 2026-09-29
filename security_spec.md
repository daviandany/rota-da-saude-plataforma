# Especificação de Segurança Firestore - Rota da Saúde

## 1. Invariantes de Dados (Data Invariants)
1. **Identidade do Usuário**: Nenhum usuário pode forjar `userId` ou `uid` de outro usuário em `/users/{userId}`.
2. **Pacientes**: Documentos de pacientes em `/patients/{patientId}` devem possuir identificadores válidos (`isValidId`), nome, e classificação de risco obrigatória (`BAIXO`, `MODERADO`, `ALTO`).
3. **Aferição de Pressão Arterial**: Registros em `/blood_pressure_records/{recordId}` devem ter valores numéricos de pressão válidos (`systolic > 0 && systolic < 350`, `diastolic > 0 && diastolic < 250`), `patientId` associado e data válida.
4. **Aferição de Glicemia**: Registros em `/glucose_records/{recordId}` devem ter valor de glicose positivo (`glucoseValue > 0 && glucoseValue < 1200`), momento válido na lista de enums, e `patientId`.
5. **Medicamentos**: Registros em `/medications/{medicationId}` devem conter nome de medicamento, dosagem e status permitido (`ATIVO`, `SUSPENSO`, `CONCLUIDO`).
6. **Consultas**: Documentos em `/appointments/{appointmentId}` devem conter `patientId`, data de agendamento e status (`AGENDADA`, `REALIZADA`, `CANCELADA`).
7. **Alertas Clínicos**: Alertas em `/clinical_alerts/{alertId}` só aceitam gravidades `CRITICO`, `ATENCAO` ou `INFORMATIVO`. Modificações de status são restritas para resolver alerta.
8. **Imutabilidade de Criador**: Usuários não podem sobrescrever campos imutáveis como `createdAt` com valores futuros arbitrários.

## 2. "Dirty Dozen" Malicious Payloads
1. **Ghost Admin Escalation**: Tentativa de injetar `isAdmin: true` ou `role: "ADMIN"` em `/users/{userId}` por usuário não-autorizado.
2. **ID Injection Poisoning**: Tentativa de criar paciente com ID de 2MB de caracteres inválidos.
3. **Orphaned Blood Pressure**: Tentativa de registrar pressão arterial com `patientId: ""` vazio.
4. **Impossible Blood Pressure Reading**: Pressão arterial com `systolic: 99999` ou negativo.
5. **Glucose Value Poisoning**: Glicemia com string `"cem"` em vez de número.
6. **Invalid Glucose Moment**: Momento de glicemia definido com valor arbitrário `"DEPOIS_DA_FESTA"`.
7. **Unverified Status Hijack**: Atualização de medicamento mudando campos não autorizados como `name` e `dosage` em vez de apenas `status`.
8. **Clinical Alert Erasure**: Tentativa de deletar alerta clínico crítico para ocultar histórico médico.
9. **Cross-Tenant User Profile Read**: Tentativa de listagem em massa de dados PII sem autenticação.
10. **Device Token Flooding**: Injeção de token FCM de 10.000 caracteres.
11. **Appointment Backdating Hijack**: Alteração de agendamento para documento inexistente.
12. **Notification Tampering**: Alteração arbitrária de destinatário em notificações já disparadas.
