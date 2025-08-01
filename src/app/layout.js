import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LogoutButton from "../components/LogoutButton";
import { authService } from "../api/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Service Pro - Partner Dashboard",
  description: "Dashboard for Service Pro partners to manage their services and clients.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-end">
            <LogoutButton />
          </div>
        </div>
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
