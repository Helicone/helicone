var fn = new Intl.Collator(0, { numeric:1 }).compare;

module.exports = function (a, b, bool) {
	a = a.split('.');
	b = b.split('.');

	return fn(a[0], b[0]) || fn(a[1], b[1]) || (
		b[2] = b.slice(2).join('.'),
		bool = /[.-]/.test(a[2] = a.slice(2).join('.')),
		bool == /[.-]/.test(b[2]) ? fn(a[2], b[2]) : bool ? -1 : 1
	);
}
