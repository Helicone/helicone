/**
 * Create a subclass that can be modified without affecting the super class.
 *
 * @template {{prototype: object, new (...args: any[]): any}} Class
 * @param {Class} Super
 * @return {Class}
 */
export function unherit(Super) {
  const Of = class extends Super {}

  // Clone values.
  const proto = Of.prototype
  /** @type {string} */
  let key

  // We specifically want to get *all* fields, not just own fields.
  // eslint-disable-next-line guard-for-in
  for (key in proto) {
    /** @type {unknown} */
    const value = proto[key]

    if (value && typeof value === 'object') {
      // @ts-expect-error: shallow clone arrays or other values.
      proto[key] = 'concat' in value ? value.concat() : Object.assign({}, value)
    }
  }

  return Of
}
