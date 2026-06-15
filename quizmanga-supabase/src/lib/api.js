import { supabase } from "./supabase";

// ═══════════════ AUTH ═══════════════
export const auth = {
  // Ro'yxatdan o'tish — Supabase email tasdiqlash xatini yuboradi
  async signUp({ email, password, name, role, avatar }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, avatar }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  // Parol tiklash — email orqali havola yuboradi
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  },
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => data.subscription.unsubscribe();
  },
};

// ═══════════════ PROFILES ═══════════════
export const profiles = {
  async me(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  },
  async update(userId, patch) {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async listAll() {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async setBlocked(id, blocked) {
    const { error } = await supabase.from("profiles").update({ blocked }).eq("id", id);
    if (error) throw error;
  },
  async setRole(id, role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) throw error;
  },
  async setPlan(id, plan, proUntil) {
    const { error } = await supabase.from("profiles").update({ plan, pro_until: proUntil }).eq("id", id);
    if (error) throw error;
  },
};

// ═══════════════ QUESTIONS ═══════════════
export const questions = {
  async list() {
    const { data, error } = await supabase.from("questions").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
  async add(q) {
    const { data, error } = await supabase.from("questions").insert(q).select().single();
    if (error) throw error;
    return data;
  },
  async bulkAdd(rows) {
    const { data, error } = await supabase.from("questions").insert(rows).select();
    if (error) throw error;
    return data;
  },
  async update(id, patch) {
    const { data, error } = await supabase.from("questions").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw error;
  },
};

// ═══════════════ CUSTOM TESTS ═══════════════
export const tests = {
  async list() {
    const { data, error } = await supabase.from("custom_tests").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
  async add(t) {
    const { data, error } = await supabase.from("custom_tests").insert(t).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, patch) {
    const { data, error } = await supabase.from("custom_tests").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    const { error } = await supabase.from("custom_tests").delete().eq("id", id);
    if (error) throw error;
  },
};

// ═══════════════ RESULTS ═══════════════
export const results = {
  async add(r) {
    const { data, error } = await supabase.from("test_results").insert(r).select().single();
    if (error) throw error;
    return data;
  },
  async listMine() {
    const { data, error } = await supabase.from("test_results").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data;
  },
  async listAll() {
    const { data, error } = await supabase.from("test_results").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};

// ═══════════════ BOOKMARKS ═══════════════
export const bookmarks = {
  async list() {
    const { data, error } = await supabase.from("bookmarks").select("question_id, questions(*)");
    if (error) throw error;
    return data;
  },
  async add(question_id) {
    const { error } = await supabase.from("bookmarks").insert({ question_id });
    if (error) throw error;
  },
  async remove(question_id) {
    const { error } = await supabase.from("bookmarks").delete().eq("question_id", question_id);
    if (error) throw error;
  },
};

// ═══════════════ PROMOKODLAR ═══════════════
export const promoApi = {
  async redeem(code) { const { data, error } = await supabase.rpc("redeem_promo", { p_code: code }); if (error) throw error; return data; },
  async list() { const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; },
  async create(c) { const { error } = await supabase.from("promo_codes").insert(c); if (error) throw error; },
  async remove(code) { const { error } = await supabase.from("promo_codes").delete().eq("code", code); if (error) throw error; },
};

// ═══════════════ GURUHLAR ═══════════════
export const groupApi = {
  async myTeaching() { const { data, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; },
  async create(name, code) { const { data: u } = await supabase.auth.getUser(); const { error } = await supabase.from("groups").insert({ name, code, teacher_id: u?.user?.id }); if (error) throw error; },
  async remove(id) { const { error } = await supabase.from("groups").delete().eq("id", id); if (error) throw error; },
  async join(code) { const { data, error } = await supabase.rpc("join_group", { p_code: code }); if (error) throw error; return data; },
  async myGroups() { const { data, error } = await supabase.from("group_members").select("group_id, groups(name, code)"); if (error) throw error; return data || []; },
  async members(gid) {
    const { data: mem, error } = await supabase.from("group_members").select("user_id, joined_at").eq("group_id", gid);
    if (error) throw error;
    const ids = (mem || []).map(m => m.user_id); if (!ids.length) return [];
    const { data: profs } = await supabase.from("profiles").select("id, name, avatar").in("id", ids);
    const { data: res } = await supabase.from("test_results").select("user_id, pct").in("user_id", ids);
    return (profs || []).map(p => { const rs = (res || []).filter(r => r.user_id === p.id); const avg = rs.length ? Math.round(rs.reduce((a, c) => a + c.pct, 0) / rs.length) : 0; return { id: p.id, name: p.name, avatar: p.avatar, tests: rs.length, avg }; });
  },
};

// ═══════════════ E'LONLAR ═══════════════
export const annApi = {
  async list() { const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20); if (error) throw error; return data || []; },
  async create(title, body) { const { data: u } = await supabase.auth.getUser(); const { error } = await supabase.from("announcements").insert({ title, body, created_by: u?.user?.id }); if (error) throw error; },
  async remove(id) { const { error } = await supabase.from("announcements").delete().eq("id", id); if (error) throw error; },
};
