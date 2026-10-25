import { useState, useContext, useEffect, useRef } from 'react';
import Logo from './Logo';
import { getCurrentUser, clearSession } from '../utils/userStore';
import { NavigationContext } from '../App';
import { useReminders } from '../context/useReminders';

function Navbar() {
  const { currentView, setCurrentView, currentUser: contextUser, setCurrentUser } = useContext(NavigationContext);
  const { pendingCount, activeAlarm, stopAlarm, snoozeAlarm } = useReminders();
  const user = contextUser || getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  // Close the mobile menu on Escape or when clicking outside the navbar
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    const onClick = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    stopAlarm();
    clearSession();
    if (setCurrentUser) setCurrentUser(null);
    setMenuOpen(false);
    setCurrentView('login');
  };

  const handleNav = (id) => {
    setCurrentView(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const navItems = [
    { id: 'dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
    { id: 'goals',     icon: 'bi-bullseye',        label: 'Goals' },
    { id: 'plan',      icon: 'bi-clipboard2-pulse', label: 'Plan' },
    { id: 'progress',  icon: 'bi-graph-up-arrow',   label: 'Progress' },
    { id: 'reminders', icon: 'bi-bell-fill',         label: 'Reminders', badge: pendingCount },
  ];

  const badge = (item) =>
    item.badge > 0 ? (
      <span className="nav-badge" aria-label={`${item.badge} pending reminders`}>{item.badge}</span>
    ) : null;

  return (
    <header className="app-nav-bar" aria-label="Main navigation header" ref={headerRef}>
      <div className="nav-inner">
        <button className="nav-logo-btn" onClick={() => handleNav('dashboard')} aria-label="Go to Dashboard">
          <Logo size={28} />
        </button>

        {/* Desktop links (>= 992px) */}
        <nav className="nav-links d-none d-lg-flex" role="menubar" aria-label="Desktop menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => handleNav(item.id)}
              className={`nav-link-item ${currentView === item.id ? 'active' : ''}`}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true"></i>
              <span>{item.label}</span>
              {badge(item)}
            </button>
          ))}
        </nav>

        <div className="nav-right">
          {user?.name && (
            <span className="nav-username d-none d-sm-inline" title={user.name}>
              <i className="bi bi-person-circle me-1 text-accent"></i>
              {user.name}
            </span>
          )}

          <button
            className="btn btn-sm btn-outline-warm d-none d-lg-inline-flex align-items-center gap-1"
            onClick={handleLogout}
            aria-label="Logout"
            title="Log out"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>Logout</span>
          </button>

          <span className="nav-hamburger-wrap d-lg-none">
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true"></i>
            </button>
            {pendingCount > 0 && !menuOpen && <span className="nav-dot" aria-hidden="true"></span>}
          </span>
        </div>
      </div>

      {/* Global ringing alarm — shows on every page */}
      {activeAlarm && (
        <div className="alarm-strip" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-bell-fill text-accent fs-5" aria-hidden="true"></i>
            <div>
              <div className="fw-bold text-white">{activeAlarm.text}</div>
              <div className="small text-muted">Reminder · {activeAlarm.time}</div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-warm" onClick={() => snoozeAlarm(5)}>
              <i className="bi bi-moon-stars me-1" aria-hidden="true"></i>Snooze 5m
            </button>
            <button className="btn btn-sm btn-warm" onClick={stopAlarm}>
              <i className="bi bi-stop-circle-fill me-1" aria-hidden="true"></i>Stop
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <nav className="nav-mobile-menu d-lg-none" role="menu" aria-label="Mobile menu">
          {user?.name && (
            <div className="nav-mobile-user d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle fs-5" style={{ color: 'var(--accent)' }}></i>
                <div>
                  <div className="fw-semibold small text-white">{user.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                </div>
              </div>
              <span className="tag" style={{ fontSize: '0.65rem' }}>Active</span>
            </div>
          )}

          <div className="d-flex flex-column gap-1 my-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                role="menuitem"
                onClick={() => handleNav(item.id)}
                className={`nav-mobile-item ${currentView === item.id ? 'active' : ''}`}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <i className={`bi ${item.icon} fs-5`} aria-hidden="true"></i>
                <span>{item.label}</span>
                {badge(item)}
              </button>
            ))}
          </div>

          <button className="nav-mobile-item nav-mobile-logout w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right fs-5" aria-hidden="true"></i>
            <span>Log Out</span>
          </button>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
