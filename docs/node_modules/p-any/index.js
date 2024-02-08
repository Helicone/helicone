import pSome from 'p-some';
import PCancelable from 'p-cancelable';

export default function pAny(iterable, options) {
	const anyCancelable = pSome(iterable, {...options, count: 1});

	return PCancelable.fn(async onCancel => {
		onCancel(() => {
			anyCancelable.cancel();
		});

		const [value] = await anyCancelable;
		return value;
	})();
}

export {AggregateError} from 'p-some';
