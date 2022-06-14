<h1 align="center">
  <a href="">
    <img src="https://s3.amazonaws.com/bugsplat-public/npm/header.png" alt="BugSplat">
  </a>  
</h1>

<h2 align="center">
  bugsplat-react
</h2>

## Introduction

BugSplat supports the collection of errors in React applications. The
bugsplat-react npm package implements an
[ErrorBoundary](https://reactjs.org/docs/error-boundaries.html)
component in order to capture rendering errors in child components and
post them to BugSplat where they can be tracked and managed. The package
also includes a [React context](https://reactjs.org/docs/context.html)
provider and additional utilities to tailor BugSplat to the needs of
your application. Adding BugSplat to your React application is extremely
easy. Before getting started please complete the following tasks:

- [Sign up](https://app.bugsplat.com/v2/sign-up) for BugSplat
- Create a new
  [database](https://app.bugsplat.com/v2/settings/company/databases)
  for your application
- Check out the
  [live demo](https://www.bugsplat.com/platforms/react/my-react-crasher)
  of BugSplat’s error reporting for React

## Get Started

To start using BugSplat in your React application, run the following command
at the root of your project. This will install bugsplat-react and its sub
dependency [bugsplat](https://github.com/BugSplat-Git/bugsplat-js).

```shell
npm i bugsplat-react --save
```

In addition to standard `package.json` properties `name` and `version`, include
a `database` property to your `package.json` file with the value of your BugSplat
database. Make sure to replace `{{YOUR_DATABASE_NAME}}` with your actual
database name.

```jsonc
// package.json
{
  "name": "my-app",
  "version": "1.2.0",
  "database": "{{YOUR_DATABASE_NAME}}"
  // ...
}
```

In the root of your project, import your project's `package.json`. Use it's
`name`, `database`, and `version` properties to initialize the BugSplat client
for sending crashes. This will instantiate a new client instance and store it internally.

```jsx
// src/index.tsx

import ReactDOM from 'react-dom';
import { init } from 'bugsplat-react';
import App from './App';
import * as packageJson from '../package.json';

init({
  database: packageJson.database,
  name: packageJson.name,
  version: packageJson.version,
});

ReactDOM.render(<App />, document.getElementById('root'));
```

You can now wrap your component trees with `ErrorBoundary` to capture rendering
errors and automatically post them to BugSplat with the internal client
instance we initialized earlier.

```jsx
// src/App.tsx

import { ErrorBoundary } from 'bugsplat-react';

export default function App() {
  return (
    <ErrorBoundary fallback={<h1>Oops, there was a problem.</h1>}>
      <Content>...</Content>
    </ErrorBoundary>
  );
}
```

You can also access the stored `BugSplat` instance anywhere by
calling `getBugSplat()`

```jsx
// src/App.tsx

import { getBugSplat } from 'bugsplat-react';

export default function App() {
  const handleClick = () => {
    getBugSplat().post('There was a problem');
  };

  return (
    <div>
      <h1>Hello, world!</h1>
      <button onClick={handleClick}>Post Error Report</button>
    </div>
  );
}
```

## Further Integration

Want your error boundary to also handle errors that are not caught by
`ErrorBoundary`, such as async errors or event handlers? No problem!
`useErrorHandler` to the rescue. Pass your error to the callback returned from
`useErrorHandler` in order to propagate the error to the nearest
`ErrorBoundary`. You can also pass your error directly to `useErrorHandler`
if you manage the error state yourself or get it from another library.

```jsx
// src/App.tsx

import { useState } from 'react'
import { ErrorBoundary, useErrorHandler } from 'bugsplat-react';

function NestedComponent() {
  const handleError = useErrorHandler();

  const handleClick = async () => {
    try {
      await doThing();
    } catch (err) {
      handleError(err);
    }
  };

  return <button onClick={handleClick}>Do Thing</button>;
}

function NestedComponent2() {
  const [error, setError] = useState<Error>()

  useErrorHandler(error)

  const handleClick = async () => {
    try {
      await doThing()
    } catch (err) {
      setError(err)
    }
  }

  return <button onClick={handleClick}>Do Thing</button>;
}

export default function App() {
  return (
    <ErrorBoundary fallback={<h1>Oops, there was a problem.</h1>}>
      <NestedComponent />
      <NestedComponent2 />
    </ErrorBoundary>
  );
}
```

Providing an instance of BugSplat will allow `ErrorBoundary` to automatically
post errors it catches to BugSplat.

The `ErrorBoundary` component is packed with props that can be used to
customize it to fit your needs:

- `fallback`
- `onMount`
- `onUnmount`
- `onError`
- `beforePost`
- `onReset`
- `onResetKeysChange`
- `disablePost`

We strongly recommend passing a `fallback` prop that will be rendered
when `ErrorBoundary` encounters an error.

The `fallback` prop can be any valid element:

```jsx
function Component() {
  return (
    <ErrorBoundary fallback={<div>Oops, there was a problem.</div>}>
      ...
    </ErrorBoundary>
  );
}
```

...or a function that renders one

```jsx
function Component() {
  return (
    <ErrorBoundary fallback={() => <div>Oops, there was a problem.</div>}>
      ...
    </ErrorBoundary>
  );
}
```

If `fallback` is a function, it will be called with

- `error` - the error caught be `ErrorBoundary`
- `componentStack` - the component stack trace of the error
- `response` - the BugSplat response of posting error to BugSplat, if applicable
- `resetErrorBoundary` - a function to call in order to reset the
  `ErrorBoundary` state

The fallback will render any time the `ErrorBoundary` catches an error. It is
useful to have a fallback UI to gracefully handle errors for your users, while
still sending errors to BugSplat behind the scenes.

`ErrorBoundary` accepts a `resetKeys` prop that you can pass with an array of
values that will cause it to automatically reset if one of those values changes.
This gives you the power to control the error state from outside of the
component.

```jsx
function App() {
  const [error, setError] = useState<Error | null>();

  return (
    <ErrorBoundary
      fallback={(props) => <Fallback {...props} />}
      onReset={() => setError(null)}
      resetKeys={[error]}
    >
      ...
    </ErrorBoundary>
  );
}
```

## API

This package re-exports all exports from
[bugsplat-js](https://github.com/BugSplat-Git/bugsplat-js).

### `init()`

```ts
interface BugSplatInit {
  /**
   * BugSplat database name that crashes should be posted to
   */
  database: string;
  /**
   * Name of application
   */
  application: string;
  /**
   * Version of application.
   */
  version: string;
}

/**
 * Initialize a new BugSplat instance and store the reference in scope
 *
 * @returns function with a callback argument that will be
 * called with the freshly initialized BugSplat instance
 *
 * - Useful to subscribe to events or set default properties
 */
function init(
  initOptions: BugSplatInit
): (func: (instance: BugSplat) => void) => void;

/**
 * @example
 */
init({
  database: 'fred',
  application: 'my-react-crasher',
  version: '3.2.1',
})((bugSplat) => {
  bugSplat.setDefaultAppKey('Key!');
  bugSplat.setDefaultUser('User!');
  bugSplat.setDefaultEmail('fred@bedrock.com');
  bugSplat.setDefaultDescription('Description!');
});
```

### `getBugSplat()`

```ts
/**
 * Get `BugSplat` instance from application scope
 */
const getBugSplat: () => BugSplat | null;
```

### `ErrorBoundary`

```typescript
interface FallbackProps {
  error: Error;
  componentStack: string | null;
  response: BugSplatResponse | null;
  resetErrorBoundary: (...args: unknown[]) => void;
}

type FallbackElement = ReactElement<
  unknown,
  string | FunctionComponent | typeof Component
> | null;

type FallbackRender = (props: FallbackProps) => FallbackElement;

interface ErrorBoundaryProps {
  /**
   * Callback called before error post to BugSplat.
   */
  beforePost?: (
    bugSplat: BugSplat,
    error: Error | null,
    componentStack: string | null
  ) => void;

  /**
   * Callback called when ErrorBoundary catches an error in componentDidCatch()
   */
  onError?: (
    error: Error,
    componentStack: string,
    response: BugSplatResponse | null
  ) => void;

  /**
   * Callback called on componentDidMount().
   */
  onMount?: () => void;

  /**
   * Callback called on componentWillUnmount().
   */
  onUnmount?: (
    error: Error | null,
    componentStack: string | null,
    response: BugSplatResponse | null
  ) => void;

  /**
   * Callback called before ErrorBoundary resets internal state,
   * resulting in rendering children again. This should be
   * used to ensure that rerendering of children would not
   * repeat the same error that occurred.
   *
   * *Not called when reset from change in resetKeys -
   * use onResetKeysChange for that.*
   */
  onReset?: (
    error: Error | null,
    componentStack: string | null,
    response: BugSplatResponse | null,
    extraArgs?: unknown[]
  ) => void;

  /**
   * Callback called when keys passed to resetKeys are changed.
   */
  onResetKeysChange?: (prevResetKeys?: unknown[], resetKeys?: unknown[]) => void;

  /**
   * Array of values passed from parent scope. When ErrorBoundary
   * is in an error state, it will check each passed value
   * and automatically reset if any of the values have changed.
   */
  resetKeys?: unknown[];

  /**
   * Provide a fallback to render when ErrorBoundary catches an error.
   * Not required, but it is highly recommended to provide a value for this.
   *
   * This can be an element or a function that renders an element.
   */
  fallback?: FallbackElement | FallbackRender;

  /**
   * If true, caught errors will not be automatically posted to BugSplat.
   */
  disablePost?: boolean;

  /**
   * Child elements to be rendered when there is no error
   */
  children?: ReactNode | ReactNode[];
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
  response: BugSplatResponse | null;
}

/**
 * Handle errors that occur during rendering by wrapping
 * your component tree with ErrorBoundary. Any number of ErrorBoundary
 * components can be rendered in the tree and any rendering error will
 * propagate to the nearest one.
 */
class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
>
```

### `withErrorBoundary`

```typescript
/**
 * Higher order component to wrap your component tree with ErrorBoundary
 */
function withErrorBoundary<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  errorBoundaryProps: ErrorBoundaryProps = {}
): ComponentType<P>;
```

### `useErrorHandler`

```typescript
/**
 * Utility hook to declaratively or imperatively propagate an
 * error to the nearest error boundary.
 *
 * *Should be called from a child of ErrorBoundary*
 *
 * Propagate error:
 *
 * * Declaratively - by passing an error prop
 * * Imperatively - by calling the returned handler with an error
 *
 * @param errorProp - Will throw when a truthy value is passed
 */
function useErrorHandler(errorProp?: unknown): (error: unknown) => void;
```
