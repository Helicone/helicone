# p-some

> Wait for a specified number of promises to be fulfilled

Useful when you need the fastest of multiple promises.

## Install

```
$ npm install p-some
```

## Usage

Checks 4 websites and logs the 2 fastest.

```js
import got from 'got';
import pSome from 'p-some';

const input = [
	got.head('github.com').then(() => 'github'),
	got.head('google.com').then(() => 'google'),
	got.head('twitter.com').then(() => 'twitter'),
	got.head('medium.com').then(() => 'medium')
];

const [first, second] = await pSome(input, {count: 2});

console.log(first, second);
//=> 'google twitter'
```

## API

### pSome(input, options)

Returns a [cancelable `Promise`](https://github.com/sindresorhus/p-cancelable) that is fulfilled when `count` promises from `input` are fulfilled. The fulfilled value is an `Array` of the values from the `input` promises in the order they were fulfilled. If it becomes impossible to satisfy `count`, for example, too many promises rejected, it will reject with an [`AggregateError`](https://github.com/sindresorhus/aggregate-error) error.

If you pass in cancelable promises, specifically promises with a `.cancel()` method, that method will be called for the promises that are still unfulfilled when the returned `Promise` is either fulfilled or rejected.

#### input

Type: `Iterable<Promise | unknown>`

An `Iterable` collection of promises/values to wait for.

#### options

Type: `object`

##### count

*Required*\
Type: `number`\
Minimum: `1`

Number of promises from `input` that have to be fulfilled until the returned promise is fulfilled.

##### filter

Type: `Function`

Receives the value resolved by the promise. Used to filter out values that doesn't satisfy a condition.

### AggregateError

Exposed for instance checking.

### FilterError

Exposed for instance checking.

## Related

- [p-any](https://github.com/sindresorhus/p-any) - Wait for any promise to be fulfilled
- [p-one](https://github.com/kevva/p-one) - Return `true` if any promise passes a testing function, similar to `Array#some`
- [More…](https://github.com/sindresorhus/promise-fun)
