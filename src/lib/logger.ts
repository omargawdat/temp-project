type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";

const isDev = process.env.NODE_ENV !== "production";
const minLevel: LogLevel = isDev ? "debug" : "info";

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  const entry = formatEntry(level, message, meta);

  if (isDev) {
    const color = LEVEL_COLORS[level];
    const tag = `${color}[${level.toUpperCase()}]${RESET}`;
    const ts = `\x1b[90m${entry.timestamp}${RESET}`;
    const rest = meta && Object.keys(meta).length > 0
      ? ` ${JSON.stringify(meta)}`
      : "";
    const out = `${ts} ${tag} ${message}${rest}`;
    if (level === "error") console.error(out);
    else if (level === "warn") console.warn(out);
    else console.log(out);
  } else {
    const out = JSON.stringify(entry);
    if (level === "error") console.error(out);
    else if (level === "warn") console.warn(out);
    else console.log(out);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
