import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle, Phone, MapPin, Navigation, Dumbbell, Sparkles, Star, ShieldCheck, Clock, Instagram, Facebook, Youtube, Menu, X, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  ENQUIRY_CATEGORIES, VERIFIED, enquirySchema, fetchPublicData, mapsDirections, mapsEmbed, telHref, waHref, type HoursRow,
} from "@/lib/gym";
import hero from "@/assets/hero.jpg";
import stock1 from "@/assets/stock-1.jpg";
import stock2 from "@/assets/stock-2.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muscle’s War Gym — Ghumarwin, Himachal Pradesh" },
      { name: "description", content: "Gym opposite Ghumarwin Bridge, Ghumarwin, HP 174021. Call or WhatsApp +91 82192 95600 to enquire about membership and training." },
      { property: "og:title", content: "Muscle’s War Gym — Ghumarwin" },
      { property: "og:description", content: "Train opposite Ghumarwin Bridge. WhatsApp +91 82192 95600 to enquire." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Muscle’s War Gym" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Muscle’s War Gym — Ghumarwin" },
    ],
  }),
  component: Home,
});

const NAV = [
  ["about", "About"], ["services", "Services"], ["equipment", "Equipment"], ["supplements", "Supplements"],
  ["gallery", "Gallery"], ["reviews", "Reviews"], ["location", "Location"], ["enquire", "Enquire"], ["faq", "FAQ"],
] as const;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-visible)");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-visible"), io.unobserve(e.target))),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

function Home() {
  const { data } = useQuery({ queryKey: ["public"], queryFn: fetchPublicData });
  const s = data?.settings;
  const phone = s?.phone || VERIFIED.phone;
  const wa = s?.whatsapp || VERIFIED.whatsapp;
  const address = s?.address || VERIFIED.address;
  const hours = (s?.hours as HoursRow[] | undefined) ?? [];
  const [menu, setMenu] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const heroImg = useRef<HTMLImageElement>(null);
  useReveal();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (heroImg.current) heroImg.current.style.transform = `translateY(${window.scrollY * 0.15}px) scale(1.05)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waGeneral = waHref("Hi Muscle’s War Gym, I'd like to know about membership and timings.", wa);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full glass px-4 py-2 shadow-soft">
          <a href="#top" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-primary-foreground"><Dumbbell className="h-5 w-5" /></span>
            <span className="hidden sm:inline">Muscle’s War Gym</span>
          </a>
          <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
            {NAV.map(([id, l]) => <a key={id} href={`#${id}`} className="text-muted-foreground transition-colors hover:text-primary">{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="whatsapp" size="sm" className="px-4"><a href={waGeneral} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a></Button>
            <button className="rounded-full p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          </div>
        </div>
        {menu && (
          <nav className="mx-3 mt-2 grid grid-cols-2 gap-1 rounded-3xl glass p-3 shadow-soft lg:hidden">
            {NAV.map(([id, l]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary">{l}</a>)}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative bg-hero pt-28 pb-20 sm:pt-36">
        <div className="pointer-events-none absolute -left-10 top-40 h-24 w-24 rounded-3xl bg-accent/60 blur-sm float-slow" />
        <div className="pointer-events-none absolute right-10 top-24 h-16 w-16 rounded-full bg-warm/70 float-slow [animation-delay:2s]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-semibold text-primary"><MapPin className="h-3.5 w-3.5" />Opposite Ghumarwin Bridge, HP</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Muscle’s <span className="text-gradient">War Gym</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">{s?.tagline || "Train with purpose. Build your strength."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="whatsapp" size="xl"><a href={waGeneral} target="_blank" rel="noopener noreferrer"><MessageCircle />Enquire on WhatsApp</a></Button>
              <Button asChild variant="glass" size="xl"><a href={telHref(phone)}><Phone />Call {phone}</a></Button>
            </div>
            <a href={mapsDirections(address)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Navigation className="h-4 w-4" />Get directions</a>
          </div>
          <div className="reveal relative [perspective:1200px]">
            <div className="tilt-card overflow-hidden rounded-[2rem] shadow-depth">
              <img ref={heroImg} src={hero} alt="Illustrative stock image of strength training" width={1600} height={1008} className="h-[340px] w-full object-cover sm:h-[460px]" fetchPriority="high" />
            </div>
            <span className="absolute bottom-3 left-3 rounded-full glass px-3 py-1 text-[11px] text-muted-foreground">Illustrative image — not the actual gym</span>
          </div>
        </div>
      </section>

      {/* About */}
      <Section id="about" eyebrow="About" title="Your neighbourhood strength hub in Ghumarwin">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="reveal md:col-span-2 rounded-3xl bg-card p-7 shadow-soft">
            <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
              {s?.description || "Muscle’s War Gym is located opposite Ghumarwin Bridge in Ghumarwin, Himachal Pradesh. Message us on WhatsApp or call to learn about memberships, timings and training options."}
            </p>
          </div>
          <div className="reveal rounded-3xl bg-navy p-7 text-navy-foreground shadow-depth">
            <Clock className="h-6 w-6 text-accent" />
            <h3 className="mt-3 text-lg font-bold">Opening hours</h3>
            {hours.length ? (
              <ul className="mt-3 space-y-1 text-sm">{hours.map((h, i) => <li key={i} className="flex justify-between gap-3"><span>{h.day}</span><span className="opacity-80">{h.time}</span></li>)}</ul>
            ) : <p className="mt-3 text-sm opacity-80">Timings to be confirmed — please call or WhatsApp us.</p>}
          </div>
        </div>
      </Section>

      {/* Services */}
      <Section id="services" eyebrow="Services" title="What we offer" tint>
        {data?.services.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((sv) => (
              <div key={sv.id} className="reveal tilt-card rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground"><Sparkles className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-bold">{sv.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{sv.description}</p>
                <a href={waHref(`Hi, I'd like to know more about "${sv.title}".`, wa)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Ask on WhatsApp →</a>
              </div>
            ))}
          </div>
        ) : <Empty text="Services will be listed here once confirmed by the gym. Ask us on WhatsApp for current offerings." />}
      </Section>

      {/* Equipment */}
      <Section id="equipment" eyebrow="Equipment" title="Machines & training zones">
        {data?.machines.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.machines.map((m) => (
              <div key={m.id} className="reveal tilt-card overflow-hidden rounded-3xl bg-card shadow-soft">
                {m.image_path && data.urls[m.image_path] ? <img src={data.urls[m.image_path]} alt={m.name} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-secondary"><Dumbbell className="h-10 w-10 text-primary/40" /></div>}
                <div className="p-5">
                  {m.category && <span className="text-xs font-semibold uppercase tracking-wide text-primary">{m.category}</span>}
                  <h3 className="mt-1 text-lg font-bold">{m.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="Equipment photos and details will appear here once the owner adds them." />}
      </Section>

      {/* Supplements */}
      <Section id="supplements" eyebrow="Supplements" title="Supplement showcase" tint>
        {data?.products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((p) => (
              <div key={p.id} className="reveal tilt-card flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft">
                {p.image_path && data.urls[p.image_path] ? <img src={data.urls[p.image_path]} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-secondary"><Package className="h-10 w-10 text-primary/40" /></div>}
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold text-muted-foreground">{[p.brand, p.category].filter(Boolean).join(" · ")}</span>
                  <h3 className="mt-1 font-bold">{p.name}</h3>
                  {p.package_size && <span className="text-xs text-muted-foreground">{p.package_size}</span>}
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display font-bold">{p.price != null ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Ask price"}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.available ? "bg-accent text-accent-foreground" : "bg-warm text-warm-foreground"}`}>{p.available ? "In stock" : "Out of stock"}</span>
                  </div>
                  <Button asChild variant="whatsapp" size="sm" className="mt-3 rounded-full"><a href={waHref(`Hi, is "${p.name}"${p.package_size ? ` (${p.package_size})` : ""} available?`, wa)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Enquire</a></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="Supplements available at the gym will be shown here once the owner adds them." />}
      </Section>

      {/* Gallery */}
      <Section id="gallery" eyebrow="Gallery" title="Inside the gym">
        {data?.gallery.length ? (
          <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {data.gallery.map((g) => data.urls[g.image_path] && (
              <button key={g.id} onClick={() => setLightbox({ src: data.urls[g.image_path] ?? "", caption: g.caption })} className="reveal group relative block w-full overflow-hidden rounded-3xl shadow-soft">
                <img src={data.urls[g.image_path]} alt={g.caption || "Gym photo"} loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-105" />
                {(g.caption || !g.is_actual_gym) && <span className="absolute inset-x-2 bottom-2 rounded-full glass px-3 py-1 text-left text-xs">{g.caption}{!g.is_actual_gym && " (illustrative)"}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {[stock1, stock2].map((src, i) => (
              <button key={i} onClick={() => setLightbox({ src, caption: "Illustrative stock image — not the actual gym" })} className="reveal group relative overflow-hidden rounded-3xl shadow-soft">
                <img src={src} alt="Illustrative stock fitness image" width={1024} height={768} loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 rounded-full glass px-3 py-1 text-xs">Illustrative stock image — real gym photos coming soon</span>
              </button>
            ))}
          </div>
        )}
      </Section>
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{lightbox?.caption || "Photo"}</DialogTitle>
          {lightbox && <figure><img src={lightbox.src} alt={lightbox.caption} className="max-h-[80vh] w-full rounded-3xl object-contain" /><figcaption className="mt-2 text-center text-sm text-navy-foreground">{lightbox.caption}</figcaption></figure>}
        </DialogContent>
      </Dialog>

      {/* Reviews */}
      <Section id="reviews" eyebrow="Reviews" title="What members say" tint>
        <div className="reveal mx-auto max-w-2xl rounded-3xl bg-card p-8 text-center shadow-soft">
          <div className="flex justify-center gap-1 text-warm">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5 fill-current" />)}</div>
          <p className="mt-4 text-muted-foreground">We only show genuine reviews from their original source. Read what people say on Google.</p>
          <Button asChild variant="hero" size="xl" className="mt-6">
            <a href={s?.reviews_url || `https://www.google.com/maps/search/${encodeURIComponent("Muscle’s War Gym Ghumarwin")}`} target="_blank" rel="noopener noreferrer">Read reviews on Google</a>
          </Button>
        </div>
      </Section>

      {/* Location */}
      <Section id="location" eyebrow="Location" title="Find us">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="reveal overflow-hidden rounded-3xl shadow-depth lg:col-span-3">
            <iframe title="Map to Muscle’s War Gym" src={mapsEmbed(address)} loading="lazy" className="h-80 w-full border-0 lg:h-full" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="reveal space-y-4 rounded-3xl bg-card p-7 shadow-soft lg:col-span-2">
            <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" />{address}</p>
            <p className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary" /><a href={telHref(phone)} className="font-semibold hover:underline">{phone}</a></p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="hero" size="lg"><a href={mapsDirections(address)} target="_blank" rel="noopener noreferrer"><Navigation />Directions</a></Button>
              <Button asChild variant="whatsapp" size="lg"><a href={waHref("Hi, can you share directions to the gym?", wa)} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp</a></Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Enquiry */}
      <Section id="enquire" eyebrow="Enquire" title="Send an enquiry" tint>
        <EnquiryForm wa={wa} />
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Questions">
        <Accordion type="single" collapsible className="reveal mx-auto max-w-2xl rounded-3xl bg-card px-6 shadow-soft">
          <AccordionItem value="1"><AccordionTrigger>Where is the gym?</AccordionTrigger><AccordionContent>{address}. Tap "Directions" above to open Google Maps.</AccordionContent></AccordionItem>
          <AccordionItem value="2"><AccordionTrigger>How do I ask about membership fees?</AccordionTrigger><AccordionContent>Fees are shared directly by the gym. Message us on WhatsApp or call {phone}.</AccordionContent></AccordionItem>
          <AccordionItem value="3"><AccordionTrigger>What are the timings?</AccordionTrigger><AccordionContent>{hours.length ? "See the opening hours in the About section." : "Timings will be published soon — please call or WhatsApp to confirm."}</AccordionContent></AccordionItem>
          <AccordionItem value="4"><AccordionTrigger>What happens after I send the enquiry form?</AccordionTrigger><AccordionContent>Your details are saved securely and only the gym owner can see them. The owner will contact you on the phone number you give. For a faster reply, use WhatsApp.</AccordionContent></AccordionItem>
        </Accordion>
      </Section>

      {/* Footer */}
      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-bold">Muscle’s War Gym</h3>
            <p className="mt-2 text-sm opacity-80">{address}</p>
          </div>
          <div className="space-y-2 text-sm">
            <a href={telHref(phone)} className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4" />{phone}</a>
            <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><MessageCircle className="h-4 w-4" />WhatsApp us</a>
            <a href={mapsDirections(address)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Navigation className="h-4 w-4" />Directions</a>
          </div>
          <div className="flex items-start gap-3">
            {s?.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full bg-navy-foreground/10 p-2.5 hover:bg-navy-foreground/20"><Instagram className="h-5 w-5" /></a>}
            {s?.facebook_url && <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-navy-foreground/10 p-2.5 hover:bg-navy-foreground/20"><Facebook className="h-5 w-5" /></a>}
            {s?.youtube_url && <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-full bg-navy-foreground/10 p-2.5 hover:bg-navy-foreground/20"><Youtube className="h-5 w-5" /></a>}
          </div>
        </div>
        <div className="border-t border-navy-foreground/10 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} Muscle’s War Gym · <Link to="/owner/login" className="hover:underline">Owner login</Link></div>
      </footer>

      <a href={waGeneral} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-depth cta-pulse"><MessageCircle className="h-6 w-6" /></a>
    </div>
  );
}

function Section({ id, eyebrow, title, tint, children }: { id: string; eyebrow: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 ${tint ? "bg-secondary/60" : ""}`}>
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="reveal rounded-3xl border-2 border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground">{text}</div>;
}

function EnquiryForm({ wa }: { wa: string }) {
  const [f, setF] = useState({ name: "", phone: "", category: "", message: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = enquirySchema.safeParse({ ...f, message: f.message || undefined });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("enquiries").insert({ ...parsed.data, message: parsed.data.message ?? null });
    setBusy(false);
    if (error) return void toast.error("Could not send. Please try WhatsApp instead.");
    setDone(true);
  }

  if (done)
    return (
      <div className="reveal is-visible mx-auto max-w-xl rounded-3xl bg-card p-8 text-center shadow-soft">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 text-xl font-bold">Enquiry saved</h3>
        <p className="mt-2 text-muted-foreground">The owner can now see your enquiry and will contact you. No automatic email or SMS is sent. For a faster reply:</p>
        <Button asChild variant="whatsapp" size="lg" className="mt-5"><a href={waHref(`Hi, I'm ${f.name}. I just sent an enquiry about ${f.category}.`, wa)} target="_blank" rel="noopener noreferrer"><MessageCircle />Message on WhatsApp</a></Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="reveal mx-auto grid max-w-xl gap-4 rounded-3xl bg-card p-7 shadow-soft">
      <div><Label htmlFor="name">Name</Label><Input id="name" maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{errors["name"] && <p className="mt-1 text-xs text-destructive">{errors["name"]}</p>}</div>
      <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" inputMode="tel" maxLength={16} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />{errors["phone"] && <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p>}</div>
      <div>
        <Label>Category</Label>
        <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
          <SelectTrigger aria-label="Category"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
          <SelectContent>{ENQUIRY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        {errors["category"] && <p className="mt-1 text-xs text-destructive">Please choose a category</p>}
      </div>
      <div><Label htmlFor="msg">Message (optional)</Label><Textarea id="msg" maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={f.consent} onCheckedChange={(v) => setF({ ...f, consent: v === true })} aria-label="Privacy consent" className="mt-0.5" />
        <span>I agree that my name, phone and message are stored securely and used only by the gym owner to reply to this enquiry.</span>
      </label>
      {errors["consent"] && <p className="-mt-2 text-xs text-destructive">{errors["consent"]}</p>}
      <Button type="submit" variant="hero" size="xl" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</Button>
    </form>
  );
}