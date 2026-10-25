import { useState, useContext } from 'react';
import { getCurrentUser } from '../utils/userStore';
import { NavigationContext } from '../App';
import Navbar from '../components/Navbar';
import { calculateBMR, calculateTDEE, getTargetCalories, getWeeklyWorkoutPlan, getFullDayPlan, getDayNumber } from '../utils/planLogic';

function PlanOutput() {
  const { setCurrentView, currentUser: contextUser } = useContext(NavigationContext);
  const currentUser = contextUser || getCurrentUser();
  const goalData = currentUser?.goalData;

  // Hooks hamesha top par, kisi bhi early return se pehle
  const [selectedDay, setSelectedDay] = useState(() =>
    goalData ? (getDayNumber(goalData.startDate) - 1) % 7 : 0
  );
  const [doneMap, setDoneMap] = useState({}); // { "0-1": true } => day 0 ki exercise 1 complete

  if (!goalData) {
    return (
      <main>
        <Navbar />
        <section className="container mt-5 text-center">
          <p>No goal found. Please set your goal first.</p>
          <button className="btn btn-warm" onClick={() => setCurrentView('goals')}>Set Goal</button>
        </section>
      </main>
    );
  }

  const { age, gender, height, weight, goal, activityLevel, dietPref, startDate } = goalData;

  const bmr = calculateBMR({ gender, weight: Number(weight), height: Number(height), age: Number(age) });
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = getTargetCalories(tdee, goal);

  const workoutWeek = getWeeklyWorkoutPlan(goal);
  const dayNumber = getDayNumber(startDate);
  const todayIndex = (dayNumber - 1) % 7;

  const workout = workoutWeek[selectedDay];
  const dietTimeline = getFullDayPlan(goal, dietPref, selectedDay);

  const isRestDay = String(workout.focus).toLowerCase().includes('rest');
  const totalExercises = workout.exercises.length;
  const completedCount = workout.exercises.filter((_, i) => doneMap[`${selectedDay}-${i}`]).length;
  const completedPercent = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);

  const toggleExercise = (i) => {
    const key = `${selectedDay}-${i}`;
    setDoneMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main>
      <Navbar />
      <section className="container mt-4" style={{ maxWidth: '780px' }}>
        <div className="mb-4">
          <span className="tag mb-2 d-inline-block"><i className="bi bi-calendar-check me-1"></i> Day {dayNumber} of your program</span>
          <h2 className="mb-1">Your weekly plan</h2>
          <p className="text-muted mb-0">Target: {Math.round(targetCalories)} kcal/day</p>
        </div>

        <div className="d-flex gap-2 mb-4" style={{ overflowX: 'auto' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className="btn"
              style={{
                minWidth: 64,
                borderRadius: 12,
                border: i === todayIndex ? '2px solid var(--accent)' : '1px solid var(--line)',
                background: selectedDay === i ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' : 'var(--surface)',
                color: selectedDay === i ? '#fff' : 'var(--ink)',
                fontWeight: 600,
              }}
            >
              Day {i + 1}
              {i === todayIndex && <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Today</div>}
            </button>
          ))}
        </div>

        {/* Workout card */}
        <article className="app-card p-4 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i
                className={`bi ${isRestDay ? 'bi-moon-stars-fill' : 'bi-lightning-charge-fill'} me-2`}
                style={{ color: 'var(--accent)' }}
              ></i>
              {workout.focus}
            </h5>
            {!isRestDay && totalExercises > 0 && (
              <span className="tag">{completedCount}/{totalExercises} completed</span>
            )}
          </div>

          {isRestDay ? (
            <div className="text-center py-3">
              <i className="bi bi-moon-stars-fill d-block mb-2" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
              <h6 className="mb-1">Recover today</h6>
              <p className="text-muted small mb-0">Rest is part of the plan. Drink water, sleep well and come back stronger.</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div
                className="mb-3"
                style={{ height: 6, borderRadius: 6, background: 'var(--line)', overflow: 'hidden' }}
              >
                <div
                  style={{
                    width: `${completedPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    transition: 'width 0.3s ease',
                  }}
                ></div>
              </div>

              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {workout.exercises.map((item, i) => {
                  const isDone = !!doneMap[`${selectedDay}-${i}`];
                  return (
                    <li key={i}>
                      <label className="d-flex align-items-start gap-2" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="form-check-input mt-1"
                          checked={isDone}
                          onChange={() => toggleExercise(i)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                          {item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {totalExercises > 0 && completedCount === totalExercises && (
                <p className="mt-3 mb-0 small" style={{ color: 'var(--accent)' }}>
                  <i className="bi bi-trophy-fill me-1"></i> Workout complete. Great job!
                </p>
              )}
            </>
          )}
        </article>

        {/* Diet timeline card - jaise real diet chart */}
        <article className="app-card p-4 mb-3">
          <h5 className="mb-3">
            <i className="bi bi-egg-fried me-2" style={{ color: 'var(--accent-secondary)' }}></i>
            Full Day Diet Plan <span className="tag ms-1">{dietPref}</span>
          </h5>

          <div className="d-flex flex-column">
            {dietTimeline.map((meal, i) => (
              <div
                key={i}
                className="d-flex align-items-center gap-3 py-3"
                style={{ borderBottom: i !== dietTimeline.length - 1 ? '1px solid var(--line)' : 'none' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12, background: meal.color + '20', color: meal.color, fontSize: '1.2rem' }}
                >
                  <i className={`bi ${meal.icon}`}></i>
                </div>
                <div style={{ minWidth: 130 }}>
                  <div className="fw-semibold small">{meal.label}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{meal.time}</div>
                </div>
                <div className="flex-grow-1 text-end text-md-start">{meal.food}</div>
              </div>
            ))}
          </div>
        </article>

        <button className="btn btn-outline-warm" onClick={() => setCurrentView('dashboard')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </button>
      </section>
    </main>
  );
}

export default PlanOutput;