export function formatTimeString(timeString) {
    return new Date(timeString).toISOString().replace("Z", "");
}
export function formatTimeStringDateTime(timeString) {
    const date = new Date(timeString);
    return date.toISOString().split(".")[0].replace("T", " ");
}
