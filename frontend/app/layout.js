import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider }  from "@/context/cartContext";

export const metadata = {
  title: "MS Furniture",
  description: "Furniture crafted for the way you live.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-warm-white text-ink font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}