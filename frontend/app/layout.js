import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider }  from "@/context/cartContext";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata = {
  title: "MS Furniture & Interiors",
  description: "Furniture crafted for the way you live.",
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