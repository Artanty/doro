export const countPrc = (len: number, cur: number): number => {
  const result = (cur && len)
    ? ((cur / len) * 100)
    : 0;
  return Math.round(result)
}