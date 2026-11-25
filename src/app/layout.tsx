import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Free Steam Game — игровой профиль и коллекции",
  description: "Открывай бесплатные игры, находи друзей и собирай игровые карточки в Free Steam Game.",
  applicationName: "Free Steam Game",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Free Steam Game" },
  icons: { icon: [{ url: `${basePath}/icons/icon.svg`, type: "image/svg+xml" }] }
};

export const viewport: Viewport = { themeColor: "#090b12", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
