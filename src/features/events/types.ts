// src/features/events/types.ts

export type AdhyayanStatus = 'open' | 'closed' | 'deleted';

export interface Adhyayan {
  id: number;
  name: string;
  speaker: string;
  start_date: string;
  end_date: string;
  location: string;
  status: AdhyayanStatus;
  amount: number;
  available_seats?: number;
  food_allowed?: boolean;
  comments?: string | null;
}

export interface UtsavPackage {
  package_id: number;
  package_name: string;
  package_start: string;
  package_end: string;
  package_amount: number;
}

export interface Utsav {
  utsav_id: number;
  utsav_name: string;
  utsav_start: string;
  utsav_end: string;
  utsav_month: string;
  utsav_location: string;
  utsav_status: string;
  registration_deadline?: string;
  packages: UtsavPackage[];
  available_seats?: number;
  comments?: string;
}

// Adhyayan feedback submit body is flat: `{ cardno, shibir_id, ...answersByQuestionId }`,
// so the answers map is keyed by question id.
export type AdhyayanFeedbackAnswers = Record<string, unknown>;

// Utsav feedback submit body carries an array of `{question_id, question_text,
// question_type, answer}` entries (one per question), not a flat map.
export interface UtsavFeedbackAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  answer: unknown;
}
