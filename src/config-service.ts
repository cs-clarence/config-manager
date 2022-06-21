import {
  getValueFromNestedObject,
  transformKeysRecursive,
  transformObjectKeyCaseToClassKeyCase,
} from "$util";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import type { Class } from "$types";

export type ConfigServiceOptions = {
  /**
   * If true, ConfigService will treat keys as case-sensitive.
   *
   * @default false
   */
  caseSensitiveKeys?: boolean;

  /**
   * If true, ConfigService will use class-validator to validate fields.
   *
   * `NOTE:` You will need to install `class-transformer` and `class-validator` package to use this option.
   *
   * @default true
   */
  validateClass?: boolean;

  /**
   * If true, ConfigServiceBuilder will remove underscores from keys.
   *
   * @default false
   */
  removeKeyUnderscores?: boolean;

  /**
   * If true, ConfigServiceBuilder will remove dashes from keys.
   *
   *  @default false
   */
  removeKeyHyphens?: boolean;
};

export class ConfigService {
  private _options: Required<ConfigServiceOptions>;

  constructor(
    private _config: Record<string, unknown>,
    options: ConfigServiceOptions = {},
  ) {
    const defaultOptions: Required<ConfigServiceOptions> = {
      removeKeyHyphens: false,
      removeKeyUnderscores: false,
      caseSensitiveKeys: false,
      validateClass: true,
    };

    this._options = { ...defaultOptions, ...options };

    if (this._options.removeKeyUnderscores) {
      this._config = transformKeysRecursive(this._config, (key) =>
        key.replace("_", ""),
      );
    }

    if (this._options.removeKeyHyphens) {
      this._config = transformKeysRecursive(this._config, (key) =>
        key.replace("-", ""),
      );
    }
  }

  public async get<T extends object>(
    key?: string,
    cls?: Class<T>,
  ): Promise<T | undefined> {
    let value: Record<string, unknown> | undefined = this._config;

    key = key ?? "";

    if (!this._options.caseSensitiveKeys) key = key.toLowerCase();

    value = getValueFromNestedObject(key, value, {
      caseInsensitive: !this._options.caseSensitiveKeys,
    }) as Record<string, unknown> | undefined;

    if (typeof value !== "object") return value;

    if (cls) {
      value = transformObjectKeyCaseToClassKeyCase(value, cls);
      value = plainToInstance(cls, value) as Record<string, unknown>;

      if (this._options.validateClass) {
        const errors = await validate(value);
        if (errors.length > 0) {
          throw new Error(`Invalid config: ${JSON.stringify(errors)}`);
        }
      }
    }

    return value as T;
  }
}
