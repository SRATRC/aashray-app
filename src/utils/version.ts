export const parseVersion = (v?: string): number[] => {
  if (!v) return [0];
  return v
    .split('.')
    .map((seg) => parseInt(seg, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));
};

export const compareVersions = (a?: string, b?: string): number => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const maxLen = Math.max(pa.length, pb.length);
  for (let i = 0; i < maxLen; i++) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
};

export const isNewerVersion = (candidate?: string, current?: string): boolean => {
  return compareVersions(candidate, current) === 1;
};

