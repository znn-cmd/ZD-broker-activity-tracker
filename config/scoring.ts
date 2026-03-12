/** Default pace thresholds: green >= 100%, yellow >= 80%, red < 80%. */
export const DEFAULT_PACE_THRESHOLD_GREEN = 100;
export const DEFAULT_PACE_THRESHOLD_YELLOW = 80;

export function getPaceStatus(
  pacePct: number | null,
  greenThreshold = DEFAULT_PACE_THRESHOLD_GREEN,
  yellowThreshold = DEFAULT_PACE_THRESHOLD_YELLOW,
): "green" | "yellow" | "red" | "none" {
  if (pacePct == null) return "none";
  if (pacePct >= greenThreshold) return "green";
  if (pacePct >= yellowThreshold) return "yellow";
  return "red";
}
