export default function AuthCard({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-floating-shape shape-1" />
      <div className="auth-floating-shape shape-2" />
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}
