"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { normalizeEmail, readPassword } from "@/lib/auth/input";

export type LoginState = { error?: string } | undefined;

export async function loginWithPassword(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));
  if (!email || !password) return { error: "Enter a valid email address and password." };

  try {
    await signIn("password", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return { error: "The email or password is not correct." };
      console.error("Password sign-in failed", error);
      return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
    }
    throw error;
  }
}
