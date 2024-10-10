export const convertToUSDateFormat = (date: string) => {
  const dateObj = new Date(date);

  const formattedDate =
    [
      ("0" + (dateObj.getMonth() + 1)).slice(-2),
      ("0" + dateObj.getDate()).slice(-2),
      dateObj.getFullYear(),
    ].join("/") +
    " " +
    [
      ("0" + dateObj.getHours()).slice(-2),
      ("0" + dateObj.getMinutes()).slice(-2),
      ("0" + dateObj.getSeconds()).slice(-2),
    ].join(":");

  return formattedDate;
};
