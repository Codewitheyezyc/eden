import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import QueryProvider from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Loveworld Arts Academy — Premium Creative Governance Platform",
    template: "%s | Loveworld Arts Academy",
  },
  description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused coordinator administration.",
  metadataBase: new URL("https://eden-academy.org"),
  openGraph: {
    title: "Loveworld Arts Academy — Premium Creative Governance Platform",
    description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused coordinator administration.",
    url: "https://eden-academy.org",
    siteName: "Loveworld Arts Academy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Loveworld Arts Academy Portal Workspace Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loveworld Arts Academy — Premium Creative Governance Platform",
    description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused coordinator administration.",
    images: ["/og-image.png"],
    creator: "@CreedTech",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
