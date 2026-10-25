const USERS_KEY = 'ft_users';
const SESSION_KEY = 'ft_current_user';

function getUsersDB() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveUsersDB(db) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving users DB', e);
  }
}

export function findUser(email) {
  if (!email) return null;
  const db = getUsersDB();
  return db[email] || null;
}

export function createUser(email, name, password) {
  const db = getUsersDB();
  const safeEmail = email || 'user@fittrack.com';
  db[safeEmail] = {
    name: name || 'User',
    password: password || '',
    goalData: null,
    progressEntries: [],
    reminders: [],
    dailyIntake: { date: new Date().toISOString().slice(0, 10), water: 0, calories: 0 },
  };
  saveUsersDB(db);
  return db[safeEmail];
}

export function updateUser(email, updates) {
  const targetEmail = email || getSessionEmail() || 'user@fittrack.com';
  const db = getUsersDB();
  if (!db[targetEmail]) {
    db[targetEmail] = {
      name: 'User',
      password: '',
      goalData: null,
      progressEntries: [],
      reminders: [],
      dailyIntake: { date: new Date().toISOString().slice(0, 10), water: 0, calories: 0 },
    };
  }
  db[targetEmail] = { ...db[targetEmail], ...updates };
  saveUsersDB(db);
  return { email: targetEmail, ...db[targetEmail] };
}

export function setSession(email) {
  localStorage.setItem(SESSION_KEY, email);
}

export function getSessionEmail() {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  const email = getSessionEmail();
  if (!email) return null;
  const data = findUser(email);
  if (!data) return null;
  return { email, ...data };
}