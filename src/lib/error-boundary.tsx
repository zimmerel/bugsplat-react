import { BugSplat, BugSplatResponse } from 'bugsplat';
import {
  Component,
  ContextType,
  ErrorInfo,
  FunctionComponent,
  isValidElement,
  ReactElement,
} from 'react';
import { BugSplatContext } from './bugsplat-context';

const INITIAL_STATE: ErrorBoundaryState = { error: null };

/**
 * Shallowly compare two arrays to determine if they are different.
 * Uses `Object.is` to perform comparison on each item.
 */
function isArrayDiff(a: unknown[] = [], b: unknown[] = []) {
  return (
    a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))
  );
}

export interface FallbackProps {
  error: Error;
  resetErrorBoundary: (...args: unknown[]) => void;
}

export type FallbackElement = ReactElement<
  unknown,
  string | FunctionComponent | typeof Component
> | null;
export type FallbackRender = (props: FallbackProps) => FallbackElement;

export interface ErrorBoundaryProps {
  /**
   * BugSplat instance used to post errors.
   */
  bugSplat?: BugSplat;
  /**
   * Callback called before error post to BugSplat.
   */
  beforePost?: (
    bugSplat: BugSplat,
    error: Error | null,
    info: ErrorInfo | null
  ) => void;
  /**
   * Callback called when ErrorBoundary catches an error in componentDidCatch()
   */
  onError?: (
    error: Error,
    info: ErrorInfo,
    response?: BugSplatResponse
  ) => void;
  /**
   * Callback called on componentDidMount().
   */
  onMount?: () => void;
  /**
   * Callback called on componentWillUnmount().
   */
  onUnmount?: (error: Error | null) => void;
  /**
   * Callback called before ErrorBoundary resets internal state,
   * resulting in rendering children again. This should be
   * used to ensure that rerendering of children would not
   * repeat the same error that occurred.
   *
   * *Not called when reset from change in resetKeys -
   * use onResetKeysChange for that.*
   */
  onReset?: (...args: unknown[]) => void;
  /**
   * Callback called when keys passed to resetKeys are changed.
   */
  onResetKeysChange?: (
    prevResetKeys?: unknown[],
    resetKeys?: unknown[]
  ) => void;
  /**
   * Array of values passed from parent scope. When ErrorBoundary
   * is in an error state, it will check each passed value
   * and automatically reset if any of the values have changed.
   */
  resetKeys?: unknown[];
  /**
   * Provide a fallback to render when ErrorBoundary catches an error.
   *
   * This can be an element or a function that renders an element.
   */
  fallback?: FallbackElement | FallbackRender;
}

export interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Handle errors that occur during rendering by wrapping
 * your component tree with ErrorBoundary. Any number of ErrorBoundary
 * components can be rendered in the tree and any rendering error will
 * propagate to the nearest one.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static contextType = BugSplatContext;

  declare context: ContextType<typeof BugSplatContext>;

  state = INITIAL_STATE;

  resetErrorBoundary = (...args: unknown[]) => {
    this.props.onReset?.(...args);
    this.reset();
  };

  reset() {
    this.setState(INITIAL_STATE);
  }

  async handleError(error: Error, errorInfo: ErrorInfo) {
    const { onError, beforePost } = this.props;
    const bugSplat = this.props.bugSplat || this.context;
    let response: BugSplatResponse | undefined;

    if (bugSplat) {
      beforePost?.(bugSplat, error, errorInfo);
      try {
        response = await bugSplat.post(error, {
          additionalFormDataParams: [
            {
              key: 'componentStack',
              value: errorInfo.componentStack,
            },
          ],
        });
      } catch (err) {
        console.error(err);
      }
    }

    onError?.(error, errorInfo, response);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.handleError(error, errorInfo);
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ) {
    const { error } = this.state;
    const { resetKeys } = this.props;

    if (
      error !== null &&
      prevState.error !== null &&
      isArrayDiff(prevProps.resetKeys, resetKeys)
    ) {
      this.props.onResetKeysChange?.(prevProps.resetKeys, resetKeys);
      this.reset();
    }
  }

  componentDidMount() {
    this.props.onMount?.();
  }

  componentWillUnmount() {
    this.props.onUnmount?.(this.state.error);
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      if (isValidElement(fallback)) {
        return fallback;
      } else if (typeof fallback === 'function') {
        return fallback({ error, resetErrorBoundary: this.resetErrorBoundary });
      } else {
        return null;
      }
    }

    return children;
  }
}

export default ErrorBoundary;