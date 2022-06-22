import fs from "fs";
import jsYaml from "js-yaml";
import JSON5 from "json5";
import dotenv from "dotenv";
import mergeDeep from "merge-deep";
import {
  CachedConfigService as ConfigService,
  ConfigServiceOptions,
} from "$cached-config-service";
import { transformToNestedObject } from "$util";

type ValidatorFunction = (value: Record<string, unknown>) => boolean;

type AddConfigArgs = {
  /**
   * A function that will check if the config object parsed from the file is valid.
   * The function should return a boolean indicating if the config object is valid.
   */
  validator?: ValidatorFunction;

  /**
   * The namespace to use for the object. The object will be added to the
   * config object as a property named after the namespace.
   */
  namespace?: string;
};

type AddObjectConfigArgs = AddConfigArgs & WithNesting;

type AddFileConfigArgs = AddConfigArgs & {
  /**
   * The path to the file to add.
   */
  filePath: string;
};

type AddDotEnvFileConfigArgs = AddFileConfigArgs & WithNesting;

type WithLoader = {
  loader: (filePath: string) => Record<string, unknown>;
};

type WithNesting = {
  /**
   * Interpret variables as with a double underscore (__) as an indicator of nesting.
   *
   * ### EXAMPLE:
   *
   * If the config contains a key named `FOO__BAR=baz`, the value of the
   * config object will have a property named `FOO` which is an object containing
   * a property named `BAR` with the value `baz`.
   *
   */
  nesting?: boolean;
};

type ObjectConfigJob = AddObjectConfigArgs & {
  type: "object-load-job";
  object: Record<string, unknown>;
};

type ConfigFileLoadJob = AddFileConfigArgs &
  WithLoader & {
    type: "config-file-load-job";
  };

type DotEnvConfigFileLoadJob = AddDotEnvFileConfigArgs &
  WithLoader & {
    type: "dot-env-config-file-load-job";
  };

export class ConfigServiceBuilder {
  private _jobs: (
    | ConfigFileLoadJob
    | DotEnvConfigFileLoadJob
    | ObjectConfigJob
  )[] = [];

  private loadFile(filePath: string): string {
    return fs.readFileSync(filePath, { encoding: "utf-8" });
  }

  private loadConfigFromJsonFile(filePath: string) {
    const file = this.loadFile(filePath);
    return JSON5.parse(file);
  }

  private loadConfigFromYamlFile(filePath: string) {
    const file = this.loadFile(filePath);
    return jsYaml.load(file) as Record<string, unknown>;
  }

  private loadConfigFromDotEnvFile(filePath: string) {
    const file = this.loadFile(filePath);
    return dotenv.parse(file);
  }

  public addJsonFile(args: AddFileConfigArgs): ConfigServiceBuilder {
    this._jobs.push({
      ...args,
      loader: (string) => this.loadConfigFromJsonFile(string),
      type: "config-file-load-job",
    });
    return this;
  }

  public addYamlFile(args: AddFileConfigArgs): ConfigServiceBuilder {
    this._jobs.push({
      ...args,
      loader: (string) => this.loadConfigFromYamlFile(string),
      type: "config-file-load-job",
    });
    return this;
  }

  public addDotEnvFile(args: AddDotEnvFileConfigArgs): ConfigServiceBuilder {
    this._jobs.push({
      ...args,
      loader: (string) => this.loadConfigFromDotEnvFile(string),
      type: "dot-env-config-file-load-job",
    });
    return this;
  }

  public addObject(
    object: Record<string, unknown>,
    args?: AddObjectConfigArgs,
  ): ConfigServiceBuilder {
    this._jobs.push({ ...args, object: object, type: "object-load-job" });
    return this;
  }

  public build(options?: ConfigServiceOptions): ConfigService {
    let config: Record<string, unknown> = {};

    // Add config from files
    for (const job of this._jobs) {
      let newConfigObject: Record<string, unknown>;

      switch (job.type) {
        case "object-load-job":
          {
            newConfigObject = job.object;
            if (job.nesting) {
              newConfigObject = transformToNestedObject(newConfigObject);
            }
          }
          break;
        case "dot-env-config-file-load-job":
          {
            newConfigObject = job.loader(job.filePath);
            if (job.nesting) {
              newConfigObject = transformToNestedObject(newConfigObject);
            }
          }
          break;
        case "config-file-load-job":
          {
            newConfigObject = job.loader(job.filePath);
          }
          break;
      }

      if (job.validator && !job.validator(newConfigObject)) {
        throw new Error(
          `Validation failed for config object ${JSON.stringify(
            newConfigObject,
          )}`,
        );
      }

      if (job.namespace) {
        newConfigObject = { [job.namespace]: newConfigObject };
      }

      config = mergeDeep(config, newConfigObject);
    }

    return new ConfigService(config, options);
  }
}
