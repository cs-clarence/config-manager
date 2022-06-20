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

type AddEnvConfigArgs = AddConfigArgs & WithNesting;

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
   * If the file contains a variable named `FOO__BAR=baz`, the value of the
   * config object will have a property named `FOO` which is an object containing
   * a property named `BAR` with the value `baz`.
   *
   */
  nesting?: boolean;
};

type ConfigFileLoadJob = AddFileConfigArgs & WithLoader;

type DotEnvConfigFileLoadJob = AddDotEnvFileConfigArgs & WithLoader;

type ConfigServiceBuilderOptions = ConfigServiceOptions;

export class ConfigServiceBuilder {
  private _fileLoadJobs: ConfigFileLoadJob[] = [];
  private _dotEnvfileLoadJobs: DotEnvConfigFileLoadJob[] = [];
  private _keyValues: Record<string, unknown> = {};

  private _envVarOpts: AddEnvConfigArgs = {};
  private _envVars: Record<string, unknown> = {};

  constructor(private _options: ConfigServiceBuilderOptions = {}) {}

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
    this._fileLoadJobs.push({
      ...args,
      loader: (string) => this.loadConfigFromJsonFile(string),
    });
    return this;
  }

  public addYamlFile(args: AddFileConfigArgs): ConfigServiceBuilder {
    this._fileLoadJobs.push({
      ...args,
      loader: (string) => this.loadConfigFromYamlFile(string),
    });
    return this;
  }

  public addDotEnvFile(args: AddDotEnvFileConfigArgs): ConfigServiceBuilder {
    this._dotEnvfileLoadJobs.push({
      ...args,
      loader: (string) => this.loadConfigFromDotEnvFile(string),
    });
    return this;
  }

  public addEnvVars(args?: AddEnvConfigArgs): ConfigServiceBuilder {
    this._envVarOpts = args ?? {};
    this._envVars = process.env;
    return this;
  }

  public addKeyValue(key: string, value: unknown): ConfigServiceBuilder {
    this._keyValues[key] = value;
    return this;
  }

  private isDotEnvConfigFileLoadJob(
    loadJob: DotEnvConfigFileLoadJob | ConfigFileLoadJob,
  ): loadJob is DotEnvConfigFileLoadJob {
    return (
      (loadJob as unknown as DotEnvConfigFileLoadJob).nesting !== undefined
    );
  }

  public build(): ConfigService {
    let config: Record<string, unknown> = {};

    const loadJobs: (DotEnvConfigFileLoadJob | ConfigFileLoadJob)[] = [
      ...this._fileLoadJobs,
      ...this._dotEnvfileLoadJobs,
    ];

    // Add config from files
    for (const job of loadJobs) {
      const fileConfig = job.loader(job.filePath);

      if (job.validator && !job.validator(fileConfig)) {
        throw new Error(`Invalid config file: ${job.filePath}`);
      }

      let fileConfigObject: Record<string, unknown>;

      if (job.namespace) {
        fileConfigObject = { [job.namespace]: fileConfig };
      } else {
        fileConfigObject = fileConfig;
      }

      if (this.isDotEnvConfigFileLoadJob(job)) {
        if (job.nesting) {
          fileConfigObject = transformToNestedObject(fileConfigObject);
        }
      }

      config = mergeDeep(config, fileConfigObject);
    }

    // Add environment variables
    if (this._envVars) {
      let envVars = this._envVars;

      if (this._envVarOpts.nesting) {
        envVars = transformToNestedObject(envVars);
      }

      if (this._envVarOpts.namespace) {
        config = mergeDeep(config, {
          [this._envVarOpts.namespace]: envVars,
        });
      } else {
        config = mergeDeep(config, envVars);
      }
    }

    return new ConfigService(config, this._options);
  }
}
