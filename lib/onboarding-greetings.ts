/**
 * Warm, varied greetings for the onboarding chat. Kept server-safe (no "use
 * client") so the greeting can be picked during server render and passed down
 * as a prop — that way SSR and client agree and there's no hydration flicker.
 */
export const ONBOARDING_GREETINGS = [
  "👋 Hey there",
  "✨ Good to see you",
  "☕ Pull up a chair",
  "🚀 Let's build something great",
  "💡 Love that you're here",
  "🔭 Let's map it out together",
  "🎨 Fresh canvas, fresh ideas",
  "🌟 So glad you dropped by",
  "🧠 Architect mode, engaged",
];

export function pickOnboardingGreeting(): string {
  return ONBOARDING_GREETINGS[
    Math.floor(Math.random() * ONBOARDING_GREETINGS.length)
  ];
}
