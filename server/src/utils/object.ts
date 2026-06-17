export const isPlainObject = (value: unknown): value is Record<string, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
};

export const unique = <T>(values: T[]) => [...new Set(values)];

export const setNestedValue = (target: Record<string, unknown>, path: string[], value: unknown) => {
  let current = target;

  for (const [index, key] of path.entries()) {
    if (index === path.length - 1) {
      current[key] = value;
      return target;
    }

    if (!isPlainObject(current[key])) {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  return target;
};

export const mergeDeep = <T extends Record<string, unknown>>(...objects: unknown[]): T => {
  const target: Record<string, unknown> = {};

  for (const object of objects) {
    if (!isPlainObject(object)) {
      continue;
    }

    mergeInto(target, object);
  }

  return target as T;
};

const mergeInto = (target: Record<string, unknown>, source: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      mergeInto(target[key] as Record<string, unknown>, value);
      continue;
    }

    target[key] = value;
  }
};
