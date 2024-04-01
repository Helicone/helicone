/**
 * a function that takes an array of strings in `key:value` format
 * (typically from yargs or config) and returns back
 * a neat object with the keys and values
 */
export function collectKeyValues(array?: string[]) {
	return (
		array?.reduce<Record<string, string>>((recordsToCollect, v) => {
			const [key, ...value] = v.split(":");
			recordsToCollect[key] = value.join(":");
			return recordsToCollect;
		}, {}) || {}
	);
}
