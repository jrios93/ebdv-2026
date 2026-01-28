import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EBDV - Sistema de Evaluación",
  description: "Sistema de evaluación para Escuela Bíblica de Vacaciones",
  other: {
    'timezone': 'America/Lima',
    'locale': 'es-PE'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE">
      <head>
        <meta name="timezone" content="America/Lima" />
      </head>
      <body
        className={`${fredoka.variable} font-sans antialiased`}
        data-timezone="America/Lima"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
