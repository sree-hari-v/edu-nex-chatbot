import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduNex",
  description: "College AI Assistant for Nilgiri College"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // IMPORTANT: no "dark" class here
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}