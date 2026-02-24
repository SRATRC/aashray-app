import type { Question } from '@/src/components/SteppedFeedback/types';

export const UTSAV_QUESTIONS: Question[] = [
  { id: 'accommodation', type: 'rating', text: 'How would you rate the accommodation?' },
  { id: 'qr_system', type: 'rating', text: 'How convenient was the QR code system?' },
  { id: 'food', type: 'rating', text: 'How was the food quality & variety?' },
  { id: 'program', type: 'rating', text: 'How was the program structure & engagement?' },
  { id: 'volunteers', type: 'rating', text: 'How would you rate the volunteer performance?' },
  { id: 'infrastructure', type: 'rating', text: 'How was the infrastructure?' },
  { id: 'decor', type: 'rating', text: 'How was the decor?' },
  { id: 'transport_int', type: 'rating', text: 'How was the internal transport coordination?' },
  {
    id: 'transport_raj',
    type: 'rating',
    text: 'How was the Raj Pravas transport (Mumbai \u2192 Venue)?',
  },
  { id: 'sparsh', type: 'rating', text: 'How was the Sparsh performance?' },
  { id: 'av_setup', type: 'rating', text: 'How was the audio-visual setup?' },
  {
    id: 'loved',
    type: 'text',
    text: 'What did you love the most about this Utsav?',
    placeholder: 'Write freely\u2026',
    optional: true,
  },
  {
    id: 'suggestions',
    type: 'text',
    text: 'Any suggestions for improvement?',
    placeholder: 'Every thought counts\u2026',
    optional: true,
  },
];
