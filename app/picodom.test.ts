import { createStore, Store } from '../store';
import { app } from './picodom';

import { defaultOptions } from './app.test';

describe(`picodom`, () => {
  it(`should render to existing container if passed`, () => {
    const store = createStore({});
    const container = document.createElement('div');
    const render = jest.fn(() => document.createElement('div'));
    const throttle = jest.fn((callback) => callback());
    app({ ...defaultOptions, render, store, throttle }, container);
    store.update();
    expect(render).toHaveBeenLastCalledWith(container, store.model, store.model);
  });
});
