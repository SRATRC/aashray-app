export type Question = {
  id: string | number;
  type: 'rating' | 'text' | 'boolean';
  text: string;
  translatedText?: string;
  placeholder?: string;
  translatedPlaceholder?: string;
  booleanLabels?: [string, string];
  translatedBooleanLabels?: [string, string];
  optional?: boolean;
};

export type AnswerValue = number | string | boolean;

export type SteppedFeedbackProps = {
  questions: Question[];
  onSubmit: (answers: Record<string | number, AnswerValue>) => void;
  onBack?: () => void;
  onClose?: () => void; // quit the feedback flow at any time
  onDismiss?: () => void; // called on tap or auto-dismiss of success screen
  accentColor?: string;
  accentForeground?: string; // text color on accent backgrounds (pills, button)
  backgroundColor?: string;
  ratingLabels?: [string, string];
  successTitle?: string;
  successSubtitle?: string;
};
