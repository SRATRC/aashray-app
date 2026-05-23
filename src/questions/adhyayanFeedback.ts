import type { Question } from '@/src/components/SteppedFeedback/types';

export const ADHYAYAN_QUESTIONS: Question[] = [
  {
    id: 'swadhay_karta_rating',
    type: 'rating',
    text: "How would you rate the Swadhyay Karta's session?",
    translatedText: 'સ્વાધ્યાયકર્તાઓના સેશનનું તમે કેવી રીતે મૂલ્યાંકન કરશો?',
  },
  {
    id: 'personal_interaction_rating',
    type: 'rating',
    text: 'How was your personal interaction with the Swadhyay Karta?',
    translatedText:
      'સ્વાધ્યાયકર્તા સાથેનો તમારો વ્યક્તિગત અનુભવ કેવો રહ્યો?',
  },
  {
    id: 'swadhay_karta_suggestions',
    type: 'text',
    text: 'Any suggestions for the Swadhyay Karta to improve?',
    translatedText: 'સ્વાધ્યાયકર્તાને કોઈ સુધારા માટે સૂચન?',
    placeholder: 'Share your suggestions…',
    translatedPlaceholder: 'તમારા સૂચનો જણાવો…',
    optional: true,
  },
  {
    id: 'raj_adhyayan_interest',
    type: 'boolean',
    text: 'Would you attend Raj Adhyayan in the future?',
    translatedText:
      'શું તમે ભવિષ્યમાં ફરી રાજ અધ્યયનમાં જોડાવા ઇચ્છશો?',
    booleanLabels: ['I’m In!', 'Not Now'],
    translatedBooleanLabels: ['જરૂર!', 'અત્યારે નહીં'],
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Raj Adhyayan?',
    translatedText:
      'આ રાજ અધ્યયનમાં તમને સૌથી વધુ શું ગમ્યું?',
    placeholder: 'Write freely…',
    translatedPlaceholder: 'નિઃસંકોચ લખો…',
    optional: true,
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any other scope of improvement?',
    translatedText: 'સુધારા માટે અન્ય કોઈ સૂચન?',
    placeholder: 'Every thought counts…',
    translatedPlaceholder: 'તમારા વિચારો અમૂલ્ય છે…',
    optional: true,
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food at the bhojanalay?',
    translatedText:
      'ભોજનાલયનું ભોજન તમને કેવું લાગ્યું?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay at Research Centre?',
    translatedText:
      'રિસર્ચ સેન્ટર ખાતે તમારો નિવાસ કેવો રહ્યો?',
  },
];