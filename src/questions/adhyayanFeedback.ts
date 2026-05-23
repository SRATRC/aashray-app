import type { Question } from '@/src/components/SteppedFeedback/types';

export const ADHYAYAN_QUESTIONS: Question[] = [
  {
    id: 'swadhay_karta_rating',
    type: 'rating',
    text: "How would you rate the Swadhyay Karta's session?\n\nસ્વાધ્યાયકર્તાનું સત્ર તમને કેવું લાગ્યું?",
  },
  {
    id: 'personal_interaction_rating',
    type: 'rating',
    text: 'How was your personal interaction with the Swadhyay Karta?\n\nસ્વાધ્યાયકર્તા સાથેનો તમારો વ્યક્તિગત અનુભવ કેવો રહ્યો?',
  },
  {
    id: 'swadhay_karta_suggestions',
    type: 'text',
    text: 'Any suggestions for the Swadhyay Karta to improve?\n\nસ્વાધ્યાયકર્તા માટે કોઈ સુધારા સૂચન?',
    placeholder: 'Share your suggestions… / તમારા સૂચનો જણાવો…',
    optional: true,
  },
  {
    id: 'raj_adhyayan_interest',
    type: 'boolean',
    text: 'Would you attend Raj Adhyayan in the future?\n\nશું તમે ભવિષ્યમાં ફરી રાજ અધ્યયનમાં જોડાવા ઇચ્છશો?',
    booleanLabels: ['I’m In! / જરૂર!', 'Not Now / અત્યારે નહીં'],
  },
  {
    id: 'loved_most',
    type: 'text',
    text: 'What did you love the most about this Raj Adhyayan?\n\nઆ રાજ અધ્યયનમાં તમને સૌથી વધુ શું ગમ્યું?',
    placeholder: 'Write freely… / નિઃસંકોચ લખો…',
    optional: true,
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    text: 'Any other scope of improvement?\n\nસુધારા માટે અન્ય કોઈ સૂચન?',
    placeholder: 'Every thought counts… / તમારા વિચારો અમૂલ્ય છે…',
    optional: true,
  },
  {
    id: 'food_rating',
    type: 'rating',
    text: 'How was the food at the bhojanalay?\n\nભોજનાલયનું ભોજન તમને કેવું લાગ્યું?',
  },
  {
    id: 'stay_rating',
    type: 'rating',
    text: 'How was your stay at Research Centre?\n\nરિસર્ચ સેન્ટર ખાતે તમારો રહેવો કેવો રહ્યો?',
  },
];