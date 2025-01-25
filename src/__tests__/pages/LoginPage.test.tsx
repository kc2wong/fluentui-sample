import React from 'react';
import { vi } from 'vitest';

const t = vi.fn((key: string) => key);
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: t,
  })),
}));

vi.mock('@fluentui/react-components', async (importOriginal) => {
  const original = (await importOriginal()) as any;

  return {
    ...original,
    Button: vi.fn((props: any) => {
      // Call the original Button implementation
      const OriginalButton = original.Button;
      return <OriginalButton {...props} />;
    }),
  };
});

// state will be changed in mockedSetter
let mockAtomGetter: Record<string, any> = { version: 0 };
const mockAtomSetter = vi.fn();
vi.mock('jotai', async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    useAtom: vi.fn(() => [mockAtomGetter, mockAtomSetter]),
  };
});

const buttonPanelTestId = new Date().getTime().toString();
vi.mock('../../components/ButtonPanel', async (importOriginal) => {
  const original = (await importOriginal()) as any;

  return {
    ...original,
    ButtonPanel: vi.fn((props: any) => {
      // Add the test-id attribute
      return React.cloneElement(original.ButtonPanel(props), {
        'data-testid': buttonPanelTestId,
        ...props,
      });
    }),
  };
});

const mockShowSpinner = vi.fn();
const mockStopSpinner = vi.fn();
const mockDispatchMessage = vi.fn();
vi.mock('../../contexts/Message', () => ({
  useMessage: vi.fn(() => ({
    showSpinner: mockShowSpinner,
    stopSpinner: mockStopSpinner,
    dispatchMessage: mockDispatchMessage,
  })),
}));

import { render, waitFor } from '@testing-library/react';
import { Input } from '@fluentui/react-components';
import { PersonPasskeyRegular } from '@fluentui/react-icons';
import { LoginPage } from '../../pages/LoginPage';

import * as FluentUiModule from '@fluentui/react-components';
import * as FieldModule from '../../components/Field';

import { findElementByTestId, findElementByText, findInputByLabel } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { OperationType } from '../../states/authentication';
import { MessageType } from '../../models/system';

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset state before each test
    mockAtomGetter = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('renders components with correct attributes', () => {
    const fieldSpy = vi.spyOn(FieldModule, 'Field');
    const buttonSpy = vi.spyOn(FluentUiModule, 'Button');

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

    // shared data is reset at the beginning when user is not signed in
    expect(mockAtomSetter).toHaveBeenCalledTimes(2);
    expect(mockAtomSetter).toHaveBeenNthCalledWith(1, { reset: {} });
    expect(mockAtomSetter).toHaveBeenNthCalledWith(2, { reset: {} });
  });

  it('renders components with correct orders', () => {
    render(<LoginPage />);

    const emailInput = findInputByLabel('login.email')!;
    const passwordInput = findInputByLabel('login.password')!;
    const buttonPanel = findElementByTestId(buttonPanelTestId, HTMLDivElement)!;
    const signInButton = findElementByText('login.signIn', HTMLButtonElement)!;

    // Order of widget
    expect(emailInput?.compareDocumentPosition(passwordInput)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(passwordInput?.compareDocumentPosition(signInButton)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(buttonPanel?.contains(signInButton)).toBe(true);
  });

  it('renders components with correct styles', () => {
    render(<LoginPage />);

    const buttonPanel = findElementByTestId(buttonPanelTestId, HTMLDivElement)!;

    const style = window.getComputedStyle(buttonPanel);
    expect(style.margin).toEqual('40px 20px 20px 0px');
  });

  it('attempts signIn with invalid values', async () => {
    const fieldSpy = vi.spyOn(FieldModule, 'Field');

    render(<LoginPage />);

    const emailInput = findInputByLabel('login.email')!;
    const passwordInput = findInputByLabel('login.password')!;
    const signInButton = findElementByText('login.signIn', HTMLButtonElement)!;

    const email = 'testuser@example';
    const password = 'securepassword';
    userEvent.type(emailInput!, email);
    userEvent.type(passwordInput!, password);

    // signIn button is enabled after entering email and password
    expect(signInButton!.disabled).toBe(false);

    // simulate click signIn button and expect validation fails
    userEvent.click(signInButton!);
    await waitFor(() => {
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
          validationMessage: 'system.error.invalid-email-address',
        }),
        expect.anything(), // Ignore the second argument which is forward-ref component
      );
    });
    expect(mockAtomSetter).not.toHaveBeenCalledWith(
      expect.objectContaining({ signIn: expect.any(Object) }),
    );
    // translate error code to message
    expect(t).toHaveBeenCalledWith('system.error.invalid-email-address');
  });

  it('attempts signIn with valid values', async () => {
    const currentTime = new Date().getTime();
    mockAtomSetter.mockImplementation(async (newState) => {
      mockAtomGetter = {
        version: 1,
        operationStartTime: currentTime,
        operationEndTime: -1,
        operationType: OperationType.SignIn,
        login: undefined,
        acknowledge: false,
      };
    });

    render(<LoginPage />);
    // clear invocation history
    mockAtomSetter.mockClear();

    const emailInput = findInputByLabel('login.email')!;
    const passwordInput = findInputByLabel('login.password')!;
    const signInButton = findElementByText('login.signIn', HTMLButtonElement)!;

    const email = 'testuser@example.com';
    const password = 'securepassword';
    userEvent.type(emailInput!, email);
    // signIn button is not enabled yet after entering email
    expect(signInButton!.disabled).toBe(true);
    userEvent.type(passwordInput!, password);

    // signIn button is enabled after entering email and password
    expect(signInButton!.disabled).toBe(false);

    // simulate click signIn button and wait for execution is completed
    userEvent.click(signInButton);

    await waitFor(() => {
      expect(mockAtomSetter).toHaveBeenCalledTimes(1);
    });
    expect(mockAtomSetter).toHaveBeenCalledWith({
      signIn: { id: email, password: password },
    });
    expect(mockShowSpinner).toHaveBeenCalledTimes(1);
  });

  it('signIn is success', async () => {
    render(<LoginPage />);
    // clear invocation history
    mockAtomSetter.mockClear();

    const emailInput = findInputByLabel('login.email')!;
    const passwordInput = findInputByLabel('login.password')!;
    const signInButton = findElementByText('login.signIn', HTMLButtonElement)!;

    const email = 'testuser@example.com';
    const password = 'securepassword';
    userEvent.type(emailInput!, email);
    userEvent.type(passwordInput!, password);

    const currentTime = new Date().getTime();
    mockAtomGetter = {
      version: 2,
      operationStartTime: currentTime,
      operationEndTime: currentTime + 1,
      operationType: OperationType.SignIn,
      login: {},
      acknowledge: false,
    };

    // simulate click signIn button and wait for execution is completed
    userEvent.click(signInButton);

    await waitFor(
      () => {
        expect(mockAtomSetter).toHaveBeenCalledTimes(1);
        expect(mockStopSpinner).toHaveBeenCalledTimes(1);
        expect(mockDispatchMessage).toHaveBeenCalledTimes(1);
        expect(mockDispatchMessage).toHaveBeenCalledWith({
          type: MessageType.Success,
          text: 'login.success',
        });
      },
      { timeout: 1500 },
    );

    await waitFor(
      () => {
        expect(mockAtomSetter).toHaveBeenCalledTimes(2);
        expect(mockAtomSetter).toHaveBeenCalledWith({
          acknowledgeSignIn: {},
        });
      },
      { timeout: 1500 },
    );
  });

  it('signIn is failed', async () => {
    render(<LoginPage />);
    // clear invocation history
    mockAtomSetter.mockClear();

    const emailInput = findInputByLabel('login.email')!;
    const passwordInput = findInputByLabel('login.password')!;
    const signInButton = findElementByText('login.signIn', HTMLButtonElement)!;

    const email = 'testuser@example.com';
    const password = 'securepassword';
    userEvent.type(emailInput!, email);
    userEvent.type(passwordInput!, password);

    const currentTime = new Date().getTime();
    mockAtomGetter = {
      version: 2,
      operationStartTime: currentTime,
      operationEndTime: currentTime + 1,
      operationType: OperationType.SignIn,
      login: undefined,
      operationFailureReason: { key: 'ACCOUNT_LOCKED', type: MessageType.Error, parameters: [] },
      acknowledge: false,
    };

    // simulate click signIn button and wait for execution is completed
    userEvent.click(signInButton);

    await waitFor(
      () => {
        expect(mockAtomSetter).toHaveBeenCalledTimes(1);
        expect(mockStopSpinner).toHaveBeenCalledTimes(1);
        expect(mockDispatchMessage).toHaveBeenCalledTimes(1);
        expect(mockDispatchMessage).toHaveBeenCalledWith({
          type: MessageType.Error,
          text: 'system.error.ACCOUNT_LOCKED',
        });
      },
      { timeout: 1500 },
    );

    // acknowledgeSignIn not called
    await waitFor(
      () => {
        expect(mockAtomSetter).not.toHaveBeenCalledWith({
          acknowledgeSignIn: {},
        });
      },
      { timeout: 1500 },
    );
  });
});
