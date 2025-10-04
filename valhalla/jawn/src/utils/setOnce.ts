export class SetOnce {
  private _values: any = {};
  private _isSet: any = {};

  constructor() {
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (Reflect.has(target._isSet, prop) && target._isSet[prop]) {
          throw new Error(
            `Property ${String(prop)} is already set and cannot be modified.`,
          );
        }
        target._values[prop] = value;
        target._isSet[prop] = true;
        return true; // indicate success
      },
      get: (target, prop) => {
        if (Reflect.has(target._values, prop)) {
          return target._values[prop];
        }
        return (target as any)[prop]; // default behavior
      },
    });
  }
}
