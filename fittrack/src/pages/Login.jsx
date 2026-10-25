import { useState, useContext } from 'react';
import { findUser, setSession, createUser } from '../utils/userStore';
import { NavigationContext } from '../App';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentView, setCurrentUser } = useContext(NavigationContext);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    const user = findUser(email.trim());
    if (!user) {
      setError('No account found for this email. Click "New? Sign Up" below to create one!');
      return;
    }
    if (user.password !== password) {
      setError('Incorrect password. Please try again.');
      return;
    }

    // Set active session and update React user state
    setSession(email.trim());
    const fullUser = { email: email.trim(), ...user };
    setCurrentUser(fullUser);
    setCurrentView(user.goalData ? 'dashboard' : 'goals');
  };

  // Quick Demo Login for testing
  const handleQuickDemo = (demoName, demoEmail) => {
    let existing = findUser(demoEmail);
    if (!existing) {
      createUser(demoEmail, demoName, '123456');
    }
    setSession(demoEmail);
    const fullUser = { email: demoEmail, name: demoName, password: '123456' };
    setCurrentUser(fullUser);
    setCurrentView('dashboard');
  };

  return (
    <main
      className="w-100 d-flex flex-column justify-content-between"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(13,13,18,0.96) 0%, rgba(13,13,18,0.85) 50%, rgba(13,13,18,0.7) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80') center/cover no-repeat`,
      }}
    >
      {/* Top Header */}
      <header className="d-flex justify-content-between align-items-center px-4 px-lg-5 py-3 w-100">
        <span className="logo-text">FitTrack<span style={{ color: 'var(--accent)' }}>.</span></span>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small d-none d-sm-inline">New to FitTrack?</span>
          <button
            type="button"
            className="btn btn-outline-warm btn-sm px-3"
            onClick={() => setCurrentView('signup')}
          >
            New? Sign Up
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="container-fluid px-4 px-lg-5 py-4 flex-grow-1 d-flex align-items-center">
        <div className="row w-100 mx-0 align-items-center gy-4">

          {/* Left Hero — Fills the laptop screen nicely */}
          <article className="col-12 col-lg-7 pe-lg-5">
            <span className="tag mb-3 d-inline-block">
              <i className="bi bi-fire me-1"></i> Smart Fitness Planner
            </span>
            <h1 className="editorial-headline text-white mb-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
              TRACK YOUR GOALS
            </h1>
            <h2 className="editorial-headline mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', color: 'var(--accent)' }}>
              // LIVE HEALTHIER
            </h2>
            <p className="text-muted mb-4" style={{ maxWidth: '520px', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Personalized workout routines, professional macronutrient-matched diets, and custom audio reminders tailored specifically to your daily schedule.
            </p>

            {/* Feature Pills */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}>
                <i className="bi bi-check-circle-fill text-success me-1"></i> Personalized Routines
              </span>
              <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}>
                <i className="bi bi-check-circle-fill text-success me-1"></i> Macro-Balanced Diets
              </span>
              <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}>
                <i className="bi bi-check-circle-fill text-success me-1"></i> Smart Reminders & Audio
              </span>
            </div>
          </article>

          {/* Right — Login Card */}
          <aside className="col-12 col-lg-5 col-xl-4 ms-auto">
            <div className="app-card p-4 p-sm-5 w-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Log In</h3>
                <span className="tag">Welcome</span>
              </div>
              
              {/* Option: New? Sign In / Sign Up */}
              <div className="p-2 mb-3 rounded" style={{ background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-white">New user?</span>
                  <button
                    type="button"
                    onClick={() => setCurrentView('signup')}
                    className="btn btn-sm btn-warm py-1 px-2"
                    style={{ fontSize: '0.8rem' }}
                  >
                    New? Sign Up Here →
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-3 p-3 rounded" style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.4)', color: '#ff6b6b', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} aria-label="Login form">
                <div className="mb-3">
                  <label htmlFor="login-email" className="form-label">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="input-group-text border-0"
                      style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--ink)', cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-warm w-100 py-2 mb-3">
                  Log In <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </form>

              {/* Quick Demo Test Buttons */}
              <div className="pt-3 mt-2 border-top border-secondary border-opacity-25 text-center">
                <span className="text-muted small d-block mb-2">Or test instantly:</span>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-outline-warm btn-sm py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleQuickDemo('Srishti', 'srishti@fittrack.com')}
                  >
                    Demo: Srishti
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-warm btn-sm py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleQuickDemo('Bhakti', 'bhakti@fittrack.com')}
                  >
                    Demo: Bhakti
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="px-4 px-lg-5 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center text-center text-sm-start w-100 small text-muted border-top border-dark gap-2">
        <span>© {new Date().getFullYear()} FitTrack. All rights reserved.</span>
        <div className="d-flex gap-3 justify-content-center">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </main>
  );
}

export default Login;