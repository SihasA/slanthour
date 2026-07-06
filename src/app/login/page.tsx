import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in — Slanthour" };

export default function LoginPage() {
  return <AuthForm mode="signin" />;
}
