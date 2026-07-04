// src/design/tokens/typography.ts
export type TextVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'caption'
  | 'label'
  | 'button';
export const typography: Record<
  TextVariant,
  {
    family: string;
    size: number;
    lineHeight: number;
    weight?: '400' | '500' | '600';
    tracking?: number;
    transform?: 'uppercase';
  }
> = {
  display: { family: 'Fraunces-SemiBold', size: 34, lineHeight: 40, tracking: -0.5 },
  title: { family: 'Fraunces-SemiBold', size: 26, lineHeight: 32, tracking: -0.3 },
  headline: { family: 'DMSans-SemiBold', size: 20, lineHeight: 26, tracking: -0.2 },
  subtitle: { family: 'DMSans-Medium', size: 17, lineHeight: 24 },
  body: { family: 'DMSans-Regular', size: 15, lineHeight: 22 },
  bodyStrong: { family: 'DMSans-Medium', size: 15, lineHeight: 22 },
  callout: { family: 'DMSans-Regular', size: 16, lineHeight: 24 },
  caption: { family: 'DMSans-Regular', size: 13, lineHeight: 18 },
  label: {
    family: 'DMSans-Medium',
    size: 12,
    lineHeight: 16,
    tracking: 0.6,
    transform: 'uppercase',
  },
  button: { family: 'DMSans-SemiBold', size: 16, lineHeight: 20 },
};
