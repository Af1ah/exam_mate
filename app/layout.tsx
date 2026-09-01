import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const examFont = Nunito_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-exam",
});

export const metadata: Metadata = {
  title: "Exam Mate",
  description: "A secure WhatsApp-first competitive exam quiz app.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={examFont.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
