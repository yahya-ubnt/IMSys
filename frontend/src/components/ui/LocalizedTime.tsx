"use client";

import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

interface LocalizedTimeProps {
  date: string | Date | undefined | null;
  formatString?: string;
}

const LocalizedTime = ({ date, formatString = "PPpp" }: LocalizedTimeProps) => {
  if (!date) {
    return <span>N/A</span>;
  }

  try {
    // 1. Get the user's browser timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // 2. Convert the incoming UTC date to a date object in the user's timezone
    const zonedDate = utcToZonedTime(new Date(date), timeZone);
    
    // 3. Format the zoned date for display
    const output = format(zonedDate, formatString, { timeZone });

    return <span>{output}</span>;
  } catch (error) {
    console.error("Error formatting date:", error);
    // Fallback for invalid dates
    return <span>Invalid Date</span>;
  }
};

export default LocalizedTime;