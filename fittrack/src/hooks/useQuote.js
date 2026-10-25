import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Async state example: loads quotes from /quotes.json and exposes
 * loading / error / success states plus retry & "next quote" helpers.
 */
export default function useQuote() {
  const [state, setState] = useState({ status: 'loading', quotes: [], index: 0, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // small delay so the loading spinner is visible
        await new Promise((resolve) => setTimeout(resolve, 600));
        const res = await axios.get('/quotes.json', { timeout: 5000 });
        if (!Array.isArray(res.data) || res.data.length === 0) {
          throw new Error('The quote list is empty.');
        }
        if (!cancelled) {
          setState({
            status: 'success',
            quotes: res.data,
            index: Math.floor(Math.random() * res.data.length),
            error: '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, status: 'error', error: err.message || 'Could not load quotes.' }));
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    setAttempt((a) => a + 1);
  };

  const next = () => {
    setState((s) => (s.quotes.length ? { ...s, index: (s.index + 1) % s.quotes.length } : s));
  };

  return {
    status: state.status,
    error: state.error,
    quote: state.quotes[state.index] || null,
    retry,
    next,
  };
}
