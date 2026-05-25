import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "UniShare - University Resource Hub",
  description: "An open-access platform for students to share course materials and lecture videos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${ebGaramond.variable} min-h-screen flex flex-col bg-background text-foreground`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
