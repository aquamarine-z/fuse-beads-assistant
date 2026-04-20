import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuse Beads Assistant",
  description: "Fuse bead pattern generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-accent="peach"
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
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
