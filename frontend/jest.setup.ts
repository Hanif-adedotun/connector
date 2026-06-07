import "@testing-library/jest-dom";

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
    }) => React.createElement("a", { href, ...props }, children),
  };
});

jest.mock("next/image", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
      React.createElement("img", { ...props, alt: props.alt ?? "" }),
  };
});

jest.mock("motion/react", () => {
  const React = require("react");
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop: string) =>
        React.forwardRef(
          (
            props: React.ComponentProps<"div"> & { variants?: unknown },
            ref: React.Ref<HTMLElement>,
          ) => {
            const {
              variants: _variants,
              layout: _layout,
              drag: _drag,
              dragConstraints: _dragConstraints,
              dragElastic: _dragElastic,
              dragMomentum: _dragMomentum,
              onDragEnd: _onDragEnd,
              animate: _animate,
              initial: _initial,
              exit: _exit,
              ...rest
            } = props;
            return React.createElement(prop, { ...rest, ref });
          },
        ),
    },
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useAnimationControls: () => ({
      start: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    }),
    useAnimation: () => ({
      start: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    }),
    useReducedMotion: () => true,
  };
});
