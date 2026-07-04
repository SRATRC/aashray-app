module.exports = {
  root: true,
  extends: ['universe/native'],
  overrides: [
    // Design-system code (src/design/**) is where the Sanctuary conventions are
    // enforced. Existing app code (src/app/**, src/components/**, etc.) still
    // uses raw TouchableOpacity / hex colors and is intentionally NOT covered
    // by these rules yet — that migration happens incrementally, screen by
    // screen, as each screen is ported onto the design system.
    {
      files: ['src/design/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['TouchableOpacity', 'TouchableHighlight'],
                message: 'Use <Touchable> from @/src/design instead.',
              },
            ],
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]',
            message: 'No raw hex. Use a token from @/src/design/tokens.',
          },
        ],
      },
    },
    // Token source files and tests legitimately contain raw hex literals
    // (that's where hex values are defined, and tests may assert against them).
    {
      files: ['src/design/tokens/**', '**/*.test.*', '**/__tests__/**'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
