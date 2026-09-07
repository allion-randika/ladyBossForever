import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { ConfirmProvider } from "@/components/confirm-dialog";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lady Boss Forever — Admin",
  description: "Store management console",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${workSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-paper text-ink" suppressHydrationWarning>
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
