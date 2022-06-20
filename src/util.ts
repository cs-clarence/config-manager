import type { Class } from "$types";
import mergeDeep from "merge-deep";

export function transformKeysRecursive(
  object: object,
  keyTransformer: (key: string) => string,
): Record<string, unknown> {
  const transformedObject: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(object)) {
    if (typeof value === "object" && value !== null) {
      transformedObject[keyTransformer(key)] = transformKeysRecursive(
        value,
        keyTransformer,
      );
    } else {
      transformedObject[keyTransformer(key)] = value;
    }
  }

  return transformedObject;
}

export function transformToNestedObject(
  object: Record<string, unknown>,
  nestingIndicator = "__",
): Record<string, unknown> {
  let transformedObject: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(object)) {
    const propNames = key.split(nestingIndicator);

    // If the key doesn't have any nesting indicators, just add it to the transformed object.
    if (propNames.length === 1) {
      transformedObject[key] = value;
      continue;
    }

    // If the key has nesting indicators, transform it.
    const rootObject: Record<string, unknown> = {};
    let currentObject: Record<string, unknown> = rootObject;
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i] as string;

      if (i === propNames.length - 1) {
        currentObject[propName] = value;
      } else {
        currentObject[propName] = {};
        currentObject = currentObject[propName] as Record<string, unknown>;
      }
    }

    transformedObject = mergeDeep(transformedObject, rootObject);
  }

  return transformedObject;
}

function isStringRecord(object: unknown): object is Record<string, unknown> {
  return typeof object === "object" && object !== null;
}

function toLowerCaseKeys(
  object: Record<string, unknown>,
): Record<string, unknown> {
  const transformedObject: Record<string, unknown> = { ...object };

  Object.entries(transformedObject).forEach(([key, value]) => {
    delete transformedObject[key];
    transformedObject[key.toLowerCase()] = value;
  });

  return transformedObject;
}

export function getValueFromNestedObject(
  key: string,
  object: Record<string, unknown>,
  option = { caseInsensitive: false },
): unknown | undefined {
  const keys = key.split(".");

  let record = { ...object };

  if (key === "") return record;

  for (let index = 0; index < keys.length; ++index) {
    if (!isStringRecord(record) && index === keys.length - 1) {
      return undefined;
    }

    let key = keys[index] as string;

    if (option.caseInsensitive) {
      key = key.toLowerCase();
      record = toLowerCaseKeys(record);
    }

    record = record[key] as Record<string, unknown>;

    if (typeof record === "undefined") return undefined;
  }

  return record;
}

export function transformObjectKeyCaseToClassKeyCase<T extends object>(
  object: Record<string, unknown>,
  cls: Class<T>,
) {
  const transformedObject: Record<string, unknown> = {};

  object = toLowerCaseKeys(object);

  const classKeys = Object.getOwnPropertyNames(new cls());

  for (const key of classKeys) {
    transformedObject[key] = object[key.toLowerCase()];
  }

  return transformedObject;
}
