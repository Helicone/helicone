import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import posthog from "posthog-js";

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

const getUSDateShort = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
};

export async function signOut(supabaseClient: SupabaseClient<Database>) {
  await supabaseClient.auth.signOut({ scope: "global" });
  await supabaseClient.auth.signOut({ scope: "others" });
  await supabaseClient.auth.signOut({ scope: "local" });
  posthog.reset();
  return supabaseClient.auth.signOut();
}

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

const getUSDateFromString = (value: string) => {
  const date = new Date(value);
  return getUSDate(date);
};

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

const getLocalDateFormat = (date: string) => {
  const dateObj = new Date(date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;

  const localDateObj = new Date(dateObj.getTime() - tzOffset);
  const formattedDate =
    [
      ("0" + (localDateObj.getMonth() + 1)).slice(-2),
      ("0" + localDateObj.getDate()).slice(-2),
      localDateObj.getFullYear(),
    ].join("/") +
    " " +
    [
      ("0" + localDateObj.getHours()).slice(-2),
      ("0" + localDateObj.getMinutes()).slice(-2),
      ("0" + localDateObj.getSeconds()).slice(-2),
    ].join(":");

  return formattedDate;
};

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

function removeLeadingWhitespace(str: string | null): string {
  if (typeof str !== "string") return "";
  return str.replace(/^\s+/, ""); // Replace one or more whitespace characters at the beginning of the string with an empty string
}

export {
  getLocalDateFormat,
  getUSDateFromString,
  getUSDate,
  getUSDateShort,
  capitalizeWords,
  removeLeadingWhitespace,
  getUSDateMin,
};
