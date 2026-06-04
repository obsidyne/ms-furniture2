import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider }  from "@/context/cartContext";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata = {
  title: {
    default: "MS Furniture & Interiors | Handcrafted Furniture in Kerala",
    template: "%s | MS Furniture & Interiors",
  },
  description: "Experience the finest handcrafted furniture in Kerala. MS Furniture & Interiors offers premium, sustainable, and custom-designed wood furniture for your home and office.",
  keywords: ["furniture", "handcrafted", "Kerala", "interiors", "custom furniture", "MS Furniture", "solid wood"],
  authors: [{ name: "MS Furniture & Interiors" }],
  creator: "Obsidyne",
  publisher: "MS Furniture & Interiors",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"),
  openGraph: {
    title: "MS Furniture & Interiors | Handcrafted Furniture in Kerala",
    description: "Premium handcrafted furniture that tells a story. Sustainable designs from the heart of Kerala.",
    url: "/",
    siteName: "MS Furniture & Interiors",
    images: [
      {
        url: "/LOGO.jpeg",
        width: 800,
        height: 600,
        alt: "MS Furniture & Interiors Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MS Furniture & Interiors | Handcrafted Furniture in Kerala",
    description: "Premium handcrafted furniture that tells a story. Sustainable designs from the heart of Kerala.",
    images: ["/LOGO.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-warm-white text-ink font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
            <Footer />
          </CartProvider>
        </AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}