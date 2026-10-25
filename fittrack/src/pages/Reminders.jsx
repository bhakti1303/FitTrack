import { useState, useContext, useMemo } from 'react';
import { NavigationContext } from '../App';
import Navbar from '../components/Navbar';
import FormInput from '../components/FormInput';
import { useReminders } from '../context/useReminders';
import { hasRung } from '../utils/reminderHelpers';
import useQuote from '../hooks/useQuote';
import { playDigitalAlarm } from '../utils/alarmSound';
import {
  validateReminderText,
  validateReminderTime,
  REMINDER_TEXT_MAX,
} from '../utils/validators';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'done', label: 'Done' },
  { id: 'paused', label: 'Paused' },
];

function Reminders() {
  const { setCurrentView } = useContext(NavigationContext);
  const { reminders, today, addReminder, updateReminder, deleteReminder, toggleReminder, testRing } = useReminders();
  const { status: quoteStatus, quote, error: quoteError, retry, next } = useQuote();

  // ── Local UI state (form + view options) ──
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState(true);
  const [touched, setTouched] = useState({ text: false, time: false });
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [notifPerm, setNotifPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));

  // ── Validation ──
  const errors = {
    text: validateReminderText(text),
    time: validateReminderTime(time, text, reminders, editingId),
  };
  const isValid = !errors.text && !errors.time;

  const resetForm = () => {
    setText('');
    setTime('');
    setRepeat(true);
    setTouched({ text: false, time: false });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ text: true, time: true });
    if (!isValid) return;
    if (editingId) updateReminder(editingId, { text, time, repeat });
    else addReminder({ text, time, repeat });
    resetForm();
  };

  const startEdit = (rem) => {
    setEditingId(rem.id);
    setText(rem.text);
    setTime(rem.time);
    setRepeat(rem.repeat);
    setTouched({ text: false, time: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    deleteReminder(id);
    setConfirmId(null);
    if (editingId === id) resetForm();
  };

  const enableNotifications = async () => {
    if ('Notification' in window) setNotifPerm(await Notification.requestPermission());
  };

  // ── Filter + sort ──
  const counts = useMemo(
    () => ({
      all: reminders.length,
      upcoming: reminders.filter((r) => r.enabled && !hasRung(r, today)).length,
      done: reminders.filter((r) => r.enabled && hasRung(r, today)).length,
      paused: reminders.filter((r) => !r.enabled).length,
    }),
    [reminders, today]
  );

  const visible = useMemo(() => {
    let list = reminders.filter((r) => {
      if (filter === 'upcoming') return r.enabled && !hasRung(r, today);
      if (filter === 'done') return r.enabled && hasRung(r, today);
      if (filter === 'paused') return !r.enabled;
      return true;
    });
    list = [...list];
    if (sortBy === 'time') list.sort((a, b) => a.time.localeCompare(b.time));
    else if (sortBy === 'name') list.sort((a, b) => a.text.localeCompare(b.text));
    else list.sort((a, b) => b.id - a.id); // newest first
    return list;
  }, [reminders, filter, sortBy, today]);

  return (
    <main>
      <Navbar />

      <section className="container mt-4 mb-5" style={{ maxWidth: '680px' }}>
        <div className="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <span className="tag mb-2 d-inline-block"><i className="bi bi-bell-fill me-1"></i> Smart Reminders</span>
            <h2 className="mb-1">Stay Disciplined Today</h2>
            <p className="text-muted mb-0">Set daily workout, water or meal alarms with audible chimes.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline-warm btn-sm d-inline-flex align-items-center gap-2"
            onClick={playDigitalAlarm}
            aria-label="Test alarm sound"
          >
            <i className="bi bi-volume-up-fill fs-6"></i>
            <span>Test Alarm Sound</span>
          </button>
        </div>

        {/* Async state: quote with loading / error / success */}
        <div className="app-card quote-card p-3 mb-4" aria-live="polite">
          {quoteStatus === 'loading' && (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              Loading your daily motivation…
            </div>
          )}
          {quoteStatus === 'error' && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="field-error"><i className="bi bi-exclamation-triangle me-1"></i>{quoteError}</span>
              <button className="btn btn-sm btn-outline-warm" onClick={retry}>
                <i className="bi bi-arrow-clockwise me-1"></i>Retry
              </button>
            </div>
          )}
          {quoteStatus === 'success' && quote && (
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <p className="fst-italic mb-1">“{quote.text}”</p>
                <small className="text-muted">— {quote.author}</small>
              </div>
              <button className="btn btn-sm btn-outline-warm" onClick={next} aria-label="Show another quote" title="Next quote">
                <i className="bi bi-shuffle"></i>
              </button>
            </div>
          )}
        </div>

        {notifPerm === 'default' && (
          <div className="app-card p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="small text-muted"><i className="bi bi-bell me-1 text-accent"></i>Allow browser notifications so reminders reach you even in another tab.</span>
            <button className="btn btn-sm btn-warm" onClick={enableNotifications}>Enable</button>
          </div>
        )}

        {/* Add / edit form with validation */}
        <form onSubmit={handleSubmit} noValidate className="app-card p-4 mb-4" aria-label={editingId ? 'Edit reminder' : 'Add reminder'}>
          <h6 className="mb-3">{editingId ? 'Edit reminder' : 'New reminder'}</h6>
          <div className="row g-3">
            <FormInput
              className="col-12 col-md-7"
              label="What's the reminder?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, text: true }))}
              error={errors.text}
              touched={touched.text}
              maxLength={REMINDER_TEXT_MAX}
              placeholder="e.g. Drink 500ml water"
            />
            <FormInput
              className="col-12 col-md-5"
              label="Alarm Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, time: true }))}
              error={errors.time}
              touched={touched.time}
            />
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-2">
            <div className="form-check form-switch">
              <input
                id="rem-repeat"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="rem-repeat">Repeat daily</label>
            </div>
            <div className="d-flex gap-2">
              {editingId && (
                <button type="button" className="btn btn-outline-warm" onClick={resetForm}>Cancel</button>
              )}
              <button type="submit" className="btn btn-warm" disabled={!isValid && (touched.text || touched.time)}>
                <i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                {editingId ? 'Save changes' : 'Add reminder'}
              </button>
            </div>
          </div>
        </form>

        {/* Toolbar: filters + sort */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="filter-pills" role="tablist" aria-label="Filter reminders">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label} ({counts[f.id]})
              </button>
            ))}
          </div>
          <select
            className="form-select form-select-sm w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort reminders"
          >
            <option value="time">Sort: Time</option>
            <option value="new">Sort: Newest</option>
            <option value="name">Sort: A–Z</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="app-card p-4 text-center text-muted">
            <i className="bi bi-alarm fs-2 d-block mb-2 text-accent"></i>
            {reminders.length === 0
              ? 'No alarms set yet — add one above to schedule an audible alarm!'
              : 'Nothing in this view.'}
          </div>
        ) : (
          <div className="d-flex flex-column gap-2 mb-4">
            {visible.map((rem) => {
              const rang = hasRung(rem, today);
              return (
                <div key={rem.id} className="app-card p-3 d-flex align-items-center justify-content-between gap-2" style={{ opacity: rem.enabled ? 1 : 0.55 }}>
                  <div className="d-flex align-items-center gap-3 overflow-hidden">
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={rem.enabled}
                        onChange={() => toggleReminder(rem.id)}
                        aria-label={`${rem.enabled ? 'Pause' : 'Enable'} ${rem.text}`}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div className="fw-semibold text-truncate" title={rem.text}>
                        {rem.text}
                        {rem.enabled && rang && <span className="tag ms-2" style={{ fontSize: '0.65rem' }}>Rang</span>}
                        {!rem.enabled && <span className="tag ms-2" style={{ fontSize: '0.65rem' }}>Paused</span>}
                      </div>
                      <div className="text-muted small">
                        <i className="bi bi-clock me-1"></i>{rem.time}
                        <span className="ms-2"><i className={`bi ${rem.repeat ? 'bi-arrow-repeat' : 'bi-1-circle'} me-1`}></i>{rem.repeat ? 'Daily' : 'Once'}</span>
                      </div>
                    </div>
                  </div>

                  {confirmId === rem.id ? (
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <span className="small text-muted">Delete?</span>
                      <button className="btn btn-sm btn-warm" onClick={() => handleDelete(rem.id)}>Yes</button>
                      <button className="btn btn-sm btn-outline-warm" onClick={() => setConfirmId(null)}>No</button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <button className="btn btn-sm btn-outline-warm" onClick={() => testRing(rem)} title="Test this alarm now" aria-label="Test this alarm">
                        <i className="bi bi-play-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-warm" onClick={() => startEdit(rem)} title="Edit" aria-label="Edit reminder">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-warm" onClick={() => setConfirmId(rem.id)} title="Delete" aria-label="Delete reminder">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button className="btn btn-outline-warm" onClick={() => setCurrentView('dashboard')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </button>
      </section>
    </main>
  );
}

export default Reminders;
