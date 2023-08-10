// deno-lint-ignore-file no-explicit-any
import {
    RuntimeVal,
    NullVal,
    BooleanVal,
    NumberVal,
    StringVal,
    ObjectVal,
    MK_NULL,
    MK_BOOL,
} from '../runtime/values.ts';

    // Generated *mostly* by ChatGPT, lmao.
  
  export function convertToObject(input: any): RuntimeVal {
    if (typeof input === 'object' && input !== null) {
      const propertiesMap = new Map<string, RuntimeVal>();
  
      for (const key in input) {
        propertiesMap.set(key, convertToObject(input[key]));
      }
  
      return {
        type: 'object',
        properties: propertiesMap,
      } as ObjectVal;
    } else if (input === null) {
      return {
        type: 'null',
        value: null,
      } as NullVal;
    } else if (typeof input === 'boolean') {
      return {
        type: 'boolean',
        value: input,
      } as BooleanVal;
    } else if (typeof input === 'number') {
      return {
        type: 'number',
        value: input,
      } as NumberVal;
    } else if (typeof input === 'string') {
      return {
        type: 'string',
        value: input,
      } as StringVal;
    } else {
      throw new Error('Unsupported value type.');
    }
  }
  
  export function convertToOriginal(input: any): any {
    if (input.type === 'object') {
      const originalObject: { [key: string]: any } = {};
  
      input.properties.forEach((value: any, key: string) => {
        originalObject[key] = convertToOriginal(value);
      });
  
      return originalObject;
    } else if (input.type === 'null') {
      return MK_NULL();
    } else if (input.type === 'boolean') {
        return MK_BOOL(input.value);
    } else if (input.type === 'number') {
      return input.value;
    } else if (input.type === 'string') {
      return input.value;
    } else {
      throw new Error('Unsupported value type in helper function, if you see this please report it as this should not be happening if your objects are formatted correctly.');
    }
}

export function areObjectsEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
      return false;
  }

  for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
          return false;
      }
  }

  return true;
}
