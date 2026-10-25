import { useState, useEffect, useRef, useMemo } from 'react';
import { RemindersContext } from './RemindersContext';
import { updateUser, getCurrentUser } from '../utils/userStore';
import { playDigitalAlarm } from '../utils/alarmSound';
import { hasRung } from '../utils/reminderHelpers';

const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
const nowHM = () => new Date().toTimeString().slice(0, 5); // HH:MM

// Make old saved reminders compatible with the new shape
function normalize(list, today) {
  return (list || []).map((r, i) => ({
    id: r.id || Date.now() + i,
    text: r.text,
    time: r.time,
    enabled: r.enabled !== false,
    repeat: !!r.repeat,
    lastRang: r.lastRang || (r.alerted ? today : null),
  }));
}

/**
 * Global state for reminders.
 * - Keeps the list, the alarm checker and the ringing alarm in ONE place,
 *   so alarms keep working when you move between pages.
 * - Persists to the user store and syncs the app-wide current user.
 * Remounted (via key in App) whenever the logged-in user changes.
 */
export function RemindersProvider({ user, setUser, children }) {
  const [clock, setClock] = useState(() => ({ date: todayStr(), hm: nowHM() }));
  const [reminders, setReminders] = useState(() => normalize(user?.reminders, todayStr()));
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [snoozes, setSnoozes] = useState([]); // [{ id, at }]
  const ringTimerRef = useRef(null);

  // Save + sync to global user (Dashboard reads currentUser.reminders)
  const commit = (updated) => {
    setReminders(updated);
    const email = (getCurrentUser() || user)?.email;
    if (email) {
      const saved = updateUser(email, { reminders: updated });
      if (setUser) setUser(saved);
    }
  };

  const stopRinging = () => {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  };

  const ring = (rem) => {
    setActiveAlarm(rem);
    playDigitalAlarm();
    stopRinging();
    ringTimerRef.current = setInterval(playDigitalAlarm, 2200);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ FitTrack Reminder', { body: rem.text });
    }
  };

  // Checker — runs every second
  useEffect(() => {
    const tick = () => {
      const date = todayStr();
      const hm = nowHM();
      setClock((prev) => (prev.date === date && prev.hm === hm ? prev : { date, hm }));

      const due = reminders.filter(
        (r) => r.enabled && r.time === hm && (r.repeat ? r.lastRang !== date : !r.lastRang)
      );
      if (due.length) {
        ring(due[0]);
        commit(reminders.map((r) => (due.some((d) => d.id === r.id) ? { ...r, lastRang: date } : r)));
      }

      const nowMs = Date.now();
      const snoozeDue = snoozes.find((s) => s.at <= nowMs);
      if (snoozeDue) {
        setSnoozes((prev) => prev.filter((s) => s.at > nowMs));
        const rem = reminders.find((r) => r.id === snoozeDue.id);
        if (rem) ring(rem);
      }
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, snoozes]);

  // stop the repeating ring sound if the provider is removed (e.g. logout)
  useEffect(() => stopRinging, []);

  // ── Actions ──
  const addReminder = ({ text, time, repeat }) => {
    commit([...reminders, { id: Date.now(), text: text.trim(), time, enabled: true, repeat, lastRang: null }]);
  };

  const updateReminder = (id, changes) => {
    commit(
      reminders.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...changes };
        if (changes.text !== undefined) next.text = changes.text.trim();
        // changing the time (or turning it back on) makes it ring again
        if (changes.time !== undefined && changes.time !== r.time) next.lastRang = null;
        return next;
      })
    );
  };

  const deleteReminder = (id) => {
    commit(reminders.filter((r) => r.id !== id));
    setSnoozes((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleReminder = (id) => {
    const r = reminders.find((x) => x.id === id);
    if (r) updateReminder(id, { enabled: !r.enabled });
  };

  const stopAlarm = () => {
    stopRinging();
    setActiveAlarm(null);
  };

  const snoozeAlarm = (minutes = 5) => {
    if (activeAlarm) setSnoozes((prev) => [...prev, { id: activeAlarm.id, at: Date.now() + minutes * 60000 }]);
    stopAlarm();
  };

  const testRing = (rem) => ring(rem);

  // ── Derived values ──
  const pendingToday = useMemo(
    () => reminders.filter((r) => r.enabled && !hasRung(r, clock.date)).sort((a, b) => a.time.localeCompare(b.time)),
    [reminders, clock.date]
  );
  const nextReminder = pendingToday.find((r) => r.time >= clock.hm) || pendingToday[0] || null;

  const value = {
    reminders,
    activeAlarm,
    today: clock.date,
    pendingCount: pendingToday.length,
    nextReminder,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    stopAlarm,
    snoozeAlarm,
    testRing,
  };

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}
