import type { Question } from '@/src/components/SteppedFeedback/types';

export const UTSAV_QUESTIONS: Question[] = [
  {
    id: 'event_rating',
    type: 'rating',
    text: 'How would you rate the Utsav overall?\n\nઉત્સવનો સમગ્ર અનુભવ તમને કેવો લાગ્યો?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay at Research Centre?\n\nરિસર્ચ સેન્ટર ખાતે તમારો રહેવો કેવો રહ્યો?',
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food at the bhojanalay?\n\nભોજનાલયનું ભોજન તમને કેવું લાગ્યું?',
  },
  {
    id: 'program_rating',
    type: 'rating',
    text: 'How would you rate the Programs in this Utsav?\n\nઆ ઉત્સવના કાર્યક્રમો તમને કેવા લાગ્યા?',
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Utsav?\n\nઆ ઉત્સવમાં તમને સૌથી વધુ શું ગમ્યું?',
    placeholder: 'Write freely… / નિઃસંકોચ લખો…',
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any other scope of improvement?\n\nસુધારા માટે અન્ય કોઈ સૂચન?',
    placeholder: 'Every thought counts… / તમારા વિચારો અમૂલ્ય છે…',
  },
];	