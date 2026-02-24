import type { Question } from '@/src/components/SteppedFeedback/types';

export const ADHYAYAN_QUESTIONS: Question[] = [
  {
    id: 'swadhay_karta_rating',
    type: 'rating',
    text: "How would you rate the Swadhyay Karta's session?",
  },
  {
    id: 'personal_interaction_rating',
    type: 'rating',
    text: 'How was your personal interaction with the Swadhyay Karta?',
  },
  {
    id: 'swadhay_karta_suggestions',
    type: 'text',
    text: 'Any suggestions for the Swadhyay Karta to improve?',
    placeholder: 'Share your suggestions\u2026',
    optional: true,
  },
  {
    id: 'raj_adhyayan_interest',
    type: 'boolean',
    text: 'Would you attend Raj Adhyayan in the future?',
    booleanLabels: ["I'm In!", 'Not Now'],
  },
  {
    id: 'future_topics',
    type: 'text',
    text: 'What topics would you like for future Raj Adhyayan?',
    placeholder: 'Topics that interest you\u2026',
    optional: true,
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Raj Adhyayan?',
    placeholder: 'Write freely\u2026',
    optional: true,
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any other scope of improvement?',
    placeholder: 'Every thought counts\u2026',
    optional: true,
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food at the bhojanalay?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay at Research Centre?',
  },
];
