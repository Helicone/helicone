import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import prettyBytes from "pretty-bytes";
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

export const formatTimeAgo = (date: Date): string => {
	const result = timeAgo.format(date);
	return Array.isArray(result) ? result[0] : result;
};

export const formatBytes = (bytes: number): string => {
	return prettyBytes(bytes);
};
