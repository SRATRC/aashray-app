import moment from 'moment';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const todayKey = () => moment().format('YYYY-MM-DD');

/**
 * Today's date as YYYY-MM-DD, kept current. Screens that turn dates into words
 * ("checking in tomorrow") put this in their memo dependencies, so the words
 * are recomputed when the day changes instead of staying frozen at the day the
 * screen first rendered. It ticks at the next local midnight and also when the
 * app returns to the foreground, because timers do not run while suspended.
 */
export default function useToday(): string {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => setToday(todayKey());

    const schedule = () => {
      const msToMidnight = moment().add(1, 'day').startOf('day').diff(moment());
      // A second of slack so the tick lands after the date has really changed.
      timer = setTimeout(() => {
        sync();
        schedule();
      }, msToMidnight + 1000);
    };

    sync();
    schedule();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
