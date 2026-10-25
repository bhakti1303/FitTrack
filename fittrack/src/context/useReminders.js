import { useContext } from 'react';
import { RemindersContext } from './RemindersContext';

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside <RemindersProvider>');
  return ctx;
}
