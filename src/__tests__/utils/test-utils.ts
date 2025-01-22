import { screen } from '@testing-library/react';

export const findInputByLabel = (labelText: string): HTMLInputElement | null => {
  const label = screen.queryByText(labelText);
  if (label) {
    const id = label.getAttribute('for');
    if (id) {
      const element = document.getElementById(id);
      // Check if the element is a input
      if (element instanceof HTMLInputElement) {
        return element;
      }
    }
  }
  return null;
};

export const findElementByTestId = <T extends HTMLElement>(
  testId: string,
  elementType: new () => T,
): T | null => {
  const element = screen.queryByTestId(testId);

  // Check if the element is of the specified type
  if (element instanceof elementType) {
    return element;
  }
  return null;
};

export const findElementByText = <T extends HTMLElement>(
  labelText: string,
  elementType: new () => T,
): T | null => {
  const element = screen.queryByText(labelText);

  // Check if the element is of the specified type
  if (element instanceof elementType) {
    return element;
  }
  return null;
};

export const findElementByClassName = <T extends HTMLElement>(
  className: string,
  elementType: new () => T,
  container: HTMLElement,
): T | null => {
  const element = container.querySelector<T>(`.${className}`);

  // Check if the element is of the specified type
  if (element instanceof elementType) {
    return element;
  }
  return null;
};
