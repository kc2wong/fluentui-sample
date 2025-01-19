import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { Input } from '@fluentui/react-components';
import { PersonPasskeyRegular } from '@fluentui/react-icons';
import { LoginPage } from '../../pages/LoginPage';

import * as FieldModule from '../../components/Field';
import * as ButtonModule from '../../components/Button';
import { getElementByTestId, getElementByText, getInputByLabel } from '../utils/test-utils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../components/ButtonPanel', async () => {
  const original = (await vi.importActual('../../components/ButtonPanel')) as any;

  return {
    ...original,
    ButtonPanel: (props: any) => {
      // Add the test-id attribute
      return React.cloneElement(original.ButtonPanel(props), {
        'data-testid': 'buttonPanelTestId',
        ...props,
      });
    },
  };
});

describe('LoginPage', () => {
  it('renders components with correct attributes', () => {
    const fieldSpy = vi.spyOn(FieldModule, 'Field');
    const buttonSpy = vi.spyOn(ButtonModule, 'Button');

    render(<LoginPage />);

    expect(fieldSpy).toHaveBeenCalledTimes(2);
    expect(buttonSpy).toHaveBeenCalledTimes(1);

    expect(fieldSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.objectContaining({
          type: Input,
          props: expect.objectContaining({
            name: 'email',
            type: 'email',
          }),
        }),
        label: 'login.email',
        required: true,
        validationMessage: undefined,
      }),
      expect.anything(), // Ignore the second argument which is forward-ref component
    );

    expect(fieldSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.objectContaining({
          type: Input,
          props: expect.objectContaining({
            name: 'password',
            type: 'password',
          }),
        }),
        label: 'login.password',
        required: true,
        validationMessage: undefined,
      }),
      expect.anything(),
    );

    expect(buttonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: 'primary',
        disabled: true,
        children: 'login.signIn',
        icon: expect.objectContaining({
          type: PersonPasskeyRegular,
        }),
      }),
      expect.anything(),
    );
  });

  it('renders components with correct orders', () => {
    render(<LoginPage />);

    const emailInput = getInputByLabel('login.email');
    const passwordInput = getInputByLabel('login.password');
    const buttonPanel = getElementByTestId('buttonPanelTestId', HTMLDivElement);
    const signInButton = getElementByText('login.signIn', HTMLButtonElement);

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(buttonPanel).not.toBeNull();
    expect(signInButton).not.toBeNull();

    // Order of widget
    expect(emailInput?.compareDocumentPosition(passwordInput!)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(passwordInput?.compareDocumentPosition(signInButton!)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(buttonPanel?.contains(signInButton!)).toBe(true);
  });

  it('renders components with correct styles', () => {
    render(<LoginPage />);

    const buttonPanel = getElementByTestId('buttonPanelTestId', HTMLDivElement);
    expect(buttonPanel).not.toBeNull();

    const style = window.getComputedStyle(buttonPanel!);
    expect(style.margin).toEqual('40px 20px 20px 0px');
  });

});
