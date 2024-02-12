import PCancelable from 'p-cancelable';
import {Options as PSomeOptions} from 'p-some';

export type Value<ValueType> = ValueType | PromiseLike<ValueType>;
export type Options<ValueType> = Omit<PSomeOptions<ValueType>, 'count'>; // eslint-disable-line @typescript-eslint/ban-types
export type CancelablePromise<ValueType> = PCancelable<ValueType>;

/**
Wait for any promise to be fulfilled.

@param input - An `Iterable` collection of promises/values to wait for.
@returns A [cancelable `Promise`](https://github.com/sindresorhus/p-cancelable) that is fulfilled when any promise from `input` is fulfilled. If all the input promises reject, it will reject with an [`AggregateError`](https://github.com/sindresorhus/aggregate-error) error.

@example
```
import pAny from 'p-any';
import got from 'got';

const first = await pAny([
	got.head('https://github.com').then(() => 'github'),
	got.head('https://google.com').then(() => 'google'),
	got.head('https://twitter.com').then(() => 'twitter'),
]);

console.log(first);
//=> 'google'
```
 */
export default function pAny<ValueType>(
	input: Iterable<Value<ValueType>>,
	options?: Options<ValueType>
): CancelablePromise<ValueType>;

export {AggregateError} from 'p-some';
