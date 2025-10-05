import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/providers/RoleProvider";
import { AssistantProvider } from "@/providers/AssistantProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PerformanceHUD } from "@/components/PerformanceHUD";
import RoleStartupDialog from "@/components/RoleStartupDialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhysiVerse",
  description: "Interactive physics labs, quizzes, and visualizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          try {
            var t = localStorage.getItem('physiverse.theme');
            var d = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (d) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          } catch (e) {}
        `}</Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <RoleProvider>
            <AssistantProvider>
              <PerformanceHUD />
              {children}
              <RoleStartupDialog />
            </AssistantProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
