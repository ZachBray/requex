import ReducerDescriptor from './reducer-descriptor.js';

/**
 * A builder for reducers.
 */
export default class ReducerBuilder {

  /** @ignore */
  constructor(reduceChain, handledEventTypes) {
    /** @ignore */
    this._reduceChain = reduceChain;
    /** @ignore */
    this._handledEventTypes = handledEventTypes;
  }

  /**
   * Maps the reduced value onto another value using a function.
   * @param {function(x:T1):T2} selector - The mapping function
   * @returns {ReducerBuilder<T2>} A reducer builder that maps the value
   */
  select(selector) {
    if (!selector) throw new Error('Missing selector argument');
    return this._chain((next, result, hasResult) => hasResult && next(selector(result)));
  }

  /**
   * Filters the value by applying a predicate function to the value
   * @param {function(x:T):boolean} predicate - The predicate function
   * @returns {ReducerBuilder<T>} A reducer builder than filters using the predicate
   */
  where(predicate) {
    if (!predicate) throw new Error('Missing predicate argument');
    return this._chain((next, result, hasResult) => hasResult && predicate(result) && next(result));
  }

  /**
   * Accumulates the sum of the reduced values.
   * @param {number|string} zeroValue - The zero value for the addition operator.
   * @returns {ReducerBuilder<T>} A reducer builder that accumulates the sum
   */
  sum(zeroValue) {
    return this._chain((next, result, hasResult, previousState) => {
      if (hasResult) {
        const acc = previousState || zeroValue;
        next(acc + result);
      } else {
        next(zeroValue);
      }
    }, (next, _) => next(zeroValue));
  }

  /**
   * Constructs a reducer descriptor from the query defined using the builder.
   * @returns {ReducerDescriptor} a reducer descriptor
   */
  build() {
    const reduce = (previousState, event) => {
      let result;
      this._reduceChain(previousState, event)(r => result = r);
      return result;
    };
    return new ReducerDescriptor(reduce, this._handledEventTypes);
  }

  /** @ignore */
  _chain(resultHandler, seedFactory) {
    return new ReducerBuilder(
      (previousState, event) => next => {
        let result, hasResult;
        this._reduceChain(previousState, event)(r => {
          result = r;
          hasResult = true;
        });
        resultHandler(next, result, hasResult, previousState);
      },
      this._handledEventTypes
    );
  }
}