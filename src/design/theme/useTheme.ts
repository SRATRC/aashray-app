import { useContext } from 'react';
import { ThemeCtx } from './ThemeProvider';

export const useTheme = () => useContext(ThemeCtx);
