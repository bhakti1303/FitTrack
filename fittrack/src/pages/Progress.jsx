import { useState, useContext } from 'react';
import { NavigationContext } from '../App';
import Navbar from '../components/Navbar';
import { getCurrentUser, updateUser } from '../utils/userStore';

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 300;

// ISO timestamp ko "13 Sep 2026" jaisa readable format banata hai
function formatDate(entry) {
  if (entry.timestamp) {
    return new Date(entry.timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return entry.date; // purani entries (jinme timestamp nahi hai) jaisi thi waisi dikhengi
}

function Progress() {
  const { setCurrentView, currentUser: contextUser, setCurrentUser } = useContext(NavigationContext);
  const currentUser = contextUser || getCurrentUser();
  const [entries, setEntries] = useState(currentUser?.progressEntries || []);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // entries ko localStorage (userStore) aur context dono mein save karta hai
  const saveEntries = (updated) => {
    setEntries(updated);
    if (currentUser?.email) {
      updateUser(currentUser.email, { progressEntries: updated });
      if (setCurrentUser) {
        setCurrentUser({ ...currentUser, progressEntries: updated });
      }
    }
  };

  // Validation: empty, number, aur realistic range check
  const validateWeight = (value) => {
    if (value === '') return 'Please enter your weight.';
    const num = Number(value);
    if (Number.isNaN(num)) return 'Weight must be a number.';
    if (num < MIN_WEIGHT || num > MAX_WEIGHT) {
      return `Weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT} kg.`;
    }
    return '';
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    const validationError = validateWeight(weight);
    if (validationError) {
      setError(validationError);
      return;
    }
    const newEntry = {
      date: new Date().toLocaleDateString(), // dashboard isi field ko use karta hai, isliye same rakha
      timestamp: new Date().toISOString(),   // sorting aur readable date ke liye
      weight: Number(weight),
      note: note.trim(),
    };
    saveEntries([...entries, newEntry]);
    setWeight('');
    setNote('');
    setError('');
  };

  const handleDelete = (index) => {
    if (!window.confirm('Delete this entry?')) return;
    saveEntries(entries.filter((_, i) => i !== index));
  };

  // Entries hamesha add hone ke order mein hain, toh reverse karne se newest upar aayegi.
  // originalIndex isliye rakha taaki delete sahi entry ko ho aur change pichli entry se nikle.
  const displayEntries = entries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .reverse();

  const getChange = (originalIndex) => {
    if (originalIndex === 0) return null; // pehli entry ke saath compare karne ko kuch nahi
    return Number(entries[originalIndex].weight) - Number(entries[originalIndex - 1].weight);
  };

  return (
    <main>
      <Navbar />
      <section className="container mt-4" style={{ maxWidth: '650px' }}>
        <div className="mb-4">
          <span className="tag mb-2 d-inline-block"><i className="bi bi-graph-up-arrow me-1"></i> Progress</span>
          <h2 className="mb-1">Track your journey</h2>
          <p className="text-muted mb-0">Log your weight regularly to see your trend.</p>
        </div>

        <form onSubmit={handleAddEntry} className="app-card p-4 mb-4" noValidate>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={weight}
                onChange={(e) => { setWeight(e.target.value); if (error) setError(''); }}
                placeholder="e.g. 65"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Note (optional)</label>
              <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Felt energetic today" />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-warm w-100">Add</button>
            </div>
          </div>
          {error && (
            <div className="mt-3 small" style={{ color: '#ff6b6b' }}>
              <i className="bi bi-exclamation-circle me-1"></i>{error}
            </div>
          )}
        </form>

        <h5 className="mb-3">Your entries</h5>
        {entries.length === 0 ? (
          <div className="app-card p-4 text-center text-muted">
            <i className="bi bi-inbox fs-3 d-block mb-2"></i>
            No entries yet. Add your first one above.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2 mb-4">
            {displayEntries.map(({ entry, originalIndex }) => {
              const change = getChange(originalIndex);
              return (
                <div key={originalIndex} className="app-card p-3 d-flex justify-content-between align-items-center gap-3">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{formatDate(entry)}</div>
                    {entry.note && <div className="text-muted small">{entry.note}</div>}
                  </div>

                  <div className="text-end">
                    <div className="h5 mb-0" style={{ color: 'var(--accent)' }}>{entry.weight} kg</div>
                    {change !== null && (
                      <div className="small text-muted">
                        {change === 0 ? (
                          'No change'
                        ) : (
                          <>
                            <i className={`bi ${change < 0 ? 'bi-arrow-down' : 'bi-arrow-up'} me-1`}></i>
                            {Math.abs(change).toFixed(1)} kg
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-warm btn-sm"
                    onClick={() => handleDelete(originalIndex)}
                    aria-label="Delete entry"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
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

export default Progress;