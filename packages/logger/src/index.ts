import type { Message } from "roarr";
import { logLevels, Roarr, ROARR } from "roarr";

// @ts-expect-error - no types
const isBrowser = typeof window !== "undefined";
// export const withLogfile = (logfile: string) =>
//   new pino.transports.File({ filename: logfile });

// export const withConsole = () => new pino.transports.Console();

// export const withBrowserConsole = () => new BrowserConsole();

enum LogLevel {
  trace = logLevels.trace,
  debug = logLevels.debug,
  info = logLevels.info,
  warn = logLevels.warn,
  error = logLevels.error,
  // error = logLevels.fatal,
}
const LogLevelToConsole = {
  [LogLevel.trace]: "trace",
  [LogLevel.debug]: "debug",
  [LogLevel.info]: "log",
  [LogLevel.warn]: "warn",
  [LogLevel.error]: "error",
  // [LogLevel.fatal]: "fatal",
};

const levelEmojis = {
  [LogLevel.trace]: "📰",
  [LogLevel.debug]: "🐛",
  [LogLevel.info]: "📜",
  [LogLevel.warn]: "⚠️",
  [LogLevel.error]: "❌",
  // [LogLevel.fatal]: "❌"
};

export interface LoggerContext {
  logLevel: LogLevel;
  name: string;
  package?: string;
  color?: string;
}
export const formatter = (ROARR.write = (input: string) => {
  const { context, message, sequence, time } = JSON.parse(
    input,
  ) as Message<LoggerContext>;
  let final = new Array<string>();
  final.push(levelEmojis[context.logLevel] ?? "❓");
  final.push(`${LogLevelToConsole[context.logLevel]?.toUpperCase()}`);
  // if (isBrowser) final.push(`color: ${levelColors[context.logLevel]};`);

  final.push(
    "[" + (context.package ? `${context.package}.` : "") + context.name + "]",
  );
  final = [final.join(" ")];
  // if (isBrowser)
  //   final.push(`background-color: ${context.color ?? "lavender"};`);

  final.push(message.trim());
  final.push("-", new Date(time).toISOString());

  if (sequence) final.push(`[${sequence}]`);

  const logger =
    console[
      (LogLevelToConsole[context.logLevel] ?? "log") as keyof typeof LogLevel
    ];

  logger(...final);
});
export const createChild = (
  name?: string,
  config?: {
    // transports?: pino.TransportMultiOptions[];
    // format?: pino.Logform.Format;
    level?: string;
  },
) => Roarr.child({ name, config });

export { Roarr as logger };
