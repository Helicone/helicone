import { Database } from "../../../../supabase/database.types";
import { Result } from "../results";

const thirtySecondsInMs = 30 * 1000; // 30 seconds in milliseconds
const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // Roughly one month in milliseconds

export function validateAlertCreate(
  alert: Database["public"]["Tables"]["alert"]["Insert"]
): Result<null, string> {
  // Custom validator for the time period
  const isValidTimePeriod = (value: number) => {
    return value >= thirtySecondsInMs && value <= oneMonthInMs;
  };

  // Custom validator for email array
  const isValidEmailArray = (emails: string[]) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      Array.isArray(emails) && emails.every((email) => emailRegex.test(email))
    );
  };

  // Validating each field
  if (alert.created_at && !Date.parse(alert.created_at))
    return { data: null, error: "Invalid created_at date" };

  if (alert.updated_at && !Date.parse(alert.updated_at))
    return { data: null, error: "Invalid updated_at date" };

  if (!alert.name) return { data: null, error: "Name is required" };

  if (!alert.org_id) return { data: null, error: "org_id is required" };

  if (typeof alert.threshold !== "number" || alert.threshold <= 0)
    return { data: null, error: "Invalid threshold" };

  if (alert.metric === "cost" && alert.threshold < 0.01)
    return { data: null, error: "Invalid threshold" };

  if (
    alert.metric === "response.status" &&
    (alert.threshold > 100 || alert.threshold <= 0)
  )
    return { data: null, error: "Invalid threshold" };

  if (!isValidTimePeriod(alert.time_window))
    return { data: null, error: "Invalid time_window" };

  if (alert.metric !== "response.status" && alert.metric !== "cost")
    return { data: null, error: "Invalid metric" };

  if (!isValidEmailArray(alert.emails))
    return { data: null, error: "Invalid emails" };

  if (alert.status !== "resolved")
    return { data: null, error: "Invalid status" };

  return { data: null, error: null };
}
