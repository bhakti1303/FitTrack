// A reminder "has rung" today (if repeating) or ever (if one-time)
export const hasRung = (r, today) => (r.repeat ? r.lastRang === today : !!r.lastRang);
