import { ConfigService, ConfigServiceOptions } from "$config-service";
import type { Class } from "$types";

export type { ConfigServiceOptions } from "$config-service";

export class CachedConfigService extends ConfigService {
  private _cache: Map<
    string | undefined,
    Map<Class<object> | undefined, unknown>
  > = new Map();

  constructor(
    config: Record<string, unknown>,
    options: ConfigServiceOptions = {},
  ) {
    super(config, options);
  }

  public override async get<T extends object>(
    key?: string | undefined,
    cls?: Class<T>,
  ): Promise<T | undefined> {
    // Find if there is a cached value for the key and class
    const cachedClassMap = this._cache.get(key);
    if (cachedClassMap) {
      const value = cachedClassMap.get(cls);
      if (value) return value as T;
    }

    // If not, retrieve the value from the base class
    const value = await super.get(key, cls);

    // Then cache the value for the key and class
    const newClassMap = new Map<Class<object> | undefined, unknown>();
    newClassMap.set(cls, value);
    this._cache.set(key, newClassMap);

    return value;
  }
}
