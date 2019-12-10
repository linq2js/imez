# imez

Small, fast, easy to use immutable helper

## push(value1, value2, value3, ...)

```js
import imez from "imez";

imez([1, 2, 3])
  .push(4)
  .value(); // => [1, 2, 3, 4]
```

## pop()

```js
import imez from "imez";

imez([1, 2, 3])
  .pop()
  .value(); // => [1, 2]
```

## unshift(value1, value2, value3, ...)

```js
import imez from "imez";

imez([1, 2, 3])
  .unshift(4)
  .value(); // => [4, 1, 2, 3]
```

## splice(index, count, ...newItems)

```js
import imez from "imez";

imez([1, 2, 3])
  .splice(0, 2, 4, 5)
  .value(); // => [3, 4, 5]
```

## shift()

```js
import imez from "imez";

imez([1, 2, 3])
  .shift()
  .value(); // => [2, 3]
```

## set(prop, value)

```js
import imez from "imez";

imez({})
  .set("name", "Peter")
  .value(); // => { name: 'Peter' }
```

## set(prop, modifier)

```js
import imez from "imez";

imez({ counter: 1 })
  .set("counter", current => current + 1)
  .value(); // => { counter: 2 }
```

## prop(propLevel1, propLevel2, propLevel3, ...)

```js
import imez from "imez";

imez({})
  .prop("level1", "level2")
  .set("value", 1)
  .value(); // => { level1: { level2: { value: 1 } } }
```

## Batch processing

```js
import imez from "imez";

imez({
  value1: 1,
  value2: 2
})
  .batch([
    x => x.set("value1", 2),
    x => x.set("value2", 3),
    x => x.set("value3", 4)
  ])
  .value(); // { value1: 2, value2: 3 }
```
