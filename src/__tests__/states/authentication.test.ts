import { getDefaultStore } from 'jotai';
import { vi } from 'vitest';
import { authentication, OperationType } from '../../states/authentication';
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
    store.set(authentication, {
      reset: {},
    });
  });

  it('should initialize with the correct default state', () => {
    const store = getDefaultStore();
    const state = store.get(authentication);
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

  it('should change state twice in signIn', async () => {
    const user = { id: 'testuser@example', name: 'Test user', lastLoginDatetime: -1 };
    const login = { user: user, menu: [], isAdministrator: true, isOperator: true };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return login;
    });

    const email = 'testuser@example';
    const password = 'securepassword';

    const store = getDefaultStore();
    store.set(authentication, {
      signIn: { id: 'testuser@example.com', password: 'securepassword' },
    });

    // Assert first update (version and operationType)
    await waitFor(() => {
      const state = store.get(authentication);

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
      const state = store.get(authentication);

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

  it('should set operationFailureReason when signIn fails', async () => {
    const user = { id: 'testuser@example', name: 'Test user', lastLoginDatetime: -1 };
    const login = { user: user, menu: [], isAdministrator: true, isOperator: true };
    mockSignInService.mockImplementation(async () => {
      await delay(100);
      return { code: 'ACCOUNT_LOCKED', parameters: [] };
    });

    const email = 'testuser@example';
    const password = 'securepassword';

    const store = getDefaultStore();
    store.set(authentication, {
      signIn: { id: 'testuser@example.com', password: 'securepassword' },
    });

    await waitFor(() => {
      const state = store.get(authentication);

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
      const state = store.get(authentication);

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
});
