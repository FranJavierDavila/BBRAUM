import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/**
 * Tipografía corporativa — despliegue interno B. Braun:
 * - La pila global intenta primero "BBraun Type Digital" (@font-face en globals.css,
 *   con local() + /fonts/BBraunTypeDigital-*.woff2).
 * - Si la fuente propietaria no está disponible (vista previa o equipos sin ella),
 *   se usa Inter autoalojada por Next en el build (sin peticiones externas en runtime)
 *   como aproximación corporativa consistente en todos los clientes.
 */
const bbSans = Inter({
  variable: "--font-bb-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Evaluación de Inspección Visual · Botellas de Suero",
  description:
    "Sistema de evaluación digital de identificación de defectos en botellas de suero con modelos 3D interactivos, tests configurables y panel de administración.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${bbSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
