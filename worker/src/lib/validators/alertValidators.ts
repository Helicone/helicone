import Joi from "joi";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";

const thirtySecondsInMs = 30 * 1000; // 30 seconds in milliseconds
const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // Roughly one month in milliseconds

export function validateAlertCreate(
  alert: Database["public"]["Tables"]["alert"]["Insert"]
): Result<null, string> {
  const alertSchema = Joi.object({
    created_at: Joi.string().isoDate().optional(),
    id: Joi.string().uuid().optional(),
    name: Joi.string().required(),
    org_id: Joi.string().uuid().required(),
    threshold: Joi.number().min(0).required(),
    time_window: timePeriodValidator.required(),
    metric: Joi.string().valid("response.status").insensitive().required(),
    updated_at: Joi.string().isoDate().optional(),
    emails: Joi.array()
      .items(Joi.string().email({ tlds: false }))
      .min(1)
      .required(),
  });

  const { error, value } = alertSchema.validate(alert);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

const timePeriodValidator = Joi.number().custom((value, helpers) => {
  if (value < thirtySecondsInMs || value > oneMonthInMs) {
    return helpers.error("any.invalid");
  }
  return value;
}, "Time Period Validation");
