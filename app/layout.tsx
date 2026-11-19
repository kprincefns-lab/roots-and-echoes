import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roots & Echoes — Living 3D Family Tree & Generational Archive",
  description:
    "Explore four generations of family history in an interactive 3D Tree of Life. Preserve life stories, philosophies, hereditary insights, and conversational digital echoes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable} dark h-full antialiased`}
    >
      <body className="h-full w-full overflow-hidden bg-[#090D0B] text-[#F5F2EB] font-sans selection:bg-[#D4A359]/30 selection:text-[#F5F2EB]">
        {children}
      </body>
    </html>
  );
}
