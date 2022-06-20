import {
  getValueFromNestedObject,
  transformKeysRecursive,
  transformToNestedObject,
  transformObjectKeyCaseToClassKeyCase,
} from "$util";

describe("transformKeysRecursive", () => {
  it("should transform keys recursively", () => {
    const testObject = {
      NESTED_OBJECT: {
        L2_NESTED_OBJECT: {
          L2_NESTED_OBJECT_SCREAMING_SNAKE_CASE:
            "L2_NESTED_OBJECT_SCREAMING_SNAKE_CASE",
        },
      },
    };

    const transformedObject = transformKeysRecursive(testObject, (key) =>
      key.toLowerCase(),
    );

    expect(transformedObject).toEqual(
      expect.objectContaining({
        nested_object: expect.objectContaining({
          l2_nested_object: expect.objectContaining({
            l2_nested_object_screaming_snake_case: expect.any(String),
          }),
        }),
      }),
    );
  });
});

describe("transformToNestedObject", () => {
  it("should transform to a nested obect", () => {
    const testUnnestedObject = {
      FOO__BAR__BAZ: "baz",
    };

    const nestedObject = transformToNestedObject(testUnnestedObject, "__");

    expect(nestedObject).toEqual(
      expect.objectContaining({
        FOO: expect.objectContaining({
          BAR: expect.objectContaining({
            BAZ: expect.any(String),
          }),
        }),
      }),
    );
  });
});

describe("getValueFromNestedObject", () => {
  const nestedObject = { foo: { bar: { baz: "baz" } } };

  it("should return a value from a nested object if the key exists", () => {
    const value = getValueFromNestedObject("foo.bar", nestedObject);

    expect(value).toEqual({ baz: "baz" });
  });

  it("should return a undefined when the key is not the same case by default", () => {
    const value = getValueFromNestedObject("FOO.BAR", nestedObject);

    expect(value).toBeUndefined();
  });

  it("should return a value when the key is not the same case by caseInsensitive option is true", () => {
    const value = getValueFromNestedObject("FOO.BAR", nestedObject, {
      caseInsensitive: true,
    });

    expect(value).toEqual({ baz: "baz" });
  });

  it("should return undefined if a value doesn't exist", () => {
    const value = getValueFromNestedObject("notfoo", nestedObject);

    expect(value).toBeUndefined();
  });
});

describe("transformObjectKeyCaseToClassKeyCase", () => {
  it("should return an object matching the property name casing of the class", () => {
    class TestClass {
      public fooBarBaz = "";
    }

    const testObject = {
      FOOBARBAZ: "baz",
    };

    const transformedObject = transformObjectKeyCaseToClassKeyCase(
      testObject,
      TestClass,
    );

    expect(transformedObject).toEqual(
      expect.objectContaining({ fooBarBaz: "baz" }),
    );
  });
});
