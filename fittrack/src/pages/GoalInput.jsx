import { useState, useContext } from 'react';
import { NavigationContext } from '../App';
import Navbar from '../components/Navbar';
import { getCurrentUser, updateUser } from '../utils/userStore';

function GoalInput() {
  const { setCurrentView, currentUser: contextUser, setCurrentUser } = useContext(NavigationContext);
  const currentUser = contextUser || getCurrentUser();

  const [form, setForm] = useState({
    age: currentUser?.goalData?.age || '',
    gender: currentUser?.goalData?.gender || 'male',
    height: currentUser?.goalData?.height || '',
    weight: currentUser?.goalData?.weight || '',
    goal: currentUser?.goalData?.goal || '',
    activityLevel: currentUser?.goalData?.activityLevel || 'sedentary',
    dietPref: currentUser?.goalData?.dietPref || 'veg',
    hours: currentUser?.goalData?.hours || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { age, height, weight, goal, hours } = form;
    if (!age || !height || !weight || !goal || !hours) {
      alert('Please fill all fields');
      return;
    }
    const startDate = currentUser?.goalData?.startDate || new Date().toISOString();
    const updatedGoalData = { ...form, startDate };
    if (currentUser?.email) {
      updateUser(currentUser.email, { goalData: updatedGoalData });
      if (setCurrentUser) {
        setCurrentUser({ ...currentUser, goalData: updatedGoalData });
      }
    }
    setCurrentView('plan');
  };

  return (
    <main>
      <Navbar />
      <section className="container mt-4" style={{ maxWidth: '650px' }}>
        <div className="mb-4">
          <span className="tag mb-2 d-inline-block"><i className="bi bi-bullseye me-1"></i> Your details</span>
          <h2 className="mb-1">Tell us about yourself</h2>
          <p className="text-muted mb-0">The more we know, the better your plan fits.</p>
        </div>

        <form onSubmit={handleSubmit} className="app-card p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Age</label>
              <input type="number" name="age" className="form-control" value={form.age} onChange={handleChange} placeholder="e.g. 21" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Gender</label>
              <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Height (cm)</label>
              <input type="number" name="height" className="form-control" value={form.height} onChange={handleChange} placeholder="e.g. 165" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Weight (kg)</label>
              <input type="number" name="weight" className="form-control" value={form.weight} onChange={handleChange} placeholder="e.g. 60" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Your Goal</label>
              <select name="goal" className="form-select" value={form.goal} onChange={handleChange}>
                <option value="">-- Select --</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="maintain">Maintain Weight</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Activity Level</label>
              <select name="activityLevel" className="form-select" value={form.activityLevel} onChange={handleChange}>
                <option value="sedentary">Sedentary (little exercise)</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderately Active</option>
                <option value="active">Very Active</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Diet Preference</label>
              <select name="dietPref" className="form-select" value={form.dietPref} onChange={handleChange}>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Daily Time (hours)</label>
              <input type="number" name="hours" className="form-control" value={form.hours} onChange={handleChange} placeholder="e.g. 1" min="0" max="24" />
            </div>
          </div>

          <button type="submit" className="btn btn-warm w-100 mt-4">
            Generate My Plan
          </button>
        </form>
      </section>
    </main>
  );
}

export default GoalInput;