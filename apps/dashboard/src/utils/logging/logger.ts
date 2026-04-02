import { ENV } from "../env-validation";
type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = ENV.NODE_ENV === "development";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
      environment: ENV.NODE_ENV || "development",
    };

    return this.isDevelopment
      ? `[${timestamp}] ${level.toUpperCase()}: ${message} ${context ? JSON.stringify(context) : ""}`
      : JSON.stringify(logEntry);
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage("error", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API Request: ${method} ${path}`, {
      type: "api_request",
      method,
      path,
      ...context,
    });
  }

  securityEvent(event: string, context?: LogContext) {
    this.warn(`Security Event: ${event}`, {
      type: "security_event",
      event,
      ...context,
    });
  }
}

export const logger = new Logger();
