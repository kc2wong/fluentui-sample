import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useNotification } from '../../states/base-state';

const operationType = 1;

const operationStartMock = vi.fn();
const operationCompleteMock = vi.fn();

describe('useNotification custom hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('should call operationStart when operation starts', () => {
    const initialState = {
      version: 1,
      operationStartTime: 10,
      operationEndTime: -1,
      operationType: 1,
    };

    const { rerender } = renderHook(
      ({ state }) =>
        useNotification(state, {
          operationStart: operationStartMock,
          operationComplete: operationCompleteMock,
        }),
      { initialProps: { state: initialState } },
    );

    // Simulate state update: operation has started but not ended
    rerender({
      state: {
        ...initialState,
        version: 2,
        operationStartTime: 100, // Updated start time
        operationEndTime: -1,
      },
    });

    expect(operationStartMock).toHaveBeenCalledTimes(1);
    expect(operationCompleteMock).not.toHaveBeenCalled();
  });

  it('should call operationComplete when operation completes', () => {
    const initialState = {
      version: 1,
      operationStartTime: 10,
      operationEndTime: -1,
      operationType: operationType,
    };

    const { rerender } = renderHook(
      ({ state }) =>
        useNotification(state, {
          operationStart: operationStartMock,
          operationComplete: operationCompleteMock,
        }),
      { initialProps: { state: initialState } },
    );

    // Simulate operation completion
    rerender({
      state: {
        ...initialState,
        version: 2,
        operationStartTime: 100,
        operationEndTime: 200, // Operation completed
      },
    });

    expect(operationCompleteMock).toHaveBeenCalledTimes(1);
    expect(operationCompleteMock).toHaveBeenCalledWith(operationType, {
      version: 2,
      operationStartTime: 100,
      operationEndTime: 200,
      operationType: operationType,
    });

    expect(operationStartMock).not.toHaveBeenCalled();
  });

  it('should not call callbacks if version does not change', () => {
    const state = {
      version: 1,
      operationStartTime: 10,
      operationEndTime: -1,
      operationType: operationType,
    };

    const { rerender } = renderHook(
      ({ state }) =>
        useNotification(state, {
          operationStart: operationStartMock,
          operationComplete: operationCompleteMock,
        }),
      { initialProps: { state } },
    );

    // Re-render with same state (no version change)
    rerender({ state });

    expect(operationStartMock).not.toHaveBeenCalled();
    expect(operationCompleteMock).not.toHaveBeenCalled();
  });
});
