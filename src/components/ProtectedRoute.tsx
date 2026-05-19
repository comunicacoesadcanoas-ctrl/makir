// Auth removed — app is publicly accessible. This component is now a passthrough
// kept for backward compatibility with App.tsx route definitions.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
