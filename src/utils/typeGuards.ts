export const isString = (v: unknown): v is string => typeof v === "string";
export const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
export const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter(isString) : [];
