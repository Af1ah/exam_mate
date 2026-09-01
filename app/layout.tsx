import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Exam Mate", description: "A secure WhatsApp-first competitive exam quiz app." };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="en"><body>{children}</body></html>; }
