import type { Question } from '@/src/components/SteppedFeedback/types';

export const UTSAV_QUESTIONS: Question[] = [
  {
    id: 'event_rating',
    type: 'rating',
    text: 'How would you rate the Utsav overall?',
    translatedText:
      'ઉત્સવના તમારા સમગ્ર અનુભવને તમે કેટલું મૂલ્યાંકન આપશો?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay during Utsav?',
    translatedText:
      'ઉત્સવ દરમિયાન તમારો નિવાસ કેવો રહ્યો?',
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food during Utsav?',
    translatedText:
      'ઉત્સવ દરમિયાન ભોજન તમને કેવું લાગ્યું?',
  },
  {
    id: 'program_rating',
    type: 'rating',
    text: 'How would you rate the Programs in this Utsav?',
    translatedText:
      'આ ઉત્સવના કાર્યક્રમોને તમે કેટલું મૂલ્યાંકન આપશો?',
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Utsav?',
    translatedText:
      'આ ઉત્સવમાં તમને સૌથી વધુ શું ગમ્યું?',
    placeholder: 'Write freely…',
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any suggestion for improvement?',
    translatedText:
      'સમસ્ત કાર્યક્રમના સુધારા માટે કોઈ સૂચન?',
    placeholder: 'Every thought counts…',
  },
];