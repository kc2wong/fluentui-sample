import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';

type TransitionStyles = {
  [key in TransitionStatus]?: React.CSSProperties;
};

interface PageTransitionContextType {
  startTransition: (callback: () => void) => void;
}

const defaultDuration = 300;

const PageTransitionContext = createContext<PageTransitionContextType>({
  startTransition: () => {},
});

const transitionStyles: TransitionStyles = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
  unmounted: { opacity: 0 },
};

export const PageTransitionProvider: React.FC<{
  duration?: number;
  children: React.ReactNode;
}> = (props) => {
  const [show, setShow] = useState(true);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<(() => void) | null>(null);

  const children = props.children;
  const duration = props.duration ?? defaultDuration;

  const defaultStyle: React.CSSProperties = {
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: 0,
  };

  const startTransition = useCallback((callback: () => void) => {
    callbackRef.current = callback; // Store the callback
    setShow(false); // Start fade-out
  }, []);

  const handleExited = () => {
    if (callbackRef.current) {
      callbackRef.current(); // Execute the callback
      callbackRef.current = null; // Reset the callback
    }
    setShow(true); // Start fade-in
  };

  return (
    <PageTransitionContext.Provider value={{ startTransition }}>
      <Transition in={show} nodeRef={nodeRef} onExited={handleExited} timeout={duration}>
        {(state) => (
          <div
            ref={nodeRef}
            style={{
              ...defaultStyle,
              ...(transitionStyles[state] ?? {}),
            }}
          >
            {children}
          </div>
        )}
      </Transition>
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = () => useContext(PageTransitionContext);
