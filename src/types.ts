export type Class<out T> = new (...args: unknown[]) => T extends object
  ? T
  : never;
