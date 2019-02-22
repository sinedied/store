import { Injectable } from '@angular/core';

import { NgxsConfig } from '../symbols';
import { createSelector } from '../utils/selector-utils';

/**
 * Allows the selector decorator to get access to the DI store.
 * @ignore
 */
@Injectable()
export class SelectorFactory {
  static config: NgxsConfig | undefined = undefined;
  constructor(config: NgxsConfig) {
    SelectorFactory.config = config;
  }
}

/**
 * Decorator for memoizing a state selector.
 */
export function Selector(selectors?: any[]) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    if (descriptor.value !== null) {
      const selectorFnName = '__' + methodName + '__memoized';

      if (target[selectorFnName]) {
        throw new Error(
          'You cannot use @Selector decorator and a ' + selectorFnName + ' property.'
        );
      }

      const createMemoizedFn = () => {
        const originalFn = descriptor.value;
        const config = SelectorFactory.config;

        if (!config) {
          throw new Error('SelectorFactory not connected to config!' + methodName);
        }

        const creationMetadata = config.compatibility.injectSelectorContainer
          ? { containerClass: target, selectorName: methodName }
          : undefined;

        return createSelector(
          selectors,
          originalFn.bind(target),
          creationMetadata
        );
      };

      Object.defineProperty(target, selectorFnName, {
        writable: true,
        enumerable: false,
        configurable: true
      });

      return {
        configurable: true,
        get() {
          return target[selectorFnName] || (target[selectorFnName] = createMemoizedFn());
        }
      };
    } else {
      throw new Error('Selectors only work on methods');
    }
  };
}
