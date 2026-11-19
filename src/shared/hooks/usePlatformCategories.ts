import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/shared/firebase/client";

export interface PlatformCategory {
  id: string;
  label: string;
  order: number;
}

export function usePlatformCategories() {
  return useQuery({
    queryKey: ["platformCategories"],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, "platformCategories"), orderBy("order")));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlatformCategory, "id">) }));
    },
    staleTime: Infinity,
  });
}
