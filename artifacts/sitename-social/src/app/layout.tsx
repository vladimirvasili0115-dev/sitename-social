import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";
import { SITE_NAME } from "@/config/site";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PwaRegister } from "@/components/layout/PwaRegister";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "swap" });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-georgian", display: "swap" });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "A quieter place to share everyday moments with friends.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#0B1215", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="az" data-scroll-behavior="smooth" className={`${inter.variable} ${georgian.variable}`}>
    <body><PwaRegister /><SplashScreen /><LanguageProvider><AuthProvider><AppShell>{children}</AppShell></AuthProvider></LanguageProvider></body>
  </html>;
}
