
/**
 * Represents a scheduled event.
 */
export interface Event {
  /**
   * The title or name of the event.
   */
  title: string;
  /**
   * The start date and time of the event.
   * Can be a Date object or an ISO 8601 string.
   */
  startTime: Date | string;
  /**
   * The end date and time of the event.
   * Can be a Date object or an ISO 8601 string.
   */
  endTime: Date | string;
  /**
   * An optional description or details about the event.
   */
  description: string;
}
