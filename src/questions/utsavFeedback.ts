import type { Question } from '@/src/components/SteppedFeedback/types';

export const UTSAV_QUESTIONS: Question[] = [
  {
    id: 'event_rating',
    type: 'rating',
    text: 'Overall Event Rating',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'Accommodation Rating',
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'Food Rating',
  },
  {
    id: 'program_rating',
    type: 'rating',
    text: 'Program Rating',
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'Things you loved the most',
    placeholder: 'Write freely…',
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Things you want to improve',
    placeholder: 'Every thought counts…',
  },
];