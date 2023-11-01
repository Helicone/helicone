import { Result } from "../../lib/result";
import { Database } from "../../supabase/database.types";
import Joi from "joi";

type AlertType = "Error Count" | "Cost";

type Alert = {
  id: string;
  type: AlertType;
  threshold: number;
  time_period: string;
  users: string[];
  name: string;
  created_at: Date;
  updated_at: Date;
};

type AlertHistory = {
  id: string;
  alert_id: string;
  alert_start_time: Date;
  alert_end_time?: Date;
  alert_type: AlertType;
  triggered_value: string;
  status: "Triggered" | "Resolved";
  created_at: Date;
  updated_at: Date;
};

const thirtySecondsInMs = 30 * 1000; // 30 seconds in milliseconds
const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // Roughly one month in milliseconds

const timePeriodValidator = Joi.number().custom((value, helpers) => {
  if (value < thirtySecondsInMs || value > oneMonthInMs) {
    return helpers.error("any.invalid");
  }
  return value;
}, "Time Period Validation");

function validateAlertCreate(
  alert: Database["public"]["Tables"]["alert"]["Insert"]
): Result<Database["public"]["Tables"]["alert"]["Insert"], string> {
  const alertSchema = Joi.object({
    created_at: Joi.string().isoDate().optional(),
    id: Joi.string().uuid().optional(),
    name: Joi.string().required(),
    org_id: Joi.string().uuid().required(),
    threshold: Joi.number().min(0).required(),
    time_period: timePeriodValidator.required(),
    type: Joi.string().valid("Error Count", "Cost").insensitive().required(),
    updated_at: Joi.string().isoDate().optional(),
    users: Joi.array().items(Joi.string().email()).required(),
  });

  const { error, value } = alertSchema.validate(alert);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: value, error: null };
}

function validateAlertUpdate(
  alert: Database["public"]["Tables"]["alert"]["Update"]
): Result<Database["public"]["Tables"]["alert"]["Update"], string> {
  const alertUpdateSchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().optional(),
    threshold: Joi.number().min(0).optional(),
    time_period: timePeriodValidator.optional(),
    type: Joi.string().valid("Error Count", "Cost").insensitive().optional(),
    updated_at: Joi.string().isoDate().optional(),
    users: Joi.array().items(Joi.string().email()).optional(),
  });

  const { error, value } = alertUpdateSchema.validate(alert);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: value, error: null };
}

function validateAlertDelete(alertId: string): Result<string, string> {
  const alertDeleteSchema = Joi.object({
    id: Joi.string().uuid().required(),
  });

  const { error, value } = alertDeleteSchema.validate({ id: alertId });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: value.id, error: null };
}

export type { Alert, AlertHistory };
export { validateAlertCreate, validateAlertUpdate, validateAlertDelete };
