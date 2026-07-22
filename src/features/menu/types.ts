// src/features/menu/types.ts
export interface Meal {
  _id: string;
  meal: string;
  name: string;
  time?: string;
}

export interface MenuData {
  [date: string]: Meal[];
}
