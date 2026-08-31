import { useLayoutEffect } from "react";

/**
 * Locks background scrolling while a fixed-position overlay (dialog, menu
 * panel) is open. On iOS Safari, leaving the body scrollable behind a
 * `position: fixed` overlay lets a scroll/bounce gesture desync the layout
 * viewport from `env(safe-area-inset-*)`, so the overlay's safe-area padding
 * is briefly ignored and content slides under the home indicator.
 */
export function useBodyScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previousStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = previousStyle.position;
      body.style.top = previousStyle.top;
      body.style.left = previousStyle.left;
      body.style.right = previousStyle.right;
      body.style.width = previousStyle.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
