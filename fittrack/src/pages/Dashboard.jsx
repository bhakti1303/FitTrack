import { useContext, useState, useEffect, useRef } from 'react';
import { NavigationContext, IntakeContext } from '../App';
import { getCurrentUser } from '../utils/userStore';
import Navbar from '../components/Navbar';
import FormInput from '../components/FormInput';
import useQuote from '../hooks/useQuote';
import { calculateBMR, calculateTDEE, getTargetCalories, getDayNumber, getWeeklyWorkoutPlan } from '../utils/planLogic';

/* ---------- Validation rules (each returns an error string, or '' if valid) ---------- */
const MEAL_NAME_MAX = 40;
const WATER_GOAL_ML = 3000;

const validateMealName = (value) => {
  const v = value.trim();
  if (!v) return 'Meal name is required.';
  if (v.length < 2) return 'Use at least 2 characters.';
  if (v.length > MEAL_NAME_MAX) return `Keep it under ${MEAL_NAME_MAX} characters.`;
  return '';
};

const validateCalories = (value) => {
  if (value === '') return 'Calories are required.';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Enter a number.';
  if (!Number.isInteger(n)) return 'Use a whole number.';
  if (n < 1) return 'Must be at least 1 kcal.';
  if (n > 3000) return 'One entry can be at most 3000 kcal.';
  return '';
};

const validateWater = (value) => {
  if (value === '') return 'Enter an amount in ml.';
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 'Use a whole number.';
  if (n < 50) return 'Minimum is 50 ml.';
  if (n > 2000) return 'Maximum is 2000 ml at once.';
  return '';
};

/* ---------- Form: log a meal (controlled inputs, validate on blur + submit) ---------- */
function MealForm({ onAdd }) {
  const [values, setValues] = useState({ name: '', calories: '' });
  const [touched, setTouched] = useState({});
  const nameRef = useRef(null);

  const errors = {
    name: validateMealName(values.name),
    calories: validateCalories(values.calories),
  };
  const isValid = !errors.name && !errors.calories;

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, calories: true }); // reveal every error on submit
    if (!isValid) return;
    onAdd(values.name.trim(), Number(values.calories));
    setValues({ name: '', calories: '' });
    setTouched({});
    nameRef.current?.focus(); // DOM: put the cursor back for the next entry
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormInput
        label="Meal name"
        value={values.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name}
        touched={touched.name}
        maxLength={MEAL_NAME_MAX}
        placeholder="e.g. Oats with banana"
        className="mb-3"
        ref={nameRef}
      />
      <FormInput
        label="Calories (kcal)"
        type="number"
        inputMode="numeric"
        value={values.calories}
        onChange={handleChange('calories')}
        onBlur={handleBlur('calories')}
        error={errors.calories}
        touched={touched.calories}
        helper="Whole number, 1 – 3000"
        placeholder="e.g. 350"
        className="mb-3"
      />
      <button type="submit" className="btn btn-warm btn-sm">
        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Add meal
      </button>
    </form>
  );
}

/* ---------- Form: custom water amount ---------- */
function WaterForm({ onAdd }) {
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const error = validateWater(amount);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    onAdd(Number(amount));
    setAmount('');
    setTouched(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="d-flex align-items-start gap-2 mt-3 pt-3 border-top border-secondary border-opacity-25">
      <FormInput
        label="Custom amount (ml)"
        type="number"
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onBlur={() => setTouched(true)}
        error={error}
        touched={touched}
        placeholder="e.g. 330"
        className="flex-grow-1"
      />
      <button type="submit" className="btn btn-outline-warm btn-sm" style={{ marginTop: '2.1rem' }}>
        Add
      </button>
    </form>
  );
}

function Dashboard() {
  const { setCurrentView, currentUser: contextUser } = useContext(NavigationContext);
  // Global intake state (lives in App.jsx so it survives page changes)
  const { water, meals, calories, addWater, addMeal, removeMeal, resetWater, resetMeals } = useContext(IntakeContext);

  const currentUser = getCurrentUser() || contextUser;
  const user = currentUser;
  const goalData = currentUser?.goalData;
  const progressEntries = currentUser?.progressEntries || [];
  const reminders = currentUser?.reminders || [];

  // Async state: loading / error / success handled by the useQuote hook
  const { status: quoteStatus, quote, error: quoteError, retry: retryQuote, next: nextQuote } = useQuote();

  // DOM event: press "W" anywhere (outside inputs) to log a glass of water
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;
      if (e.key.toLowerCase() === 'w') addWater(250);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [addWater]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  let targetCalories = null;
  if (goalData) {
    const bmr = calculateBMR({
      gender: goalData.gender,
      weight: Number(goalData.weight),
      height: Number(goalData.height),
      age: Number(goalData.age),
    });
    const tdee = calculateTDEE(bmr, goalData.activityLevel);
    targetCalories = Math.round(getTargetCalories(tdee, goalData.goal));
  }
  const calorieGoal = targetCalories || 2000;
  const waterPct = Math.min(100, (water / WATER_GOAL_ML) * 100);
  const caloriePct = Math.min(100, (calories / calorieGoal) * 100);

  const latestWeight = progressEntries.length > 0 ? progressEntries[progressEntries.length - 1].weight : goalData?.weight || '--';

  // Custom CSS Chart Logic for Activity Split (always populated!)
  const currentGoal = goalData?.goal || 'weight-loss';
  const week = getWeeklyWorkoutPlan(currentGoal);
  const counts = {};
  week.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
  const colorMap = { Cardio: '#00E5FF', Strength: '#B300FF', Yoga: '#00B3CC', Rest: '#2A2A36' };
  const total = week.length || 7;
  const pieData = Object.entries(counts).map(([type, value]) => ({
    name: type,
    value,
    percentage: (value / total) * 100,
    color: colorMap[type] || '#4A4A5A',
  }));

  // Custom Bar Chart Logic for Weight Trend
  const maxEntries = 7;
  const recentEntries = progressEntries.slice(-maxEntries);
  const weights = recentEntries.map((e) => Number(e.weight));
  const minWeight = weights.length > 0 ? Math.min(...weights) - 2 : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) + 2 : 100;

  return (
    <section>
      <Navbar />

      {/* Hero Section */}
      <header className="container-xl px-3 px-md-4 mt-4">
        <div
          className="position-relative overflow-hidden mb-4"
          style={{
            borderRadius: 14,
            minHeight: 340,
            backgroundImage: `linear-gradient(90deg, rgba(13,13,18,0.9) 25%, rgba(13,13,18,0.4) 70%), url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
          }}
        >
          <div className="p-4 p-md-5 d-flex flex-column justify-content-between h-100" style={{ minHeight: 340 }}>
            <span className="tag d-inline-block" style={{ width: 'fit-content' }}>{greeting}</span>

            <div>
              <h1 className="editorial-headline text-white mb-0" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>
                HI, {(user?.name || 'THERE').toUpperCase()}
              </h1>
              <h2 className="editorial-headline mb-4" style={{ color: 'var(--accent)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>
                // KEEP MOVING
              </h2>
            </div>
          </div>

          <div className="app-card p-3 position-absolute d-none d-md-block" style={{ bottom: -24, left: 32, minWidth: 220 }}>
            <div className="text-muted small">TARGET TODAY</div>
            <div className="h3 mb-0" style={{ color: 'var(--accent)' }}>{targetCalories || '--'} <span className="small text-muted">kcal</span></div>
          </div>
        </div>
      </header>

      <main className="container-xl px-3 px-md-4 mt-4 mb-5">

        {/* Quote of the Day — async state: loading / error / success */}
        <section className="app-card p-4 mb-4 text-center" aria-live="polite" aria-label="Quote of the day">
          {quoteStatus === 'loading' && (
            <div className="text-muted d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Loading today&apos;s quote…
            </div>
          )}

          {quoteStatus === 'error' && (
            <div role="alert">
              <p className="text-muted mb-2">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                Couldn&apos;t load the quote{quoteError ? ` (${quoteError})` : ''}.
              </p>
              <button type="button" className="btn btn-outline-warm btn-sm" onClick={retryQuote}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Try again
              </button>
            </div>
          )}

          {quoteStatus === 'success' && quote && (
            <>
              <blockquote className="mb-2" style={{ fontStyle: 'italic', color: 'var(--ink)' }}>
                &quot;{quote.text}&quot;
                {quote.author && quote.author !== 'Unknown' && (
                  <footer className="text-muted mt-2">— {quote.author}</footer>
                )}
              </blockquote>
              <button type="button" className="btn btn-sm btn-outline-secondary text-muted py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={nextQuote}>
                Next quote
              </button>
            </>
          )}
        </section>

        {/* Bento Grid Stats */}
        <section className="bento-grid mb-4">
          <div className="app-card p-4">
            <div className="text-muted small mb-1">CURRENT WEIGHT</div>
            <div className="h2 mb-0" style={{ color: 'var(--accent)' }}>{latestWeight} <span className="small text-muted">kg</span></div>
          </div>
          <div className="app-card p-4">
            <div className="text-muted small mb-1">HEIGHT</div>
            <div className="h2 mb-0">{goalData?.height || '--'} <span className="small text-muted">cm</span></div>
          </div>
          <div className="app-card p-4">
            <div className="text-muted small mb-1">DAY OF PLAN</div>
            <div className="h2 mb-0" style={{ color: 'var(--accent-secondary)' }}>{goalData ? getDayNumber(goalData.startDate) : '--'}</div>
          </div>
        </section>

        {/* Daily Trackers: Water Intake & Meal Calorie Intake */}
        <section className="row g-4 mb-4" aria-label="Daily Intake Trackers">
          {/* Water Intake Card */}
          <div className="col-12 col-md-6">
            <div className="app-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="tile-icon" style={{ width: 38, height: 38, minWidth: 38, fontSize: '1.1rem', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent)' }}>
                    <i className="bi bi-droplet-fill"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 text-white">Water Intake</h5>
                    <span className="text-muted small">Daily Target: 3,000 ml · press <kbd>W</kbd> for a glass</span>
                  </div>
                </div>
                <span className="tag" style={{ fontSize: '0.7rem' }}>{Math.round((water / WATER_GOAL_ML) * 100)}%</span>
              </div>

              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="h2 mb-0" style={{ color: 'var(--accent)' }}>{(water / 1000).toFixed(2)}</span>
                <span className="text-muted">/ 3.0 L ({water} ml)</span>
              </div>

              <div className="progress mb-3" style={{ height: '8px', background: 'var(--line)', borderRadius: '10px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg, var(--accent), #00b3cc)', borderRadius: '10px', transition: 'width 0.3s ease' }}
                  aria-valuenow={water}
                  aria-valuemin="0"
                  aria-valuemax={WATER_GOAL_ML}
                ></div>
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button type="button" className="btn btn-warm btn-sm d-inline-flex align-items-center gap-1" onClick={() => addWater(250)}>
                  <i className="bi bi-plus-lg"></i><span>+ 1 Glass (250 ml)</span>
                </button>
                <button type="button" className="btn btn-outline-warm btn-sm d-inline-flex align-items-center gap-1" onClick={() => addWater(500)}>
                  <i className="bi bi-plus-lg"></i><span>+ 500 ml Bottle</span>
                </button>
                {water > 0 && (
                  <button type="button" className="btn btn-sm btn-outline-secondary ms-auto text-muted py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={resetWater} title="Reset water intake">
                    Reset
                  </button>
                )}
              </div>

              <WaterForm onAdd={addWater} />
            </div>
          </div>

          {/* Meal & Calorie Intake Card */}
          <div className="col-12 col-md-6">
            <div className="app-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="tile-icon" style={{ width: 38, height: 38, minWidth: 38, fontSize: '1.1rem', background: 'rgba(179, 0, 255, 0.15)', color: 'var(--accent-secondary)' }}>
                    <i className="bi bi-fire"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 text-white">Meal Intake</h5>
                    <span className="text-muted small">Target: {calorieGoal} kcal</span>
                  </div>
                </div>
                <span className="tag" style={{ fontSize: '0.7rem' }}>{Math.round((calories / calorieGoal) * 100)}%</span>
              </div>

              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="h2 mb-0" style={{ color: 'var(--accent-secondary)' }}>{calories}</span>
                <span className="text-muted">/ {calorieGoal} kcal</span>
                <span className="small text-muted ms-auto">{Math.max(0, calorieGoal - calories)} kcal left</span>
              </div>

              <div className="progress mb-3" style={{ height: '8px', background: 'var(--line)', borderRadius: '10px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${caloriePct}%`, background: 'linear-gradient(90deg, var(--accent-secondary), #d946ef)', borderRadius: '10px', transition: 'width 0.3s ease' }}
                  aria-valuenow={calories}
                  aria-valuemin="0"
                  aria-valuemax={calorieGoal}
                ></div>
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-warm btn-sm d-inline-flex align-items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, var(--accent-secondary), #9333ea)' }}
                  onClick={() => addMeal('Quick meal', 400)}
                >
                  <i className="bi bi-plus-lg"></i><span>+ Meal (400 kcal)</span>
                </button>
                <button type="button" className="btn btn-outline-warm btn-sm d-inline-flex align-items-center gap-1" onClick={() => addMeal('Snack', 200)}>
                  <i className="bi bi-plus-lg"></i><span>+ Snack (200 kcal)</span>
                </button>
                {meals.length > 0 && (
                  <button type="button" className="btn btn-sm btn-outline-secondary ms-auto text-muted py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={resetMeals} title="Clear all meals">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Log a meal (form) + today's meal list */}
        <section className="row g-4 mb-4" aria-label="Meal log">
          <div className="col-12 col-md-6">
            <div className="app-card p-4 h-100">
              <h5 className="mb-3">LOG A MEAL</h5>
              <MealForm onAdd={addMeal} />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="app-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">TODAY&apos;S MEALS</h5>
                <span className="tag" style={{ fontSize: '0.7rem' }}>{meals.length} logged</span>
              </div>

              {meals.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-egg-fried fs-2 d-block mb-2" aria-hidden="true"></i>
                  Nothing logged yet. Add your first meal.
                </div>
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {meals.map((meal) => (
                    <li key={meal.id} className="d-flex align-items-center justify-content-between gap-2 p-2" style={{ background: 'rgba(179, 0, 255, 0.08)', borderRadius: 10, border: '1px solid rgba(179, 0, 255, 0.15)' }}>
                      <span className="text-truncate" title={meal.name}>{meal.name}</span>
                      <span className="d-flex align-items-center gap-2 flex-shrink-0">
                        <span className="text-muted small">{meal.calories} kcal</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary text-muted py-0 px-2"
                          onClick={() => removeMeal(meal.id)}
                          aria-label={`Delete ${meal.name}`}
                        >
                          <i className="bi bi-x-lg" aria-hidden="true"></i>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="app-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">WEIGHT TREND</h5>
                <span className="tag">{progressEntries.length} entries</span>
              </div>

              {recentEntries.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-graph-up fs-2 d-block mb-2"></i>
                  No entries yet. Log your weight in Progress.
                </div>
              ) : (
                /* Custom CSS Bar Chart */
                <div className="custom-bar-chart" aria-label="Weight Trend Chart" style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '1rem', paddingBottom: '20px', borderBottom: '1px solid var(--line)' }}>
                  {recentEntries.map((entry, idx) => {
                    const heightPercent = ((Number(entry.weight) - minWeight) / (maxWeight - minWeight)) * 100;
                    return (
                      <div key={idx} className="chart-bar-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <div
                            className="chart-bar"
                            style={{
                              height: `${Math.max(5, heightPercent)}%`,
                              width: '100%',
                              background: 'var(--accent)',
                              borderRadius: '4px 4px 0 0',
                              opacity: 0.8,
                              transition: 'height 0.5s ease',
                            }}
                            title={`${entry.weight} kg on ${entry.date}`}
                          ></div>
                        </div>
                        <div className="small text-muted mt-2" style={{ fontSize: '0.7rem' }}>{entry.date.slice(0, 5)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="app-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">ACTIVITY SPLIT</h5>
                <span className="tag" style={{ fontSize: '0.7rem' }}>
                  {goalData?.goal ? goalData.goal.replace('-', ' ').toUpperCase() : 'STANDARD 7-DAY'}
                </span>
              </div>

              {/* Custom CSS Progress Bars for Split */}
              <div className="d-flex flex-column gap-3">
                {pieData.map((entry, i) => (
                  <div key={i}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="fw-semibold" style={{ color: entry.color }}>
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.55rem' }}></i>
                        {entry.name}
                      </span>
                      <span className="text-muted">{entry.value} days ({Math.round(entry.percentage)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${entry.percentage}%`, height: '100%', background: entry.color, borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {!goalData && (
                <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Want a custom routine?</span>
                  <button type="button" className="btn btn-outline-warm btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => setCurrentView('goals')}>
                    Set Goal →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="app-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0">UPCOMING REMINDERS</h5>
              <span className="tag" style={{ fontSize: '0.7rem' }}>{reminders.length} Active</span>
            </div>
            <button className="tag bg-transparent border-0" onClick={() => setCurrentView('reminders')} style={{ cursor: 'pointer' }}>View all →</button>
          </div>
          {reminders.length === 0 ? (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 py-2">
              <span className="text-muted small">No reminders set yet. Set reminders for hydration, workouts, or meals.</span>
              <button type="button" className="btn btn-outline-warm btn-sm py-1 px-3" onClick={() => setCurrentView('reminders')}>
                + Add Reminder
              </button>
            </div>
          ) : (
            <div className="row g-2">
              {reminders.map((rem, i) => (
                <article key={rem.id || i} className="col-12 col-sm-6 col-md-3">
                  <div className="d-flex align-items-center gap-2 p-2 h-100" style={{ background: 'rgba(0, 229, 255, 0.08)', borderRadius: 10, border: '1px solid rgba(0, 229, 255, 0.15)' }}>
                    <i className="bi bi-alarm-fill fs-5" style={{ color: 'var(--accent)' }} aria-hidden="true"></i>
                    <div className="overflow-hidden">
                      <div className="small fw-semibold text-truncate" title={rem.text}>{rem.text}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{rem.time}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </section>
  );
}

export default Dashboard;
