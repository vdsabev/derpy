import { createStore, merge, getDeepProps, app } from './index';
import * as _app from './app';
import * as _store from './store';

describe(`createStore`, () => {
  it(`should provide 'merge' and 'getDeepProps' functions for 'store.createStore'`, () => {
    const model = { a: 1, b: 2, c: 3 };
    expect(
      createStore(model).model
    ).toEqual(
      _store.createStore(model, { merge, getDeepProps }).model
    );
  });

  it(`should allow overriding 'merge' and 'getDeepProps' functions`, () => {
    const model = { a: 1, b: 2, c: 3 };
    expect(
      createStore(model, { merge, getDeepProps }).model
    ).toEqual(
      _store.createStore(model, { merge, getDeepProps }).model
    );
  });

  describe(`model`, () => {
    it(`should be empty when created with null`, () => {
      const store = createStore(null);
      expect(store.model).toEqual({});
    });

    it(`should be empty when created with an empty object`, () => {
      const store = createStore({});
      expect(store.model).toEqual({});
    });

    it(`should contain values and functions`, () => {
      const store = createStore({ a: 1, b: () => {} });
      expect(store.model.a).toBe(1);
      expect(typeof store.model.b).toBe('function');
    });

    it(`should contain array`, () => {
      const a = [1, 2, 3];
      const store = createStore({ a });
      expect(store.model.a).toBe(a);
    });

    it(`should return proxied functions`, () => {
      const a = () => {};
      const store = createStore({ a });
      expect(store.model.a).not.toBe(a);
    });

    it(`should return correct value from function`, () => {
      const value = { b: 2, c: 3 };
      const store = createStore({ a: () => value });
      expect(store.model.a()).toBe(value);
    });

    it(`should update state from function`, () => {
      const model = {
        count: 0,
        down() {
          return { count: this.count - 1 };
        },
        up() {
          return { count: this.count + 1 };
        }
      };
      const store = createStore(model);
      expect(store.model.down()).toEqual({ count: -1 });
      expect(store.model.count).toBe(-1);
      expect(store.model.up()).toEqual({ count: 0 });
      expect(store.model.count).toBe(0);
      expect(store.model.up()).toEqual({ count: 1 });
      expect(store.model.count).toBe(1);
    });

    it(`should support arguments for functions`, () => {
      const model = {
        count: 0,
        add(count: number) {
          return { count: this.count + count };
        }
      };
      const store = createStore(model);
      store.model.add(10);
      expect(store.model.count).toBe(10);
      store.model.add(-20);
      expect(store.model.count).toBe(-10);
    });

    it(`should mutate state when calling functions inside a function`, () => {
      const model = {
        count: 0,
        add1() {
          return { count: this.count + 1 };
        },
        add2() {
          return { count: this.count + 2 };
        },
        add3() {
          this.add1();
          this.add2();
        }
      };
      const store = createStore(model);
      store.model.add3();
      expect(store.model.count).toBe(3);
    });

    it(`should not mutate source model`, () => {
      const model = {
        count: 0,
        up() {
          return { count: this.count + 1 };
        }
      };
      const store = createStore(model);
      store.model.up();
      expect(model.count).toBe(0);
      expect(store.model.count).toBe(1);
    });

    it(`should support imperative programming (without calling listeners)`, () => {
      const model = {
        count: 0,
        add(count: number) {
          this.count += count;
        }
      };
      const store = createStore(model);
      store.model.add(10);
      expect(store.model.count).toBe(10);
    });
  });

  describe(`deep model`, () => {
    const model = {
      greeter: {
        name: 'a',
        rename(name: string) {
          return { name };
        }
      },
      counter: {
        count: 0,
        add(count: number) {
          return { count: this.count + count };
        }
      }
    };

    it(`should initialize deep values`, () => {
      const store = createStore(model);
      expect(store.model.greeter.name).toBe('a');
      expect(store.model.counter.count).toBe(0);
    });

    it(`should return correct value from deep functions`, () => {
      const store = createStore(model);
      expect(store.model.greeter.rename('b')).toEqual({ name: 'b' });
      expect(store.model.counter.add(1)).toEqual({ count: 1 });
    });

    it(`should set deep values from deep functions`, () => {
      const store = createStore(model);
      store.model.greeter.rename('c');
      expect(store.model.greeter.name).toBe('c');
      store.model.counter.add(1);
      expect(store.model.counter.count).toBe(1);
    });

    it(`should not mutate source model`, () => {
      const store = createStore(model);
      store.model.counter.add(1);
      expect(model.counter.count).toBe(0);
      expect(store.model.counter.count).toBe(1);
    });

    it(`should have easily testable source model without going through store`, () => {
      expect(model.greeter.rename('b')).toEqual({ name: 'b' });
      expect(model.counter.add(1)).toEqual({ count: 1 });
    });
  });

  describe(`class model`, () => {
    class BaseCounter {
      count = 0;

      add(value: number) {
        return { count: this.count + value };
      }
    }

    class ExtendedCounter extends BaseCounter {
      calls = 0;

      down() {
        this.calls++;
        return { count: this.count - 1 };
      }

      up() {
        this.calls++;
        return { count: this.count + 1 };
      }
    }

    const model = {
      baseCounter: new BaseCounter(),
      extendedCounter: new ExtendedCounter()
    };

    it(`should contain values`, () => {
      const store = createStore(model);
      expect(store.model.baseCounter.count).toBe(0);
      expect(store.model.extendedCounter.count).toBe(0);
      expect(store.model.extendedCounter.calls).toBe(0);
    });

    it(`should contain functions`, () => {
      const store = createStore(model);
      expect(store.model.baseCounter.add).not.toBeUndefined();
      expect(store.model.extendedCounter.add).not.toBeUndefined();
      expect(store.model.extendedCounter.down).not.toBeUndefined();
      expect(store.model.extendedCounter.up).not.toBeUndefined();
    });
  });

  describe(`async`, () => {
    it(`should set state after promise resolves`, async () => {
      const model = {
        count: 0,
        add(count: number) {
          return Promise.resolve({ count: this.count + count });
        }
      };
      const store = createStore(model);
      expect(await store.model.add(10)).toEqual({ count: 10 });
    });

    it(`should not set state after promise throws error`, async () => {
      const model = {
        count: 0,
        add(count: number) {
          return Promise.reject(`Error`);
        }
      };
      const store = createStore(model);
      try {
        await store.model.add(10);
        throw `Not an error`;
      }
      catch (error) {
        expect(error).toBe(`Error`);
      }
    });
  });

  describe(`subscribe`, () => {
    it(`should call listener on update`, () => {
      const store = createStore({});
      const listener = jest.fn();
      store.subscribe(listener);
      store.update();
      expect(listener).toHaveBeenCalledWith({});
    });

    it(`should unsubscribe`, () => {
      const store = createStore({});
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.update();
      expect(listener).not.toHaveBeenCalled();
    });

    it(`should allow unsubscribe multiple times`, () => {
      const store = createStore({});
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      unsubscribe();
      store.update();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe(`app`, () => {
  const options: any = { model: { a: 1, b: 2, c: 3 }, view: () => {}, patch: () => {} };

  it(`should provide 'createStore' function for 'app'`, () => {
    expect(
      app(options).model
    ).toEqual(
      _app.app({ ...options, createStore }).model
    );
  });

  it(`should allow overriding 'createStore' function for 'app'`, () => {
    expect(
      app({ ...options, createStore }).model
    ).toEqual(
      _app.app({ ...options, createStore }).model
    );
  });
});
