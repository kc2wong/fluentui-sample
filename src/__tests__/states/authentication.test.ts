import { getDefaultStore } from 'jotai';
import { vi } from 'vitest';
import { authenticationAtom, OperationType } from '../../states/authentication';
import { waitFor } from '@testing-library/react';
import { delay } from '../../utils/date-util';
import { MessageType } from '../../models/system';

const mockSignInService = vi.fn();
vi.mock('../../services/authentication', () => ({
  signIn: vi.fn(() => mockSignInService()),
}));

describe('Authentication state atom', () => {
  beforeEach(() => {
    const store = getDefaultStore();
    store.set(authenticationAtom, {
      reset: {},
    });
  });

  it('should initialize with the correct default state', () => {
    const store = getDefaultStore();
    const state = store.get(authenticationAtom);
    expect(state).toStrictEqual({
      operationStartTime: -1,
      operationEndTime: -1,
      version: 1,
      operationType: 0,
      operationFailureReason: undefined,
      login: undefined,
      acknowledge: false,
    });
  });

  it('should update state twice in signIn', async () => {
    const email = 'testuser@example';
    const password = 'securepassword';

    const user = { id: email, name: 'Test user', lastLoginDatetime: -1 };
    const login = { user: user, menu: [], isAdministrator: true, isOperator: true };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return login;
    });

    const store = getDefaultStore();
    store.set(authenticationAtom, {
      signIn: { id: email, password: password },
    });

    // Assert first update (version and operationType)
    await waitFor(() => {
      const state = store.get(authenticationAtom);

      expect(state).toMatchObject({
        version: 2,
        operationType: OperationType.SignIn,
        operationFailureReason: undefined,
        login: undefined,
        acknowledge: false,
      });
      // Check if operationStartTime is greater than operationEndTime
      expect(state.operationStartTime).toBeGreaterThan(state.operationEndTime);
    });

    await waitFor(() => {
      const state = store.get(authenticationAtom);

      expect(state).toMatchObject({
        version: 3,
        operationType: OperationType.SignIn,
        operationFailureReason: undefined,
        login: login,
        acknowledge: false,
      });
      // Check if operationEndTime is greater than operationStartTime
      expect(state.operationEndTime).toBeGreaterThan(state.operationStartTime);
    });
  });

  it('should update state with operationFailureReason when signIn fails', async () => {
    const email = 'testuser@example.com';
    const password = 'securepassword';

    const user = { id: email, name: 'Test user', lastLoginDatetime: -1 };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return { code: 'ACCOUNT_LOCKED', parameters: [] };
    });

    const store = getDefaultStore();
    store.set(authenticationAtom, {
      signIn: { id: email, password: password },
    });

    await waitFor(() => {
      const state = store.get(authenticationAtom);

      expect(state).toMatchObject({
        version: 2,
        operationType: OperationType.SignIn,
        operationFailureReason: undefined,
        login: undefined,
        acknowledge: false,
      });
      expect(state.operationStartTime).toBeGreaterThan(state.operationEndTime);
    });

    await waitFor(() => {
      const state = store.get(authenticationAtom);

      // expect error message is returned
      expect(state).toMatchObject({
        version: 3,
        operationType: OperationType.SignIn,
        operationFailureReason: { key: 'ACCOUNT_LOCKED', type: MessageType.Error, parameters: [] },
        login: undefined,
        acknowledge: false,
      });
      // Check if operationEndTime is greater than operationStartTime
      expect(state.operationEndTime).toBeGreaterThan(state.operationStartTime);
    });
  });

  it('should not update state for signOut and acknowledgeSignIn before signIn', async () => {
    const email = 'testuser@example';
    const password = 'securepassword';

    const store = getDefaultStore();
    const initialState = store.get(authenticationAtom);

    store.set(authenticationAtom, {
      acknowledgeSignIn: {},
    });
    // no change in state
    expect(store.get(authenticationAtom)).toBe(initialState);

    store.set(authenticationAtom, {
      signOut: {},
    });
    expect(store.get(authenticationAtom)).toBe(initialState);
  });

  it('should update state on acknowledgeSignIn', async () => {
    const user = { id: 'testuser@example', name: 'Test user', lastLoginDatetime: -1 };
    const login = { user: user, menu: [], isAdministrator: true, isOperator: true };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return login;
    });

    const email = 'testuser@example';
    const password = 'securepassword';

    const store = getDefaultStore();
    store.set(authenticationAtom, {
      signIn: { id: email, password: password },
    });

    await waitFor(() => {
      const state = store.get(authenticationAtom);
      expect(state).toMatchObject({
        version: 3,
      });
    });

    // acknowledgeSignIn
    store.set(authenticationAtom, {
      acknowledgeSignIn: {},
    });

    const state = store.get(authenticationAtom);
    expect(state).toMatchObject({
      version: 4,
      operationType: OperationType.AcknowledgeSignIn,
      operationFailureReason: undefined,
      login: login,
      acknowledge: true,
    });
    // Check if operationEndTime is greater than operationStartTime
    expect(state.operationEndTime).toBeGreaterThan(state.operationStartTime);
  });

  it('should update state on signOut', async () => {
    const user = { id: 'testuser@example', name: 'Test user', lastLoginDatetime: -1 };
    const login = { user: user, menu: [], isAdministrator: true, isOperator: true };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return login;
    });

    const email = 'testuser@example';
    const password = 'securepassword';

    const store = getDefaultStore();
    store.set(authenticationAtom, {
      signIn: { id: email, password: password },
    });

    await waitFor(() => {
      const state = store.get(authenticationAtom);
      expect(state).toMatchObject({
        version: 3,
      });
    });

    // signOut
    store.set(authenticationAtom, {
      signOut: {},
    });

    const state = store.get(authenticationAtom);
    expect(state).toMatchObject({
      version: 4,
      operationType: OperationType.SignOut,
      operationFailureReason: undefined,
      login: undefined,
      acknowledge: false,
    });
    // Check if operationEndTime is greater than operationStartTime
    expect(state.operationEndTime).toBeGreaterThan(state.operationStartTime);
  });
});
