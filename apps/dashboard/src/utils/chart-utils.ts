/**
 * Ensures chart data always has 2+ points so Recharts draws connected lines.
 * When there's only 1 data point, prepends a synthetic point at the "left edge"
 * with the same Y values, creating a solid line from left to the dot.
 */
export function padChartData<T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date",
): T[] {
  if (!data || data.length === 0) return data;
  if (data.length >= 2) return data;

  // Single point — create a synthetic left-edge point with same values
  const point = data[0];
  const syntheticDate = (() => {
    const val = point[dateKey];
    if (!val) return "";
    // If it's an ISO date string, subtract 1 hour
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return new Date(d.getTime() - 3600000).toISOString();
      }
    } catch {}
    // If it's a formatted string like "Apr 7", prepend a space to make it sort first
    return " ";
  })();

  const synthetic = { ...point, [dateKey]: syntheticDate, _synthetic: true };
  return [synthetic as T, point];
}
