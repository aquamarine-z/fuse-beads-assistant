import type {Metadata, Viewport} from "next";
import {PwaRegister} from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuse Beads Assistant",
  description: "Fuse bead pattern generator",
  applicationName: "Fuse Beads Assistant",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {url: "/icon.svg", type: "image/svg+xml"},
    ],
    shortcut: "/icon.svg",
    apple: [
      {url: "/apple-icon", sizes: "180x180", type: "image/png"},
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fuse Beads Assistant",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#fff8f3",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f3",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-accent="blush"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const root = document.documentElement;
              const savedMode = localStorage.getItem("fuse-theme-mode");
              const savedAccent = localStorage.getItem("fuse-theme-accent");
              const media = window.matchMedia("(prefers-color-scheme: dark)");
              const getThemeMode = () => {
                if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
                  return savedMode;
                }
                return "system";
              };
              const applyTheme = () => {
                const mode = getThemeMode();
                const isDark = mode === "dark" || (mode === "system" && media.matches);
                root.classList.toggle("dark", isDark);
              };
              if (savedAccent) root.dataset.accent = savedAccent;
              applyTheme();
              if (typeof media.addEventListener === "function") {
                media.addEventListener("change", applyTheme);
              } else {
                media.addListener(applyTheme);
              }
            })();`,
          }}
        />
        <PwaRegister />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
