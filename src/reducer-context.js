export default class ReducerContext {
  constructor(previousAuxillary, events) {
    this.previousAuxillary = previousAuxillary || {};
    this.nextAuxillary = {};
    this.route = [];
    this.events = events;
  }

  enter(name) {
    this.route.push(name);
  }

  exit() {
    this.route.pop();
  }

  store(value) {
    this.nextAuxillary[this.route.join('--')] = value; // TODO: Need to ensure we avoid collisions here.
  }

  getStoredValue() {
    return this.previousAuxillary[this.route.join('')];
  }
}