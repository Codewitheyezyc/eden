import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import QueryProvider from "@/providers/query-provider";
import { SupportProvider } from "@/providers/support-provider";
import { FloatingSupport, SupportModal } from "@/components/shared";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Loveworld Arts Academy — Premium Creative Governance Platform",
    template: "%s | Loveworld Arts Academy",
  },
  description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused zonal leader administration.",
  metadataBase: new URL("https://eden-academy.org"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Loveworld Arts Academy — Premium Creative Governance Platform",
    description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused zonal leader administration.",
    url: "https://eden-academy.org",
    siteName: "Loveworld Arts Academy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loveworld Arts Academy — Premium Creative Governance Platform",
    description: "Discover Loveworld Arts Academy, the ultra-premium multi-tenant digital workspace for student learning and focused zonal leader administration.",
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
          <SupportProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <FloatingSupport />
              <SupportModal />
              <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                  className: "bg-white/95 dark:bg-[#07130d]/95 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-emerald-500/10 shadow-2xl rounded-2xl text-sm font-medium backdrop-blur-md",
                  duration: 4000,
                  style: {
                    padding: "12px 18px",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#ffffff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#f43f5e",
                      secondary: "#ffffff",
                    },
                  },
                }}
              />
            </ThemeProvider>
          </SupportProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

