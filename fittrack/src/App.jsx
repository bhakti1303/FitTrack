import { useState, useEffect, useReducer, useMemo, createContext } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GoalInput from './pages/GoalInput';
import PlanOutput from './pages/PlanOutput';
import Progress from './pages/Progress';
import Reminders from './pages/Reminders';
import Footer from './components/Footer';
import { getCurrentUser, updateUser } from './utils/userStore';
import { RemindersProvider } from './context/RemindersProvider';

/* ------------------------------------------------------------------ *
 * 1. CONTEXTS (global state)
 *    - NavigationContext: current route + logged-in user (same shape as
 *      before, so every other page keeps working unchanged)
 *    - IntakeContext: today's water + meals, shared across pages
 * ------------------------------------------------------------------ */
export const NavigationContext = createContext(null);
export const IntakeContext = createContext(null);

/* ------------------------------------------------------------------ *
 * 2. ROUTE TABLE (multi-page SPA design, no extra library)
 *    Hash-based router: URLs look like  index.html#/dashboard
 *    `public: true` pages are open to everyone; all others are protected.
 * ------------------------------------------------------------------ */
const ROUTES = {
  login:     { component: Login,      title: 'Login',     public: true },
  signup:    { component: Signup,     title: 'Sign Up',   public: true },
  dashboard: { component: Dashboard,  title: 'Dashboard' },
  goals:     { component: GoalInput,  title: 'Goals' },
  plan:      { component: PlanOutput, title: 'My Plan' },
  progress:  { component: Progress,   title: 'Progress' },
  reminders: { component: Reminders,  title: 'Reminders' },
};
const DEFAULT_ROUTE = 'login';

// "#/dashboard?x=1" -> "dashboard"   |   "" -> ""
const getRouteFromHash = () =>
  window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0].toLowerCase();

function NotFound({ onHome }) {
  return (
    <main className="container-xl px-3 py-5 text-center">
      <div className="app-card p-5 mx-auto" style={{ maxWidth: 520 }}>
        <i className="bi bi-compass fs-1 d-block mb-2" style={{ color: 'var(--accent)' }} aria-hidden="true"></i>
        <h1 className="h2">404 — Page not found</h1>
        <p className="text-muted">That page doesn&apos;t exist in FitTrack.</p>
        <button type="button" className="btn btn-warm" onClick={onHome}>
          Go to Dashboard
        </button>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * 3. INTAKE STORE — useReducer + Context (Redux-style architecture)
 *    state  -> one object   |  actions -> plain objects  |  reducer -> pure fn
 * ------------------------------------------------------------------ */
const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local time)
const sumCalories = (meals) => meals.reduce((total, m) => total + m.calories, 0);

// Build the starting state from what is saved for the user (new day => fresh)
function initIntake(saved) {
  const date = todayLocal();
  if (!saved || saved.date !== date) return { date, water: 0, meals: [] };
  let meals = Array.isArray(saved.meals) ? saved.meals : [];
  // older saves only had a calories total — keep it as one entry
  if (meals.length === 0 && saved.calories > 0) {
    meals = [{ id: 'earlier', name: 'Earlier intake', calories: saved.calories }];
  }
  return { date, water: saved.water || 0, meals };
}

function intakeReducer(state, action) {
  switch (action.type) {
    case 'ADD_WATER':
      return { ...state, water: Math.max(0, state.water + action.amount) };
    case 'ADD_MEAL':
      return { ...state, meals: [...state.meals, action.meal] };
    case 'REMOVE_MEAL':
      return { ...state, meals: state.meals.filter((m) => m.id !== action.id) };
    case 'RESET_WATER':
      return { ...state, water: 0 };
    case 'RESET_MEALS':
      return { ...state, meals: [] };
    default:
      return state;
  }
}

function IntakeProvider({ user, children }) {
  const [state, dispatch] = useReducer(intakeReducer, user?.dailyIntake, initIntake);
  const email = user?.email;

  // Persist every change to the user store (only for a logged-in user)
  useEffect(() => {
    if (!email) return;
    updateUser(email, { dailyIntake: { ...state, calories: sumCalories(state.meals) } });
  }, [state, email]);

  // dispatch is stable, so these helpers never change between renders
  const actions = useMemo(
    () => ({
      addWater: (amount) => dispatch({ type: 'ADD_WATER', amount }),
      addMeal: (name, calories) =>
        dispatch({
          type: 'ADD_MEAL',
          meal: { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, calories },
        }),
      removeMeal: (id) => dispatch({ type: 'REMOVE_MEAL', id }),
      resetWater: () => dispatch({ type: 'RESET_WATER' }),
      resetMeals: () => dispatch({ type: 'RESET_MEALS' }),
    }),
    []
  );

  const value = { water: state.water, meals: state.meals, calories: sumCalories(state.meals), ...actions };
  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

/* ------------------------------------------------------------------ *
 * 4. APP — router + route guard + layout
 * ------------------------------------------------------------------ */
function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // DOM event: keep React state in sync with the address bar (back/forward buttons work)
  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Same API the pages already use: setCurrentView('dashboard')
  const setCurrentView = (id) => {
    const target = `#/${id}`;
    if (window.location.hash !== target) window.location.hash = target;
    else setRoute(id);
  };

  // Resolve the route
  const requested = route || DEFAULT_ROUTE;
  const config = ROUTES[requested];                       // undefined => 404
  const isAuthed = Boolean(currentUser || getCurrentUser());
  const blocked = Boolean(config) && !config.public && !isAuthed; // protected route, not logged in
  const activeKey = blocked ? DEFAULT_ROUTE : requested;
  const activeConfig = ROUTES[activeKey];
  const View = activeConfig?.component;

  // Route guard: send visitors without a session to the login page
  useEffect(() => {
    if (blocked) window.location.replace(`#/${DEFAULT_ROUTE}`);
  }, [blocked]);

  // DOM manipulation: page title + scroll to top on every page change
  useEffect(() => {
    document.title = activeConfig ? `${activeConfig.title} · FitTrack` : 'Page not found · FitTrack';
    window.scrollTo({ top: 0 });
  }, [activeKey, activeConfig]);

  // Footer only on main app pages (not on full-screen login/signup/404)
  const showFooter = Boolean(activeConfig) && !activeConfig.public;

  return (
    <NavigationContext.Provider value={{ currentView: activeKey, setCurrentView, currentUser, setCurrentUser }}>
      {/* key remounts per-user state when a different user logs in/out */}
      <RemindersProvider key={currentUser?.email || 'guest'} user={currentUser} setUser={setCurrentUser}>
        <IntakeProvider key={currentUser?.email || 'guest'} user={currentUser}>
          <div className="app-container d-flex flex-column min-vh-100 w-100">
            <div className="flex-grow-1 w-100">
              {View ? <View /> : <NotFound onHome={() => setCurrentView('dashboard')} />}
            </div>
            {showFooter && <Footer />}
          </div>
        </IntakeProvider>
      </RemindersProvider>
    </NavigationContext.Provider>
  );
}

export default App;
