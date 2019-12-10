const noop = () => {};

interface IModifierDictionary {
  [key: string]: Modifier<any>;
}

enum CloneMode {
  None = 0,
  Unknown = 1,
  Object = 2,
  Array = 3
}

class Modifier<T> {
  original: any;
  current: any;
  onChange: Function;
  __result: any;
  __root: any;
  __children: IModifierDictionary;

  constructor(value: any, root?: any, onChange: Function = noop) {
    this.original = this.current = value;
    this.onChange = onChange;
    this.__root = root;
    this.__children = {};
  }

  modify(
    clone: CloneMode.Array,
    checker: (original: any[]) => any,
    modifier: (cloned: any[]) => any
  ): Modifier<T>;
  modify(
    clone: CloneMode,
    checker: (original: any) => any,
    modifier: (cloned: any) => any
  ): Modifier<T>;
  modify(clone: CloneMode, checker: Function, modifier: Function): Modifier<T> {
    let current = this.current;
    let mergeChanges = false;
    // do nothing
    if (!checker(current)) return this;
    if (clone && current === this.original) {
      if (typeof current === "undefined" || current === null) {
        current = clone === CloneMode.Array ? [] : {};
      } else if (Array.isArray(current)) {
        current = current.slice(0);
        mergeChanges = true;
      } else if (current instanceof Date) {
        current = new Date(current.getTime());
      } else if (typeof current === "object") {
        current = Object.assign({}, current);
        mergeChanges = true;
      }
    } else if (!clone) {
      mergeChanges = true;
    }

    if (mergeChanges) {
      Object.entries(this.__children).forEach(([key, child]) => {
        current[key] = child.__get();
      });
      this.__children = {};
    }

    const next = (this.__result = modifier(current));
    if (clone) {
      this.current = current;
    } else {
      this.current = next;
    }

    return this;
  }

  /**
   * Some array methods return a value (splice, prop, shift), using callback to access that method result
   * @param callback
   */
  result(callback: (result: any, node: Modifier<T>) => void): Modifier<T>;
  result(callback: (result: any) => void): Modifier<T>;
  result(callback: Function): Modifier<T> {
    callback(this.__result, this);
    return this;
  }

  assign(...newProps: any[]) {
    const finalProps = Object.assign({}, ...newProps);
    return this.modify(
      CloneMode.Object,
      obj =>
        !obj ||
        Object.keys(finalProps).some(key => finalProps[key] !== obj[key]),
      obj => Object.assign(obj, ...finalProps)
    );
  }

  /**
   * create immutable modifier for sub item (if current value is Array) or property (if current value is Object)
   * @param args
   */
  prop(...args: any[]): Modifier<T> {
    let [prop, ...props] = args;
    // extract propName from flux-native accessor
    if (typeof prop === "function" && prop.propName) {
      prop = prop.propName;
    }

    let child = this.__children[prop];
    if (!child) {
      this.__children[prop] = child = new Modifier(
        typeof this.current === "undefined" || this.current === null
          ? undefined
          : this.current[prop],
        this.__root || this,
        this.onChange
      );
    }

    return props.length ? child.prop(...props) : child;
  }

  push(...values: any[]): Modifier<T> {
    return this.modify(
      CloneMode.Array,
      () => !!values.length,
      array => array.push(...values)
    );
  }

  pop(): Modifier<T> {
    return this.modify(
      CloneMode.Array,
      array => array && array.length,
      array => array.pop()
    );
  }

  unshift(...values: any[]): Modifier<T> {
    return this.modify(
      CloneMode.Array,
      () => !!values.length,
      array => array.unshift(...values)
    );
  }

  shift(): Modifier<T> {
    return this.modify(
      CloneMode.Array,
      array => array && array.length,
      array => array.shift()
    );
  }

  splice(index: number, count: number, ...newItems: any[]): Modifier<T> {
    return this.modify(
      CloneMode.Array,
      array => array && ((count && array.length > index) || newItems.length),
      array => array.splice(index, count, ...newItems)
    );
  }

  value(): T {
    return this.__root ? this.__root.__get() : this.__get();
  }

  filter(predicate: (item: any, index: number) => any): Modifier<T>;
  filter(predicate: (item: any) => any): Modifier<T>;
  filter(predicate: Function): Modifier<T> {
    return this.__arrayProxy("filter", false, [predicate]);
    // return this.modify(
    //   CloneMode.None,
    //   () => true,
    //   array => array.filter(predicate)
    // );
  }

  slice(from: number, to?: number): Modifier<T> {
    return this.__arrayProxy("slice", false, [from, to]);
    // return this.modify(
    //   CloneMode.None,
    //   () => true,
    //   array => array.slice(from, to)
    // );
  }

  reverse() {
    return this.__arrayProxy("reverse", true);
  }

  sort(comparer?: Function) {
    return this.__arrayProxy("sort", true, [comparer]);
  }

  __arrayProxy(method: string, clone: boolean, args: any[] = []) {
    let modifiedArray: any;
    return this.modify(
      CloneMode.None,
      original => {
        if (typeof original === "undefined" || original === null) {
          original = [];
        }
        modifiedArray = (clone ? original.slice(0) : original)[method](...args);
        return (
          modifiedArray.length !== original.length ||
          modifiedArray.some(
            (item: any, index: number) => item !== original[index]
          )
        );
      },
      () => modifiedArray
    );
  }

  orderBy(selector: Function) {
    return this.sort((a: any, b: any) => {
      const aValue = selector(a);
      const bValue = selector(b);
      if (aValue > bValue) {
        return 1;
      }
      return aValue === bValue ? 0 : -1;
    });
  }

  __get() {
    let current = this.current;
    Object.entries(this.__children).forEach(([key, child]) => {
      const prevChildValue =
        typeof current === "undefined" || current === null
          ? undefined
          : current[key];
      const nextChildValue = child.__get();
      if (prevChildValue !== nextChildValue) {
        if (current === this.current) {
          current = Array.isArray(current)
            ? current.slice(0)
            : Object.assign({}, current);
        } else if (current === null || typeof current === "undefined") {
          current = {};
        }
        current[key] = nextChildValue;
      }
    });

    return current;
  }

  set(prop: any, value: (current: any) => any): Modifier<T>;
  set(prop: any, value: any): Modifier<T>;
  set(prop: any, value: any): Modifier<T> {
    // extract propName from flux-native accessor
    if (typeof prop === "function" && prop.propName) {
      prop = prop.propName;
    }
    let dynamicValue: any;
    return this.modify(
      CloneMode.Unknown,
      obj => {
        const current = obj && obj[prop];
        return (
          current !==
          (typeof value === "function"
            ? (dynamicValue = value(obj[prop]))
            : value)
        );
      },
      obj => (obj[prop] = typeof value === "function" ? dynamicValue : value)
    );
  }

  /**
   * access current value and assign last result
   * @param callback
   */
  tap(callback: (current: any) => any): Modifier<T> {
    this.__result = callback(this.current);
    return this;
  }

  /**
   * access root modifier
   */
  root(): Modifier<T> {
    return this.__root || this;
  }

  unset(...props: any[]): Modifier<T> {
    return this.modify(
      CloneMode.Unknown,
      (obj: any) => obj && props.some(prop => prop in obj),
      (obj: any) => props.forEach(prop => delete obj[prop])
    );
  }

  batch(
    modifiers: ((modifier: Modifier<T>, result: any) => any)[]
  ): Modifier<T>;
  batch(modifiers: ((modifier: Modifier<T>) => any)[]): Modifier<T>;
  batch(modifiers: Function[]): Modifier<T> {
    modifiers.forEach(modifier => modifier(this, this.__result));
    return this;
  }

  swap(prop1: any, prop2: any): Modifier<T> {
    return this.modify(
      CloneMode.Unknown,
      obj => !obj || obj[prop1] !== obj[prop2],
      obj => {
        const temp = obj[prop1];
        obj[prop1] = obj[prop2];
        obj[prop2] = temp;
      }
    );
  }
}

/**
 * extend Modifier
 * @param prototypes
 */
export function extend(...prototypes: any[]) {
  prototypes.forEach(prototype => Object.assign(Modifier.prototype, prototype));
}

/**
 * create immutable root modifier
 * @param value
 */
export default function imez(value: any): Modifier<any>;
export default function imez<T>(value: T): Modifier<T> {
  return new Modifier<T>(value);
}

imez.extend = extend;
