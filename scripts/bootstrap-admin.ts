/**
 * Script local (nunca exposto como rota pública): promove um usuário já
 * cadastrado no Firebase Auth a admin. Rodar uma única vez pra criar o
 * primeiro admin do projeto.
 *
 * Uso: npm run bootstrap-admin -- seu-email@gmail.com
 * (a pessoa precisa ter logado no app pelo menos uma vez antes, pra existir
 * no Firebase Auth)
 */
import { adminAuth, adminDb } from "../api/_lib/firebaseAdmin";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npm run bootstrap-admin -- <email>");
    process.exit(1);
  }

  const user = await adminAuth.getUserByEmail(email).catch(() => null);
  if (!user) {
    console.error(
      `Nenhum usuário encontrado com o e-mail ${email}. Essa pessoa precisa logar no app com o Google pelo menos uma vez antes de rodar este script.`,
    );
    process.exit(1);
  }

  await adminDb.collection("admins").doc(user.uid).set({
    email,
    displayName: user.displayName ?? "",
    createdAt: new Date(),
  });

  const currentClaims = (user.customClaims ?? {}) as Record<string, unknown>;
  await adminAuth.setCustomUserClaims(user.uid, { ...currentClaims, admin: true });

  console.log(
    `✅ ${email} (uid: ${user.uid}) agora é admin. Peça pra essa pessoa recarregar a página (ou sair e entrar de novo) pra aplicar o novo papel.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
