"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
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

export async function redeemMagicLink(token: string): Promise<{ error?: string }> {
  if ((await auth())?.user?.id) redirect("/quiz");
  if (!token || token.length > 256) return { error: "This link is not valid. Request a new link to continue." };
  try {
    await signIn("magic-link", { token, redirectTo: "/quiz" });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== "CredentialsSignin") console.error("Magic-link sign-in failed", error);
      return { error: "This link has expired or has already been used. Request a new link to continue." };
    }
    throw error;
  }
  return {};
}
