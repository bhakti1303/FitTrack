// Reusable validation functions — each returns an error string, or '' if valid.

export const REMINDER_TEXT_MIN = 3;
export const REMINDER_TEXT_MAX = 60;

export function validateReminderText(value) {
  const v = value.trim();
  if (!v) return 'Reminder text is required.';
  if (v.length < REMINDER_TEXT_MIN) return `Use at least ${REMINDER_TEXT_MIN} characters.`;
  if (v.length > REMINDER_TEXT_MAX) return `Keep it under ${REMINDER_TEXT_MAX} characters.`;
  return '';
}

export function validateReminderTime(value, text, reminders, editingId) {
  if (!value) return 'Please choose a time.';
  const duplicate = reminders.some(
    (r) =>
      r.id !== editingId &&
      r.time === value &&
      r.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
  if (duplicate) return 'You already have this reminder at this time.';
  return '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return '';
}
