import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://spotarmihail-eng.github.io"),
  title: "Free Steam Game — игровой профиль и коллекции",
  description: "Открывай бесплатные игры, находи друзей и собирай игровые карточки в Free Steam Game.",
  openGraph: {
    title: "Free Steam Game",
    description: "Играй. Собирай. Развивайся.",
    images: [{ url: `${basePath}/img/brand/og.jpg`, width: 1200, height: 675 }],
    locale: "ru_RU",
    type: "website"
  },
  twitter: { card: "summary_large_image", images: [`${basePath}/img/brand/og.jpg`] },
  applicationName: "Free Steam Game",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Free Steam Game" },
  icons: { icon: [{ url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }, { url: `${basePath}/icons/icon.svg`, type: "image/svg+xml" }], apple: `${basePath}/icons/icon-192.png` }
};

export const viewport: Viewport = { themeColor: "#090b12", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><PwaRegister />{children}</body></html>;
}
