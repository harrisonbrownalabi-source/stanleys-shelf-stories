import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PurchaseLink = { label: string; url: string };
export type Book = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  purchase_links: PurchaseLink[];
  sort_order: number;
  created_at: string;
};

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => ({
        ...b,
        purchase_links: (b.purchase_links as unknown as PurchaseLink[]) ?? [],
      })) as Book[];
    },
  });
}

export function useInvalidateBooks() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["books"] });
}

export async function getCoverSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("book-covers").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
