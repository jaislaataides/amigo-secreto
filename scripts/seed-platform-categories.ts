/**
 * Script local: popula a coleção `platformCategories` com a lista base da
 * plataforma, e remove as antigas categorias genéricas que foram
 * substituídas. Idempotente — rodar de novo só atualiza os mesmos docs.
 *
 * Uso: npm run seed-categories
 */
import { adminDb } from "../api/_lib/firebaseAdmin";

const BASE_CATEGORIES = [
  { id: "livre", label: "Livre (qualquer coisa)", order: 0 },
  { id: "doces", label: "Doces & Guloseimas", order: 1 },
  { id: "livros-hqs", label: "Livros & HQs", order: 2 },
  { id: "jogos", label: "Jogos & Diversão", order: 3 },
  { id: "beleza", label: "Beleza & Autocuidado", order: 4 },
  { id: "casa-cozinha", label: "Casa & Cozinha", order: 5 },
  { id: "moda-acessorios", label: "Moda & Acessórios", order: 6 },
  { id: "tech-gadgets", label: "Tecnologia & Gadgets", order: 7 },
  { id: "plantas", label: "Plantas", order: 8 },
  { id: "bebidas", label: "Bebidas (vinho, cerveja, drinks)", order: 9 },
  { id: "pet-lover", label: "Pet Lover", order: 10 },
];

// Substituídas pelas de cima — sem graça e meio redundantes entre si.
const RETIRED_IDS = ["acessorios", "vestimentas", "objetos", "decoracoes"];

async function main() {
  const batch = adminDb.batch();
  for (const category of BASE_CATEGORIES) {
    batch.set(adminDb.collection("platformCategories").doc(category.id), {
      label: category.label,
      order: category.order,
      active: true,
    });
  }
  for (const id of RETIRED_IDS) {
    batch.delete(adminDb.collection("platformCategories").doc(id));
  }
  await batch.commit();
  console.log(
    `✅ ${BASE_CATEGORIES.length} categorias base criadas/atualizadas, ${RETIRED_IDS.length} antigas removidas.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
