import type { Question } from '@/src/components/SteppedFeedback/types';

export const UTSAV_QUESTIONS: Question[] = [
  {
    id: 'event_rating',
    type: 'rating',
    text: 'How would you rate the Utsav overall?',
    translatedText:
      'ઉત્સવના તમારા સમગ્ર અનુભવને તમે કેવી રીતે મૂલ્યાંકન કરશો?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay at Research Centre?',
    translatedText:
      'રિસર્ચ સેન્ટર ખાતે તમારો નિવાસ કેવો રહ્યો?',
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food at the bhojanalay?',
    translatedText:
      'ભોજનાલયનું ભોજન તમને કેવું લાગ્યું?',
  },
  {
    id: 'program_rating',
    type: 'rating',
    text: 'How would you rate the Programs in this Utsav?',
    translatedText:
      'આ ઉત્સવના કાર્યક્રમોને તમે કેવી રીતે મૂલ્યાંકન કરશો?',
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Utsav?',
    translatedText:
      'આ ઉત્સવમાં તમને સૌથી વધુ શું ગમ્યું?',
    placeholder: 'Write freely…',
    translatedPlaceholder: 'નિઃસંકોચ લખો…',
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any suggestion for improvement?',
    translatedText:
      'સુધારા માટે કોઈ સૂચન?',
    placeholder: 'Every thought counts…',
    translatedPlaceholder: 'તમારા વિચારો અમૂલ્ય છે…',
  },
];