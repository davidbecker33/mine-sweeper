/**
 * Joins the keys of `conditions` whose value is truthy into a className
 * string, e.g. classNames({ active: true, hidden: false }) -> "active".
 *
 * Previously ran each value through `eval()`, which is pointless (callers
 * already pass evaluated booleans, never strings to evaluate) and was
 * flagged by the bundler as a security/minification hazard.
 */
export function classNames(conditions: Record<string, boolean>): string {
  const classes: string[] = [];
  for (const key in conditions) {
    if (conditions[key]) {
      classes.push(key);
    }
  }
  return classes.join(' ');
}
