/**
 * Create a subclass that can be modified without affecting the super class.
 *
 * @template {{prototype: object, new (...args: any[]): any}} Class
 * @param {Class} Super
 * @return {Class}
 */
export function unherit<
  Class extends {
    new (...args: any[]): any
    prototype: object
  }
>(Super: Class): Class
