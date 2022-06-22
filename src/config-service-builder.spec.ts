import { ConfigServiceBuilder } from "$config-service-builder";

beforeAll(() => {
  process.env = {};
  process.env["FOO__BAR"] = "baz";
  process.env["FOO__BAZ__BAR"] = "baz";
  process.env["FOO__BAZ__BAZ"] = "bar";
});

describe("ConfigBuilder", () => {
  describe("addObject", () => {
    it("should should add environmental variables to the config object", async () => {
      const configBuilder = new ConfigServiceBuilder();

      const config = configBuilder.addObject(process.env).build();

      expect(await config.get()).toEqual(
        expect.objectContaining({ FOO__BAR: "baz" }),
      );
    });

    it("with a namespace option should add environmental variables as a property\
     named after the namespace", async () => {
      const configBuilder = new ConfigServiceBuilder();

      const config = configBuilder
        .addObject(process.env, { namespace: "env" })
        .build();

      expect(await config.get()).toMatchObject({
        env: { FOO__BAR: "baz" },
      });
    });

    it("with nesting option turned on will create a config object with nested\
     properties", async () => {
      const configBuilder = new ConfigServiceBuilder();

      const config = configBuilder
        .addObject(process.env, { nesting: true })
        .build();

      expect(await config.get()).toMatchObject({
        FOO: { BAR: "baz" },
      });
    });
  });

  describe("addDotEnvFile", () => {
    it("should add key-value pairs parsed from a .env file", async () => {
      const configBuilder = new ConfigServiceBuilder();
      configBuilder.addDotEnvFile({ filePath: "./test-configs/.env" });

      const config = configBuilder.build();

      expect(await config.get("ENV__FOO__BAR")).toBe("baz");
    });

    it("should add a nested object parsed from the .env file", async () => {
      const configBuilder = new ConfigServiceBuilder();
      configBuilder.addDotEnvFile({
        filePath: "./test-configs/.env",
        nesting: true,
      });

      const config = configBuilder.build();

      expect(await config.get("ENV.FOO.BAR")).toBe("baz");
    });
  });

  describe("addJsonFile", () => {
    it("should add object parsed from a json file", async () => {
      const configBuilder = new ConfigServiceBuilder();
      configBuilder.addJsonFile({ filePath: "./test-configs/config.json" });
      const config = configBuilder.build();

      expect(await config.get("json.foo.bar")).toBe("baz");
    });
  });

  describe("addYamlFile", () => {
    it("should add object parsed from a yaml file", async () => {
      const configBuilder = new ConfigServiceBuilder();
      configBuilder.addYamlFile({ filePath: "./test-configs/config.yaml" });
      const config = configBuilder.build();

      expect(await config.get("yaml.foo.bar")).toBe("baz");
    });
  });
});
