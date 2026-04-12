// (auth) route group layout
// Auth pages (login/register) get a clean, navbar-free shell.
// The root layout's AuthProvider + CartProvider still wrap this.

export const metadata = {
  title: "Sign In — MS",
};

export default function AuthLayout({ children }) {
  return <>{children}</>;
}