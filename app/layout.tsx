import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Arqitect",
  description:
    "Design production-ready software systems with an AI architect on an editable canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      appearance={{
        theme: dark,
        variables: {
          colorBackground: "var(--bg-base)",
          colorInput: "var(--bg-surface)",
          colorInputForeground: "var(--text-primary)",
          colorForeground: "var(--text-primary)",
          colorMutedForeground: "var(--text-muted)",
          colorPrimary: "var(--accent-primary)",
          colorDanger: "var(--state-error)",
          colorSuccess: "var(--state-success)",
          colorWarning: "var(--state-warning)",
          colorNeutral: "var(--text-muted)",
          colorBorder: "var(--border-default)",
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-inter)",
        },
      }}
    >
      <html
        lang="en"
        className={cn(
          "h-full antialiased font-sans",
          inter.variable,
          jetBrainsMono.variable
        )}
      >
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
