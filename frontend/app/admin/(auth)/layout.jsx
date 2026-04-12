// Standalone layout for /admin/login
// Intentionally does NOT include AdminProtectedRoute
// so unauthenticated users can actually reach this page
export default function AdminLoginLayout({ children }) {
  return <>{children}</>;
}