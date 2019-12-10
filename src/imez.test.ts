import imez from "./imez";

test("push()", () => {
  const original = [0];
  const next = imez(original)
    .push(1, 2, 3)
    .value();

  expect(next).toEqual([0, 1, 2, 3]);
});

test("set()", () => {
  const original = {};
  const next = imez(original)
    .set("value", 100)
    .value();

  expect(next).toEqual({ value: 100 });
});

test("set() nested", () => {
  const original = {};
  const next = imez(original)
    .prop("level1", "level2")
    .set("value", 100)
    .value();

  expect(next).toEqual({ level1: { level2: { value: 100 } } });
});

test("set() nothing change", () => {
  const original = { value: 100 };
  const next = imez(original)
    .set("value", 100)
    .value();

  expect(next).toEqual({ value: 100 });
  expect(next).toBe(original);

  const increased = imez(original)
    .set("value", current => current + 1)
    .value();
  expect(increased).toEqual({ value: 101 });
});

test("set() using reducer", () => {
  const original = { value: 100 };
  const next = imez(original)
    .set("value", current => current + 1)
    .value();
  expect(next).toEqual({ value: 101 });
});

test("unset()", () => {
  const original = { value1: 100, value2: 200 };
  const next = imez(original)
    .unset("value1", "value2", "value3")
    .value();

  expect(next).toEqual({});
});

test("unset() nothing change", () => {
  const original = { value1: 100, value2: 200 };
  const next = imez(original)
    .unset("value3", "value4")
    .unset("value3", "value4")
    .value();

  expect(next).toBe(original);
});

test("should merge property values before modifying", () => {
  const original = [{ value: 1 }, { value: 2 }, { value: 3 }];

  const root = imez(original);
  const next1 = root
    .prop(0)
    .set("value", 100)
    .root()
    .prop(1)
    .set("value", {})
    .prop("value")
    .set("test", true)
    .root()
    .shift()
    .value();

  expect(next1).toEqual([{ value: { test: true } }, { value: 3 }]);

  const next2 = root
    .set(1, { value: 4 })
    .splice(0, 1)
    .value();

  expect(next2).toEqual([{ value: 4 }]);
});

test("batch processing", () => {
  const original = {
    value1: 1,
    value2: 2
  };
  const next = imez(original)
    .batch([
      x => x.set("value1", 2),
      x => x.set("value2", 3),
      x => x.set("value3", 4)
    ])
    .value();

  expect(next).toEqual({ value1: 2, value2: 3, value3: 4 });
});

test("filter()", () => {
  const original = [1, 2, 3, 4, 5];
  const next = imez(original)
    .filter(x => x % 2 === 0)
    .value();

  expect(next).toEqual([2, 4]);
});

test("slice()", () => {
  const original = [1, 2, 3, 4, 5];
  const next = imez(original)
    .slice(0, 2)
    .value();

  expect(next).toEqual([1, 2]);
});
