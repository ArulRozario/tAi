// ============================================================
// Login + Forgot Password
// ============================================================

const AuthScreen = ({ onSignIn }) => {
  const [mode, setMode] = React.useState("login");
  const [email, setEmail] = React.useState("ravi@tai.ws");
  const [password, setPassword] = React.useState("••••••••");
  const [sent, setSent] = React.useState(false);

  return (
    <div className="auth-screen">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-brand__mark">
            <span style={{ color: "var(--accent)" }}>t</span>AI
          </div>
          <div className="auth-brand__sub">TRANSLATION INTELLIGENCE</div>
        </div>

        {mode === "login" && (
          <>
            <h2 className="auth-title">Sign in</h2>
            <p className="auth-sub">Welcome back. Pick up where you left off.</p>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@org.com" />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="auth-row">
              <label className="checkbox"><input type="checkbox" defaultChecked /> Remember me</label>
              <button className="auth-link" onClick={() => setMode("forgot")}>Forgot password?</button>
            </div>
            <Btn kind="primary" size="lg" className="btn--block" onClick={onSignIn}>Sign in</Btn>
            <div style={{ textAlign: "center", marginTop: "var(--sp-5)", fontSize: 12, color: "var(--text-3)" }}>
              Tamil • English • <span style={{ color: "var(--accent)" }}>Thiruviviliam</span>
            </div>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h2 className="auth-title">Reset password</h2>
            <p className="auth-sub">Enter your email and we'll send a reset link.</p>
            {sent ? (
              <div className="card" style={{ background: "var(--success-soft)", borderColor: "transparent", color: "var(--success)" }}>
                <div className="row"><Icon name="check" /> Reset link sent to <strong>{email}</strong></div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Btn kind="primary" size="lg" className="btn--block" onClick={() => setSent(true)}>Send reset link</Btn>
              </>
            )}
            <div style={{ textAlign: "center", marginTop: "var(--sp-5)" }}>
              <button className="auth-link" onClick={() => { setMode("login"); setSent(false); }}>← Back to sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

window.AuthScreen = AuthScreen;
