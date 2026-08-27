// lib/posts.js
// Un "post" es un texto editorial que aparece en Inicio o en Reporte Semanal.
// page: "home" | "weekly-report"
// week: número de semana (solo aplica a "weekly-report"; null en "home")

import { getSupabase } from "./supabase";

export async function getPublishedPost(page, week = null) {
  const supabase = getSupabase();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("page", page)
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (week !== null) query = query.eq("week", week);
  else query = query.is("week", null);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Error leyendo post:", error.message);
    return null;
  }
  return data;
}

export async function getDraft(page, week = null) {
  const supabase = getSupabase();
  let query = supabase.from("posts").select("*").eq("page", page);
  if (week !== null) query = query.eq("week", week);
  else query = query.is("week", null);

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error("Error leyendo borrador:", error.message);
    return null;
  }
  return data;
}

export async function savePost({ page, week = null, content, published }) {
  const supabase = getSupabase();
  const existing = await getDraft(page, week);

  const payload = {
    page,
    week,
    content,
    published,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from("posts").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("posts").insert(payload);
    if (error) throw new Error(error.message);
  }
}
