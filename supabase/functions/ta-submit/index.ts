// Past TA spotlight form (tigermotorslean.com/ta-submit): saves the answers and photos, then emails them to Tom and Diego.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ORIGINS = ["https://tigermotorslean.com", "https://www.tigermotorslean.com", "https://diegocaputo9.github.io", "http://127.0.0.1:8767", "http://localhost:8767"];
const MAX_PHOTOS = 9, MAX_FILE = 15 * 1024 * 1024, MAX_TOTAL = 28 * 1024 * 1024;
const EMAIL_RE = /^[^@\s<>,;]+@[^@\s<>,;]+\.[a-z]{2,}$/i;

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Vary": "Origin",
  };
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const b64 = (buf: Uint8Array) => { let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };

Deno.serve(async (req) => {
  const h = { ...cors(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: h });
  const fail = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), { status, headers: h });

  let fd: FormData;
  try { fd = await req.formData(); } catch { return fail("We could not read the form. Please try again."); }
  const g = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  // honeypot: bots fill the hidden field; pretend success
  if (g("website", 200)) return new Response(JSON.stringify({ ok: true }), { headers: h });

  const v = {
    first_name: g("first", 80), last_name: g("last", 80), email: g("email", 200).toLowerCase(),
    years: g("years", 120), linkedin: g("linkedin", 300), now_role: g("now_role", 200),
    projects: g("projects", 3000), testimony: g("testimony", 4000), bio: g("bio", 3000),
    links: g("links", 1000), photo_notes: g("photo_notes", 1500), lang: g("lang", 5),
  };
  if (!v.first_name || !v.last_name) return fail("Please enter your first and last name.");
  if (!EMAIL_RE.test(v.email)) return fail("Please enter a valid email address.");
  if (!v.years) return fail("Please tell us when you were a TA.");
  if (!/^(https?:\/\/)?([a-z0-9-]+\.)*linkedin\.com\/\S+$/i.test(v.linkedin)) return fail("Please paste the link to your LinkedIn profile.");
  if (!v.linkedin.startsWith("http")) v.linkedin = "https://" + v.linkedin;
  if (fd.get("consent") !== "yes") return fail("Please confirm that we may feature your information on the website.");

  const files: { file: File; kind: string }[] = [];
  for (const [k, val] of fd.entries()) if ((k === "headshot" || k === "photos") && val instanceof File && val.size > 0) files.push({ file: val, kind: k });
  if (files.length > MAX_PHOTOS) return fail("Please send at most " + MAX_PHOTOS + " photos.");
  let total = 0;
  for (const f of files) {
    if (!/^image\//.test(f.file.type) && !/\.(heic|heif)$/i.test(f.file.name)) return fail("Only photos can be attached.");
    if (f.file.size > MAX_FILE) return fail("Each photo must be under 15 MB.");
    total += f.file.size;
  }
  if (total > MAX_TOTAL) return fail("Your photos are too large together. Please send fewer or smaller photos.");

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const hourAgo = new Date(Date.now() - 3600e3).toISOString(), dayAgo = new Date(Date.now() - 86400e3).toISOString();
  const [{ count: perHour }, { count: perMail }] = await Promise.all([
    sb.from("ta_submissions").select("id", { count: "exact", head: true }).gt("created_at", hourAgo),
    sb.from("ta_submissions").select("id", { count: "exact", head: true }).eq("email", v.email).gt("created_at", dayAgo),
  ]);
  if ((perMail ?? 0) >= 3) return fail("Thank you! We already received your information today.", 429);
  if ((perHour ?? 0) >= 20) return fail("We are receiving a lot of submissions right now. Please try again later.", 429);

  const id = crypto.randomUUID();
  const attachments: { filename: string; content: string }[] = [], paths: string[] = [];
  let n = 0;
  for (const f of files) {
    const buf = new Uint8Array(await f.file.arrayBuffer());
    const ext = (f.file.name.match(/\.([a-z0-9]{2,5})$/i)?.[1] || f.file.type.split("/")[1] || "jpg").toLowerCase();
    const base = (v.first_name + "-" + v.last_name).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const name = base + "-" + (f.kind === "headshot" ? "headshot" : "photo-" + (++n)) + "." + ext;
    const path = id + "/" + name;
    const up = await sb.storage.from("ta-submissions").upload(path, buf, { contentType: f.file.type || "image/" + ext, upsert: false });
    if (!up.error) paths.push(path);
    attachments.push({ filename: name, content: b64(buf) });
  }

  const ins = await sb.from("ta_submissions").insert({ id, ...v, photos: paths }).select("id").single();
  if (ins.error) return fail("We could not save your information. Please try again.", 500);

  const full = v.first_name + " " + v.last_name;
  const rows: [string, string][] = [
    ["Name", full], ["Email", v.email], ["Years as a TA", v.years], ["LinkedIn", v.linkedin],
    ["Where they are now", v.now_role], ["Projects in the lab", v.projects], ["How the lab changed them", v.testimony],
    ["Bio", v.bio], ["Other links", v.links], ["About the photos", v.photo_notes],
  ];
  const filled = rows.filter(([, x]) => x);
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#0C1B2E;max-width:640px">' +
    '<p style="margin:0 0 16px"><b>' + esc(full) + '</b> sent their information for the past TA spotlight on tigermotorslean.com.</p>' +
    filled.map(([k, x]) => '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5A6676">' + esc(k) + '</p>' +
      '<p style="margin:0 0 16px;white-space:pre-wrap">' + (/^https?:\/\//.test(x) && !/\s/.test(x) ? '<a href="' + esc(x) + '">' + esc(x) + "</a>" : esc(x)) + "</p>").join("") +
    '<p style="margin:20px 0 0;color:#5A6676;font-size:13px">' + (attachments.length ? attachments.length + " photo" + (attachments.length > 1 ? "s are" : " is") + " attached. " : "No photos were attached. ") +
    "They gave permission to feature this on the website. Reply to this email to answer " + esc(v.first_name) + " directly.</p></div>";
  const text = full + " sent their information for the past TA spotlight on tigermotorslean.com.\n\n" +
    filled.map(([k, x]) => k + ":\n" + x).join("\n\n") + "\n\n--\n" + (attachments.length ? attachments.length + " photo(s) attached. " : "No photos attached. ") +
    "They gave permission to feature this on the website. Reply to this email to answer " + v.first_name + " directly.";

  const [{ data: key }, { data: st }] = await Promise.all([sb.rpc("ta_resend_key"), sb.from("ta_settings").select("recipients").single()]);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Tiger Motors Lean Education Center <no-reply@tigermotorslean.com>",
      to: st?.recipients ?? ["devall@auburn.edu", "drc0040@auburn.edu"], reply_to: v.email,
      subject: "Past TA spotlight: " + full + " (" + v.years + ")", html, text, attachments,
    }),
  });
  const rj = await r.json().catch(() => ({}));
  await sb.from("ta_submissions").update(r.ok ? { email_id: rj.id ?? null } : { email_error: JSON.stringify(rj).slice(0, 500) }).eq("id", id);
  // the answers and photos are saved either way, so the person does not need to send them again
  return new Response(JSON.stringify({ ok: true }), { headers: h });
});
