// Wake-up pacing adapted from WakeUpChat's integrated voice agent.
export type WakeUpStyle = 'gentle' | 'moderate' | 'assertive';

const instructions: Record<WakeUpStyle, string> = {
  gentle: 'Wake them gradually. Speak softly, slowly, and calmly.',
  moderate: 'Be friendly and encouraging, with a balanced energy level.',
  assertive: 'Be energetic and motivating while remaining respectful.',
};

export function isWakeUpStyle(value: unknown): value is WakeUpStyle {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(instructions, value);
}

export function wakeUpInstructions(value: unknown): string {
  return instructions[isWakeUpStyle(value) ? value : 'moderate'];
}
