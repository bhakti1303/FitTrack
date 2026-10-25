import { useState, useEffect, useContext } from 'react';
import { NavigationContext } from '../App';
import { useReminders } from '../context/useReminders';
import FormInput from './FormInput';
import { validateEmail } from '../utils/validators';

const NEWSLETTER_KEY = 'ft_newsletter';

// Simulated async API call (stores in localStorage after a short delay)
function subscribeToNewsletter(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const list = JSON.parse(localStorage.getItem(NEWSLETTER_KEY)) || [];
        const clean = email.trim().toLowerCase();
        if (list.includes(clean)) return reject(new Error('This email is already subscribed.'));
        localStorage.setItem(NEWSLETTER_KEY, JSON.stringify([...list, clean]));
        resolve();
      } catch {
        reject(new Error('Something went wrong. Please try again.'));
      }
    }, 900);
  });
}

function Footer() {
  const { setCurrentView } = useContext(NavigationContext);
  const { nextReminder } = useReminders();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [showTop, setShowTop] = useState(false);

  const error = validateEmail(email);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  // DOM: show "back to top" button after scrolling down
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    setStatus('loading');
    try {
      await subscribeToNewsletter(email);
      setStatus('success');
      setMessage('You are subscribed. Welcome aboard!');
      setEmail('');
      setTouched(false);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <>
      <footer className="mt-5 py-5 text-center text-md-start" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <div className="container">
          <div className="row g-4 justify-content-center justify-content-md-start">
            <div className="col-12 col-md-3">
              <span className="logo-text d-block mb-3" style={{ fontSize: '1.2rem' }}>FitTrack</span>
              <p className="text-muted small mb-3 mx-auto mx-md-0" style={{ maxWidth: '320px' }}>
                Your smart fitness goal planner. Track your workouts, manage your diet, and hit your milestones with precision.
              </p>
              <p className="small mb-1 text-muted">
                <i className="bi bi-calendar3 me-1 text-accent" aria-hidden="true"></i>{todayLabel}
              </p>
              <p className="small mb-0 text-muted">
                <i className="bi bi-alarm me-1 text-accent" aria-hidden="true"></i>
                {nextReminder ? `Next: ${nextReminder.text} at ${nextReminder.time}` : 'No pending reminders'}
              </p>
            </div>

            <div className="col-6 col-md-2">
              <h6 className="text-white mb-3">Explore</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0 align-items-center align-items-md-start">
                <li><button className="footer-link" onClick={() => goTo('dashboard')}>Dashboard</button></li>
                <li><button className="footer-link" onClick={() => goTo('goals')}>Goals</button></li>
                <li><button className="footer-link" onClick={() => goTo('progress')}>Progress</button></li>
                <li><button className="footer-link" onClick={() => goTo('reminders')}>Reminders</button></li>
              </ul>
            </div>

            <div className="col-6 col-md-2">
              <h6 className="text-white mb-3">Support</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><a href="mailto:support@fittrack.app" className="footer-link">Contact Us</a></li>
                <li><a href="mailto:support@fittrack.app?subject=FitTrack%20bug%20report" className="footer-link">Report an Issue</a></li>
              </ul>
              <div className="d-flex gap-3 fs-5 mt-3 justify-content-center justify-content-md-start">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="X (Twitter)"><i className="bi bi-twitter-x"></i></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <h6 className="text-white mb-3">Fitness tips in your inbox</h6>
              <form onSubmit={handleSubmit} noValidate className="text-start">
                <FormInput
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') setStatus('idle');
                  }}
                  onBlur={() => setTouched(true)}
                  error={error}
                  touched={touched}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <button type="submit" className="btn btn-warm btn-sm mt-1" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Subscribing…</>
                  ) : (
                    <><i className="bi bi-envelope-plus me-1" aria-hidden="true"></i>Subscribe</>
                  )}
                </button>
                {status === 'success' && (
                  <p className="small text-success mt-2 mb-0" role="status"><i className="bi bi-check-circle-fill me-1"></i>{message}</p>
                )}
                {status === 'error' && (
                  <p className="small field-error mt-2 mb-0" role="alert"><i className="bi bi-x-circle-fill me-1"></i>{message}</p>
                )}
              </form>
            </div>
          </div>

          <p className="text-muted small mt-4 mb-0">&copy; {new Date().getFullYear()} FitTrack Inc. All rights reserved.</p>
        </div>
      </footer>

      {showTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          title="Back to top"
        >
          <i className="bi bi-arrow-up" aria-hidden="true"></i>
        </button>
      )}
    </>
  );
}

export default Footer;
