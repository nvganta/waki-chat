export interface Alarm {
  id?: string;
  userId: string;
  time: string;
  days: number[];
  enabled: boolean;
  label: string;
  snoozeEnabled: boolean;
  snoozeDuration: number;
}
