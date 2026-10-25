import { useState, useContext } from 'react';
import { findUser, createUser, setSession } from '../utils/userStore';
import { NavigationContext } from '../App';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentView, setCurrentUser } = useContext(NavigationContext);

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    const existingUser = findUser(trimmedEmail);
    if (existingUser) {
      setError('An account with this email already exists. Please log in.');
      return;
    }

    // Create the brand new user in store
    const newUser = createUser(trimmedEmail, trimmedName, password);
    setSession(trimmedEmail);
    
    // Update global React context so all views immediately know the new name!
    const fullUser = { email: trimmedEmail, ...newUser };
    setCurrentUser(fullUser);

    // Navigate to goal setup so their custom plan is generated
    setCurrentView('goals');
  };

  return (
    <main
      className="w-100 d-flex flex-column justify-content-between"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(13,13,18,0.96) 0%, rgba(13,13,18,0.85) 50%, rgba(13,13,18,0.7) 100%), url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80') center/cover no-repeat`,
      }}
    >
      {/* Top Header */}
      <header className="d-flex justify-content-between align-items-center px-4 px-lg-5 py-3 w-100">
        <span className="logo-text">FitTrack<span style={{ color: 'var(--accent)' }}>.</span></span>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small d-none d-sm-inline">Have an account?</span>
          <button
            type="button"
            className="btn btn-outline-warm btn-sm px-3"
            onClick={() => setCurrentView('login')}
          >
            Log In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="container-fluid px-4 px-lg-5 py-4 flex-grow-1 d-flex align-items-center">
        <div className="row w-100 mx-0 align-items-center gy-4">

          {/* Left Hero */}
          <article className="col-12 col-lg-7 pe-lg-5">
            <span className="tag mb-3 d-inline-block">
              <i className="bi bi-stars me-1"></i> Start Your Transformation
            </span>
            <h1 className="editorial-headline text-white mb-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
              CREATE ACCOUNT
            </h1>
            <h2 className="editorial-headline mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', color: 'var(--accent)' }}>
              // GET YOUR PLAN
            </h2>
            <p className="text-muted mb-4" style={{ maxWidth: '520px', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Join thousands who reached their goal weight and fitness targets with our structured daily schedules and nutrition planning.
            </p>

            <div className="d-flex flex-column gap-3 mb-4" style={{ maxWidth: '460px' }}>
              <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <div className="tile-icon" style={{ width: 40, height: 40, minWidth: 40 }}>
                  <i className="bi bi-lightning-charge-fill"></i>
                </div>
                <div>
                  <div className="fw-semibold small text-white">Daily Personalized Workout Plan</div>
                  <div className="text-muted small">Cardio, HIIT, Strength & Yoga tailored to your daily time</div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <div className="tile-icon" style={{ width: 40, height: 40, minWidth: 40 }}>
                  <i className="bi bi-egg-fried"></i>
                </div>
                <div>
                  <div className="fw-semibold small text-white">Professional Diet with Macros</div>
                  <div className="text-muted small">Target calories and macronutrients for weight loss or muscle gain</div>
                </div>
              </div>
            </div>
          </article>

          {/* Right — Signup Card */}
          <aside className="col-12 col-lg-5 col-xl-4 ms-auto">
            <div className="app-card p-4 p-sm-5 w-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Sign Up</h3>
                <span className="tag">Free Access</span>
              </div>
              <p className="text-muted small mb-4">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="border-0 bg-transparent p-0 fw-semibold"
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                >
                  Log In here →
                </button>
              </p>

              {error && (
                <div className="mb-3 p-3 rounded" style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.4)', color: '#ff6b6b', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} aria-label="Signup form">
                <div className="mb-3">
                  <label htmlFor="signup-name" className="form-label">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Alex, Rahul)"
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="signup-email" className="form-label">Email Address</label>
                  <input
                    id="signup-email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="signup-password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      autoComplete="new-password"
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

                <div className="mb-4">
                  <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="btn btn-warm w-100 py-2">
                  Create Account & Start Planner <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </form>
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

export default Signup;
