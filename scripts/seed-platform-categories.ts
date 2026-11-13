/**
 * Script local: popula a coleção `platformCategories` com a lista base da
 * plataforma. Idempotente — rodar de novo só atualiza os mesmos docs.
 *
 * Uso: npm run seed-categories
 */
import { adminDb } from "../api/_lib/firebaseAdmin";

const BASE_CATEGORIES = [
  { id: "livre", label: "Livre", order: 0 },
  { id: "acessorios", label: "Acessórios", order: 1 },
  { id: "vestimentas", label: "Vestimentas", order: 2 },
  { id: "objetos", label: "Objetos", order: 3 },
  { id: "decoracoes", label: "Decorações", order: 4 },
];

async function main() {
  const batch = adminDb.batch();
  for (const category of BASE_CATEGORIES) {
    batch.set(adminDb.collection("platformCategories").doc(category.id), {
      label: category.label,
      order: category.order,
      active: true,
    });
  }
  await batch.commit();
  console.log(`✅ ${BASE_CATEGORIES.length} categorias base criadas/atualizadas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
