import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a date for display in meeting lists
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatMeetingDate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  }
  
  return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
};

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`;
  }
  
  return `${remainingSeconds}s`;
};

/**
 * Format duration for detailed display (includes seconds)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDetailedDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [hours, minutes, remainingSeconds]
    .map(val => val.toString().padStart(2, '0'))
    .join(':');
};

/**
 * Format time for transcript timestamps
 * @param {number} seconds - Time in seconds from start
 * @returns {string} Formatted timestamp (mm:ss or h:mm:ss)
 */
export const formatTranscriptTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Format date for file export names
 * @param {string|Date} date - Date to format
 * @returns {string} File-safe date string
 */
export const formatFileDate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd_HH-mm');
};

/**
 * Get time range for a meeting
 * @param {string|Date} startTime - Meeting start time
 * @param {string|Date} endTime - Meeting end time
 * @returns {string} Time range string
 */
export const formatTimeRange = (startTime, endTime) => {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
  
  const startStr = format(start, 'h:mm a');
  const endStr = format(end, 'h:mm a');
  
  return `${startStr} - ${endStr}`;
};

/**
 * Check if a date is within the last N days
 * @param {string|Date} date - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within the last N days
 */
export const isWithinLastDays = (date, days) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffTime = now - dateObj;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays <= days;
}; 