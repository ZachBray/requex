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
    return this._chain(({hasChainValue, chainValue, next}) => hasChainValue && next(selector(chainValue)));
  }

  /**
   * Filters the value by applying a predicate function to the value
   * @param {function(x:T):boolean} predicate - The predicate function
   * @returns {ReducerBuilder<T>} A reducer builder than filters using the predicate
   */
  where(predicate) {
    if (!predicate) throw new Error('Missing predicate argument');
    return this._chain(({hasChainValue, chainValue, next}) => hasChainValue && predicate(chainValue) && next(chainValue));
  }

  /**
   * Accumulates the sum of the reduced values.
   * @param {number|string} zeroValue - The zero value for the addition operator.
   * @returns {ReducerBuilder<T>} A reducer builder that accumulates the sum
   */
  sum(zeroValue) {
    return this._chain(context => {
      if (context.hasChainValue) {
        const acc = context.previousState || zeroValue;
        context.next(acc + context.chainValue);
      } else {
        context.next(zeroValue);
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
      this._reduceChain({
        next: r => result = r,
        previousState, 
        event,
        chainValue: event,
        hasChainValue: event !== undefined
      });
      return result;
    };
    return new ReducerDescriptor(reduce, this._handledEventTypes);
  }

  /** @ignore */
  _chain(resultHandler, seedFactory) {
    return new ReducerBuilder(({previousState, event, chainValue, hasChainValue, next}) => {
        let result, hasResult;
        this._reduceChain({
          next: r => {
            result = r;
            hasResult = true;
          },
          event,
          chainValue,
          hasChainValue,
          previousState
        });
        resultHandler({
          chainValue: result,
          hasChainValue: hasResult,
          event,
          next,
          previousState
        });
      },
      this._handledEventTypes
    );
  }
}