import { UserSession } from "./session";
import { supabase } from "./supabase";

export const SupabaseService = {
  async signup(
    email: string,
    password: string,
    helmetCode: string,
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.includes("already registered"))
          return "Email already exists";
        return error.message;
      }
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          helmet_code: helmetCode,
          role: "OWNER",
        });
        return null;
      }
      return "Signup failed";
    } catch (e: any) {
      return e.toString();
    }
  },

  async login(
    email: string,
    password: string,
  ): Promise<Record<string, string> | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select()
        .eq("id", data.user.id)
        .single();
      return {
        email: data.user.email ?? "",
        helmetCode: profile?.helmet_code ?? "",
        role: profile?.role ?? "OWNER",
      };
    } catch {
      return null;
    }
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch {}
    UserSession.clear();
  },
};
