import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, LogOut, Trash2, Pencil, Plus, Eye, EyeOff, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signPaths, uploadImage, telHref, waHref, type HoursRow, type Settings } from "@/lib/gym";

export const Route = createFileRoute("/owner/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner dashboard — Muscle’s War Gym" },
      { name: "description", content: "Manage gym content and enquiries." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Owner dashboard — Muscle’s War Gym" },
      { property: "og:description", content: "Manage gym content and enquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<"loading" | "owner" | "denied">("loading");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return nav({ to: "/owner/login", replace: true });
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setState(ok ? "owner" : "denied");
    })();
  }, [nav]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/owner/login", replace: true });
  }

  if (state === "loading") return <div className="grid min-h-screen place-items-center text-muted-foreground">Checking access…</div>;
  if (state === "denied")
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div><h1 className="text-2xl font-bold">Not authorised</h1><p className="mt-2 text-muted-foreground">This account is not the gym owner.</p><Button className="mt-4" onClick={signOut}>Sign out</Button></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg font-bold">Owner dashboard</h1>
          <div className="flex gap-2"><Button asChild variant="outline" size="sm"><a href="/" target="_blank">View site</a></Button><Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</Button></div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="enquiries">
          <TabsList className="flex h-auto flex-wrap justify-start">
            {["enquiries", "business", "services", "machines", "products", "gallery"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "products" ? "Supplements" : t}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="enquiries"><Enquiries /></TabsContent>
          <TabsContent value="business"><Business /></TabsContent>
          <TabsContent value="services"><Services /></TabsContent>
          <TabsContent value="machines"><Machines /></TabsContent>
          <TabsContent value="products"><Products /></TabsContent>
          <TabsContent value="gallery"><Gallery /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const card = "rounded-2xl bg-card p-5 shadow-soft";
const invalidatePublic = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ["public"] });

function ImagePicker({ preview, onFile }: { preview?: string | undefined; onFile: (f: File) => void }) {
  return (
    <div className="space-y-2">
      {preview && <img src={preview} alt="Preview" className="h-40 w-full rounded-xl object-cover" />}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary">
          <Camera className="h-4 w-4" />Take photo
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary">
          <ImagePlus className="h-4 w-4" />Choose from gallery
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}

/* ---------------- Enquiries ---------------- */
function Enquiries() {
  const { data, refetch } = useQuery({
    queryKey: ["owner", "enquiries"],
    queryFn: async () => (await supabase.from("enquiries").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function setStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    refetch();
  }
  async function remove(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("enquiries").delete().eq("id", id);
    refetch();
  }
  if (!data?.length) return <p className={`${card} text-muted-foreground`}>No enquiries yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((e) => (
        <div key={e.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-bold">{e.name} <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">{e.category}</span></p><p className="text-sm text-muted-foreground">{e.phone} · {new Date(e.created_at).toLocaleString("en-IN")}</p></div>
            <select value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)} className="rounded-md border bg-background px-2 py-1 text-sm" aria-label="Status">
              <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
            </select>
          </div>
          {e.message && <p className="mt-2 whitespace-pre-line text-sm">{e.message}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><a href={telHref(e.phone)}><Phone className="h-4 w-4" />Call</a></Button>
            <Button asChild size="sm" variant="outline"><a href={waHref(`Hi ${e.name}, thanks for your enquiry at Muscle’s War Gym.`, e.phone.replace(/\D/g, "").length === 10 ? `91${e.phone.replace(/\D/g, "")}` : e.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a></Button>
            <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Business ---------------- */
function Business() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["owner", "settings"], queryFn: async () => (await supabase.from("business_settings").select("*").eq("id", 1).single()).data });
  const [f, setF] = useState<Settings | null>(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return null;
  const hours = (f.hours as HoursRow[]) ?? [];
  const set = (k: keyof Settings, v: unknown) => setF({ ...f, [k]: v } as Settings);
  const url = (v: string | null) => !v || /^https:\/\/[^\s]+$/.test(v);

  async function save(): Promise<void> {
    if (!f) return;
    if (f.name.trim().length < 2 || !/^\+?[0-9 ]{10,16}$/.test(f.phone) || !/^\d{10,15}$/.test(f.whatsapp)) return void toast.error("Check name, phone and WhatsApp number (digits only, with country code)");
    if (![f.instagram_url, f.facebook_url, f.youtube_url, f.reviews_url].every(url)) return void toast.error("Links must start with https://");
    const { id: _id, updated_at: _u, ...rest } = f;
    const { error } = await supabase.from("business_settings").update({ ...rest, hours: hours.filter((h) => h.day.trim()) }).eq("id", 1);
    if (error) return void toast.error(error.message);
    toast.success("Saved — the website is updated");
    invalidatePublic(qc);
  }
  const field = (k: keyof Settings, label: string, ph = "") => (
    <div><Label>{label}</Label><Input value={(f[k] as string) ?? ""} placeholder={ph} onChange={(e) => set(k, e.target.value || (k.endsWith("_url") || k === "email" ? null : ""))} /></div>
  );
  return (
    <div className={`${card} grid gap-4 sm:grid-cols-2`}>
      {field("name", "Business name")}{field("tagline", "Tagline")}
      <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={5} maxLength={3000} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
      {field("phone", "Phone")}{field("whatsapp", "WhatsApp number (digits, with 91)", "918219295600")}
      {field("email", "Email (optional)")}{field("address", "Address")}
      {field("instagram_url", "Instagram link", "https://instagram.com/…")}{field("facebook_url", "Facebook link", "https://facebook.com/…")}
      {field("youtube_url", "YouTube link", "https://youtube.com/…")}{field("reviews_url", "Google reviews link", "https://g.page/…")}
      <div className="sm:col-span-2">
        <Label>Opening hours</Label>
        {hours.map((h, i) => (
          <div key={i} className="mt-2 flex gap-2">
            <Input placeholder="Mon–Sat" value={h.day} onChange={(e) => set("hours", hours.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))} />
            <Input placeholder="5:00 AM – 10:00 PM" value={h.time} onChange={(e) => set("hours", hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
            <Button variant="ghost" size="icon" onClick={() => set("hours", hours.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="mt-2" onClick={() => set("hours", [...hours, { day: "", time: "" }])}><Plus className="h-4 w-4" />Add row</Button>
      </div>
      <Button variant="hero" size="lg" className="sm:col-span-2" onClick={save}>Save business details</Button>
    </div>
  );
}

/* ---------------- Generic list helper ---------------- */
type Table = "services" | "machines" | "products" | "gallery";
function useOwnerList<T extends { id: string; image_path?: string | null }>(table: Table) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["owner", table],
    queryFn: async () => {
      const rows = ((await supabase.from(table).select("*").order("created_at", { ascending: false })).data ?? []) as unknown as T[];
      const urls = await signPaths(rows.map((r) => r.image_path));
      return { rows, urls };
    },
  });
  const refresh = () => { q.refetch(); invalidatePublic(qc); };
  async function remove(row: T): Promise<void> {
    if (!confirm("Delete permanently?")) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) return void toast.error(error.message);
    if (row.image_path) await supabase.storage.from("media").remove([row.image_path]);
    toast.success("Deleted");
    refresh();
  }
  async function togglePublish(row: T & { published: boolean }): Promise<void> {
    const { error } = await supabase.from(table).update({ published: !row.published }).eq("id", row.id);
    if (error) return void toast.error(error.message);
    refresh();
  }
  return { ...q, refresh, remove, togglePublish };
}

function RowActions({ published, onEdit, onToggle, onDelete }: { published: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" onClick={onToggle} aria-label={published ? "Unpublish" : "Publish"}>{published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</Button>
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

/* ---------------- Services ---------------- */
type SRow = { id: string; title: string; description: string; published: boolean; sort_order: number };
function Services() {
  const l = useOwnerList<SRow>("services");
  const blank = { id: "", title: "", description: "", published: true, sort_order: 0 };
  const [edit, setEdit] = useState<SRow | null>(null);
  async function save(): Promise<void> {
    if (!edit || !edit.title.trim()) return void toast.error("Title is required");
    const body = { title: edit.title.trim(), description: edit.description.trim(), published: edit.published, sort_order: Number(edit.sort_order) || 0 };
    const { error } = edit.id ? await supabase.from("services").update(body).eq("id", edit.id) : await supabase.from("services").insert(body);
    if (error) return void toast.error(error.message);
    toast.success("Saved"); setEdit(null); l.refresh();
  }
  return (
    <div className="space-y-3">
      {edit ? (
        <div className={`${card} space-y-3`}>
          <div><Label>Title</Label><Input maxLength={120} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea maxLength={2000} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div className="flex items-center gap-4"><div><Label>Order</Label><Input type="number" className="w-24" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} /></div><label className="flex items-center gap-2 text-sm"><Switch checked={edit.published} onCheckedChange={(v) => setEdit({ ...edit, published: v })} />Published</label></div>
          <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        </div>
      ) : <Button onClick={() => setEdit(blank)}><Plus className="h-4 w-4" />Add service</Button>}
      {l.data?.rows.map((r) => (
        <div key={r.id} className={`${card} flex items-start justify-between gap-3`}>
          <div><p className="font-bold">{r.title}</p><p className="text-sm text-muted-foreground">{r.description}</p></div>
          <RowActions published={r.published} onEdit={() => setEdit(r)} onToggle={() => l.togglePublish(r)} onDelete={() => l.remove(r)} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Machines ---------------- */
type MRow = { id: string; name: string; category: string; description: string; image_path: string | null; published: boolean; sort_order: number };
function Machines() {
  const l = useOwnerList<MRow>("machines");
  const [edit, setEdit] = useState<MRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(): Promise<void> {
    if (!edit || !edit.name.trim()) return void toast.error("Name is required");
    setBusy(true);
    try {
      let image_path = edit.image_path;
      if (file) image_path = await uploadImage(file, "machines");
      const body = { name: edit.name.trim(), category: edit.category.trim(), description: edit.description.trim(), image_path, published: edit.published, sort_order: Number(edit.sort_order) || 0 };
      const { error } = edit.id ? await supabase.from("machines").update(body).eq("id", edit.id) : await supabase.from("machines").insert(body);
      if (error) throw error;
      if (file && edit.image_path) await supabase.storage.from("media").remove([edit.image_path]);
      toast.success("Saved"); setEdit(null); setFile(null); l.refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-3">
      {edit ? (
        <div className={`${card} grid gap-3 sm:grid-cols-2`}>
          <div><Label>Name</Label><Input maxLength={120} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
          <div><Label>Category</Label><Input maxLength={80} placeholder="Cardio, Strength…" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Details</Label><Textarea maxLength={2000} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Photo</Label><ImagePicker preview={file ? URL.createObjectURL(file) : edit.image_path ? l.data?.urls[edit.image_path] : undefined} onFile={setFile} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={edit.published} onCheckedChange={(v) => setEdit({ ...edit, published: v })} />Published on website</label>
          <div className="flex gap-2 sm:col-span-2"><Button onClick={save} disabled={busy}>{busy ? "Uploading…" : "Save"}</Button><Button variant="ghost" onClick={() => { setEdit(null); setFile(null); }}>Cancel</Button></div>
        </div>
      ) : <Button onClick={() => setEdit({ id: "", name: "", category: "", description: "", image_path: null, published: true, sort_order: 0 })}><Plus className="h-4 w-4" />Add machine</Button>}
      <div className="grid gap-3 sm:grid-cols-2">
        {l.data?.rows.map((r) => (
          <div key={r.id} className={`${card} flex gap-3`}>
            {r.image_path && l.data?.urls[r.image_path] ? <img src={l.data.urls[r.image_path]} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl bg-secondary" />}
            <div className="flex-1"><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.category}{!r.published && " · Hidden"}</p></div>
            <RowActions published={r.published} onEdit={() => setEdit(r)} onToggle={() => l.togglePublish(r)} onDelete={() => l.remove(r)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */
type PRow = { id: string; name: string; brand: string; category: string; package_size: string; description: string; price: number | null; available: boolean; image_path: string | null; published: boolean };
function Products() {
  const l = useOwnerList<PRow>("products");
  const [edit, setEdit] = useState<PRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(): Promise<void> {
    if (!edit || !edit.name.trim()) return void toast.error("Name is required");
    if (edit.price != null && (isNaN(edit.price) || edit.price < 0)) return void toast.error("Price must be 0 or more");
    setBusy(true);
    try {
      let image_path = edit.image_path;
      if (file) image_path = await uploadImage(file, "products");
      const { id, ...rest } = edit;
      const body = { ...rest, name: rest.name.trim(), image_path };
      const { error } = id ? await supabase.from("products").update(body).eq("id", id) : await supabase.from("products").insert(body);
      if (error) throw error;
      if (file && edit.image_path) await supabase.storage.from("media").remove([edit.image_path]);
      toast.success("Saved"); setEdit(null); setFile(null); l.refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  const t = (k: keyof PRow, label: string, max = 120) => <div><Label>{label}</Label><Input maxLength={max} value={(edit?.[k] as string) ?? ""} onChange={(e) => edit && setEdit({ ...edit, [k]: e.target.value })} /></div>;
  return (
    <div className="space-y-3">
      {edit ? (
        <div className={`${card} grid gap-3 sm:grid-cols-2`}>
          {t("name", "Product name")}{t("brand", "Brand", 80)}{t("category", "Category", 80)}{t("package_size", "Package size", 60)}
          <div><Label>Price (₹, leave empty to hide)</Label><Input type="number" min={0} step="0.01" inputMode="decimal" value={edit.price ?? ""} onChange={(e) => setEdit({ ...edit, price: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          <label className="flex items-center gap-2 self-end text-sm"><Switch checked={edit.available} onCheckedChange={(v) => setEdit({ ...edit, available: v })} />In stock</label>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea maxLength={2000} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Photo</Label><ImagePicker preview={file ? URL.createObjectURL(file) : edit.image_path ? l.data?.urls[edit.image_path] : undefined} onFile={setFile} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={edit.published} onCheckedChange={(v) => setEdit({ ...edit, published: v })} />Published on website</label>
          <div className="flex gap-2 sm:col-span-2"><Button onClick={save} disabled={busy}>{busy ? "Uploading…" : "Save"}</Button><Button variant="ghost" onClick={() => { setEdit(null); setFile(null); }}>Cancel</Button></div>
        </div>
      ) : <Button onClick={() => setEdit({ id: "", name: "", brand: "", category: "", package_size: "", description: "", price: null, available: true, image_path: null, published: true })}><Plus className="h-4 w-4" />Add supplement</Button>}
      <div className="grid gap-3 sm:grid-cols-2">
        {l.data?.rows.map((r) => (
          <div key={r.id} className={`${card} flex gap-3`}>
            {r.image_path && l.data?.urls[r.image_path] ? <img src={l.data.urls[r.image_path]} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl bg-secondary" />}
            <div className="flex-1"><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.brand} · {r.price != null ? `₹${r.price}` : "No price"} · {r.available ? "In stock" : "Out"}{!r.published && " · Hidden"}</p></div>
            <RowActions published={r.published} onEdit={() => setEdit(r)} onToggle={() => l.togglePublish(r)} onDelete={() => l.remove(r)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Gallery ---------------- */
type GRow = { id: string; image_path: string; caption: string; is_actual_gym: boolean; published: boolean; sort_order: number };
function Gallery() {
  const l = useOwnerList<GRow>("gallery");
  const [busy, setBusy] = useState(false);
  async function add(file: File) {
    setBusy(true);
    try {
      const image_path = await uploadImage(file, "gallery");
      const { error } = await supabase.from("gallery").insert({ image_path, caption: "" });
      if (error) throw error;
      toast.success("Photo added"); l.refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function update(id: string, patch: Partial<GRow>): Promise<void> {
    const { error } = await supabase.from("gallery").update(patch).eq("id", id);
    if (error) return void toast.error(error.message);
    l.refresh();
  }
  return (
    <div className="space-y-4">
      <div className={card}><p className="mb-2 text-sm font-semibold">{busy ? "Uploading…" : "Add a photo"}</p><ImagePicker onFile={add} /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {l.data?.rows.map((r) => (
          <div key={r.id} className={`${card} space-y-2 p-3`}>
            {l.data?.urls[r.image_path] && <img src={l.data.urls[r.image_path]} alt={r.caption} className="aspect-[4/3] w-full rounded-xl object-cover" />}
            <Input placeholder="Caption" maxLength={200} defaultValue={r.caption} onBlur={(e) => e.target.value !== r.caption && update(r.id, { caption: e.target.value })} />
            <label className="flex items-center gap-2 text-xs"><Switch checked={r.is_actual_gym} onCheckedChange={(v) => update(r.id, { is_actual_gym: v })} />Real photo of this gym</label>
            <RowActions published={r.published} onEdit={() => {}} onToggle={() => l.togglePublish(r)} onDelete={() => l.remove(r)} />
          </div>
        ))}
      </div>
    </div>
  );
}