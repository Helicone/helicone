const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Returns the short US date format (month and day) from a given date string.
 * @param value - The date string to convert.
 * @returns The formatted date string in the format "Month Day".
 */
const getUSDateShort = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
};

/**
 * Formats a given date into a US date format.
 * @param date - The date to be formatted.
 * @returns The formatted date string.
 */
const getUSDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  let formattedDate = date.toLocaleString("en-US", options);
  // Remove the year and 'at' from the string
  formattedDate = formattedDate
    .replace(", " + date.getFullYear(), "")
    .replace(" at", "");

  return formattedDate;
};

/**
 * Converts a string value to a US date format.
 * @param value - The string value representing a date.
 * @returns The US date format string.
 */
const getUSDateFromString = (value: string) => {
  const date = new Date(value);
  return getUSDate(date);
};

/**
 * Converts a given string value to a US date format with minimum precision.
 * @param value - The string value representing a date.
 * @returns The formatted US date with minimum precision.
 */
const getUSDateMin = (value: string) => {
  const date = new Date(value);
  const day = date.getDate();
  return `${date.getMonth()}/${day}/${date
    .getFullYear()
    .toString()
    .slice(-2)}, ${date.toLocaleTimeString().slice(0, -6)} ${date
    .toLocaleTimeString()
    .slice(-2)}`;
};

/**
 * Capitalizes the first letter of each word in a string.
 *
 * @param str - The input string.
 * @returns The input string with the first letter of each word capitalized.
 */
const capitalizeWords = (str: string) => {
  // replace underscores with spaces
  const strWithSpaces = str.replace(/_/g, " ");

  // split the string into an array of words
  const words = strWithSpaces.split(" ");

  // map over each word and capitalize the first letter
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );

  // join the capitalized words back into a single string
  return capitalizedWords.join(" ");
};

/**
 * Removes leading whitespace from a string.
 * @param str - The input string.
 * @returns The string with leading whitespace removed.
 */
function removeLeadingWhitespace(str: string | null): string {
  if (typeof str !== "string") return "";
  return str.replace(/^\s+/, ""); // Replace one or more whitespace characters at the beginning of the string with an empty string
}

export {
  getUSDateFromString,
  getUSDate,
  getUSDateShort,
  capitalizeWords,
  removeLeadingWhitespace,
  getUSDateMin,
};
