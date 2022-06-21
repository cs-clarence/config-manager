import { ConfigService } from "$config-service";

describe("ConfigService", () => {
  describe("get", () => {
    const config = {
      foo: {
        bar: "baz",
      },
      "kebab-case": "baz",
      snake_case: "baz",
    };

    it("should return a value if it exists", async () => {
      const configService = new ConfigService(config, {});

      expect(await configService.get("foo.bar")).toBe("baz");
    });

    it("should return undefined if a value doesn't exist", async () => {
      const configService = new ConfigService(config, {});

      expect(await configService.get("foo.baz")).toBeUndefined();
    });

    it("should return an instance of the class passed as the second argument", async () => {
      class TestClass {
        public bar = "";
      }

      const configService = new ConfigService(config, {});
      const configObject = await configService.get("foo", TestClass);

      expect(configObject).toEqual(expect.objectContaining({ bar: "baz" }));
      expect(configObject).toBeInstanceOf(TestClass);
    });

    it("should return a value even if the key is not in the same case as the \
    config by default", async () => {
      const configService = new ConfigService(config, {});

      expect(await configService.get("FOO")).toEqual({ bar: "baz" });
    });

    it("should return undefined if the key is not in the same case as the config\
     if the option caseSensitiveKeys option is turn on", async () => {
      const configService = new ConfigService(config, {
        caseSensitiveKeys: true,
      });

      expect(await configService.get("FOO")).toBeUndefined();
    });

    it("should remove underscores from keys if the option removeKeyUnderscores\
    is turned on", async () => {
      const configService = new ConfigService(config, {
        removeKeyUnderscores: true,
      });

      expect(await configService.get("snakecase")).toBe("baz");
    });

    it("should remove dashes from keys if the option removeKeyDashes\
    is turned on", async () => {
      const configService = new ConfigService(config, {
        removeKeyHyphens: true,
      });

      expect(await configService.get("kebabcase")).toBe("baz");
    });
  });
});
