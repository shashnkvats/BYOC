"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type AuthFormState = {
  error?: string;
  confirmationEmail?: string;
} | undefined;

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next || "/dashboard");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("Signup succeeded without a session; email confirmation is required.");
  }

  return { confirmationEmail: email };
}

export async function resendSignupEmail(email: string): Promise<{ error?: string }> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { error: "We need an email address to resend the confirmation." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: trimmed });
  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
