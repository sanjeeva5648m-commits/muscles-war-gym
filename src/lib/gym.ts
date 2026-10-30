import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Settings = Tables<"business_settings">;
export type Service = Tables<"services">;
export type Machine = Tables<"machines">;
export type Product = Tables<"products">;
export type GalleryItem = Tables<"gallery">;
export type Enquiry = Tables<"enquiries">;
export type HoursRow = { day: string; time: string };

export const VERIFIED = {
  name: "Muscle’s War Gym",
  address: "Opposite Ghumarwin Bridge, Ghumarwin, Himachal Pradesh 174021, India",
  phone: "+91 82192 95600",
  whatsapp: "918219295600",
};

export const mapsDirections = (address = VERIFIED.address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
export const mapsEmbed = (address = VERIFIED.address) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
export const telHref = (phone = VERIFIED.phone) => `tel:${phone.replace(/[^+\d]/g, "")}`;
export const waHref = (msg: string, number = VERIFIED.whatsapp) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

export const ENQUIRY_CATEGORIES = ["Membership", "Personal training", "Supplements", "General"] as const;

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid phone number (10+ digits)"),
  category: z.enum(ENQUIRY_CATEGORIES),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true, { message: "Please accept the privacy notice" }),
});

/** Batch-sign private storage paths so public pages can display them. */
export async function signPaths(paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter(Boolean) as string[])];
  if (!list.length) return {} as Record<string, string>;
  const { data } = await supabase.storage.from("media").createSignedUrls(list, 60 * 60 * 24);
  const map: Record<string, string> = {};
  data?.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
  return map;
}

export async function fetchPublicData() {
  const [s, sv, m, p, g] = await Promise.all([
    supabase.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("services").select("*").eq("published", true).order("sort_order"),
    supabase.from("machines").select("*").eq("published", true).order("sort_order"),
    supabase.from("products").select("*").eq("published", true).order("created_at", { ascending: false }),
    supabase.from("gallery").select("*").eq("published", true).order("sort_order"),
  ]);
  const machines = m.data ?? [];
  const products = p.data ?? [];
  const gallery = g.data ?? [];
  const urls = await signPaths([
    ...machines.map((x) => x.image_path),
    ...products.map((x) => x.image_path),
    ...gallery.map((x) => x.image_path),
  ]);
  return { settings: s.data, services: sv.data ?? [], machines, products, gallery, urls };
}

export async function uploadImage(file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}