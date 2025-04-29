
/**
 * Represents a scheduled event.
 */
export interface Event {
  /**
   * The title or name of the event.
   */
  title: string;
  /**
   * The start date and time of the event as an ISO 8601 UTC string (e.g., "2025-04-28T10:00:00Z").
   */
  startTime: string;
  /**
   * The end date and time of the event as an ISO 8601 UTC string (e.g., "2025-04-28T11:00:00Z").
   */
  endTime: string;
  /**
   * An optional description or details about the event.
   */
  description: string;
}
