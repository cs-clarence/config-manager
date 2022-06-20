import { CachedConfigService } from "$cached-config-service";

describe("CachedConfigService", () => {
  describe("get", () => {
    it("should return the same instance when called with the same arguments multiple times", async () => {
      const config = {
        foo: { bar: "baz" },
      };

      class TestConfigClass {
        public bar = "";
      }

      const cachedConfigService = new CachedConfigService(config);
      const config1 = await cachedConfigService.get("foo", TestConfigClass);
      const config2 = await cachedConfigService.get("foo", TestConfigClass);
      const config3 = await cachedConfigService.get("foo", TestConfigClass);
      const config4 = await cachedConfigService.get("foo", TestConfigClass);

      expect(config1).toEqual(expect.objectContaining({ bar: "baz" }));
      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
      expect(config3).toBe(config4);
    });
  });
});
