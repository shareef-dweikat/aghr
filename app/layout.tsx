import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteDrawer } from "./components/site-drawer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chrome Built-in AI",
  description: "Try Chrome on-device AI APIs in the browser",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteDrawer />
        {children}
      </body>
    </html>
  );
}
