import { vi } from 'vitest';

vi.mock('@fluentui/react-components', async (importOriginal) => {
  const original = (await importOriginal()) as any;

  return {
    ...original,
    Input: vi.fn((props: any) => {
      // Call the original Input implementation
      const OriginalInput = original.Input;
      return <OriginalInput {...props} />;
    }),
  };
});

vi.mock('../../utils/string-util', async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    formatNumber: vi.fn(original.formatNumber),
  };
});

import { render, fireEvent, waitFor } from '@testing-library/react';
import * as FluentUiModule from '@fluentui/react-components';
import { NumericInput } from '../../components/NumericInput';
import userEvent from '@testing-library/user-event';

const inputSpy = vi.spyOn(FluentUiModule, 'Input');

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

import { formatNumber } from '../../utils/string-util';
import exp from 'constants';
import { number } from 'zod';

describe('NumericInput', () => {
  const formatNumberSpy = vi.mocked(formatNumber);

  beforeEach(() => {});

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('should redner NumericInput with correct attributes', async () => {
    render(<NumericInput />);

    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(1);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        appearance: undefined,
        onBlur: expect.any(Function),
        onChange: expect.any(Function),
        onFocus: expect.any(Function),
        onKeyDown: expect.any(Function),
        value: '',
      }),
      expect.anything(),
    );
    expect(formatNumberSpy).toHaveBeenCalledTimes(0);

    // expect formatted with decimal values for normal and readonly
    const v = getRandomInt(999) + 1;
    render(<NumericInput readOnly value={v} />);
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        appearance: 'underline',
        value: `${v}.00`,
      }),
      expect.anything(),
    );
    expect(formatNumberSpy).toHaveBeenCalledTimes(1);
    expect(formatNumberSpy).lastCalledWith(v, 2);

    render(<NumericInput value={v} />).baseElement;
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(3);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}.00`,
      }),
      expect.anything(),
    );
    expect(formatNumberSpy).toHaveBeenCalledTimes(2);
    expect(formatNumberSpy).lastCalledWith(v, 2);
  });

  it('should block input for non digit and period', async () => {
    const container = render(<NumericInput />).baseElement;
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    userEvent.type(input, 'a');
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: ``,
      }),
      expect.anything(),
    );
  });

  it('should block input period for integer', async () => {
    const v = getRandomInt(1000);

    const container = render(<NumericInput decimalPlaces={0} value={v} />).baseElement;
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    userEvent.type(input, '.');
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}`,
      }),
      expect.anything(),
    );
  });

  it('should block input period twice', async () => {
    const onChangeMock = vi.fn();
    const v = getRandomInt(1000);

    const container = render(
      <NumericInput decimalPlaces={2} value={v} onChange={onChangeMock} />,
    ).baseElement;
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(1);
    });
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}`,
      }),
      expect.anything(),
    );

    // type period
    userEvent.type(input, '.');
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(3);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}.`,
      }),
      expect.anything(),
    );
    expect(onChangeMock).not.toHaveBeenCalled();

    // type period again (two consecutive periods)
    userEvent.type(input, '.');
    await waitFor(() => {
      // no new rendering
      expect(inputSpy).toHaveBeenCalledTimes(3);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}.`,
      }),
      expect.anything(),
    );

    // type number
    const decimal = getRandomInt(8) + 1;
    userEvent.type(input, decimal.toString());
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(4);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}.${decimal}`,
      }),
      expect.anything(),
    );
    expect(onChangeMock).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        value: Number.parseFloat(`${v}.${decimal}`),
      }),
    );

    // type period again (digit between two periods)
    userEvent.type(input, '.');
    await waitFor(() => {
      // no new rendering
      expect(inputSpy).toHaveBeenCalledTimes(4);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}.${decimal}`,
      }),
      expect.anything(),
    );
  });

  it('should block input when max precision is reached', async () => {
    // generate a number with 2 decimal places and not ends with 0
    const v = Number.parseFloat(`${getRandomInt(1000)}.${getRandomInt(9)}${getRandomInt(8) + 1}`);

    const container = render(<NumericInput decimalPlaces={2} value={v} />).baseElement;
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(1);
    });
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });

    // type number
    const decimal = getRandomInt(8) + 1;
    userEvent.type(input, decimal.toString());
    await waitFor(() => {
      // no new rendering
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });
    expect(inputSpy).lastCalledWith(
      expect.objectContaining({
        value: `${v}`,
      }),
      expect.anything(),
    );
  });

  test.each([
    [undefined, '{Backspace}'],
    [0, '.'],
  ])('should call onChange with %s when erase value by pressing %s', async (expectedValue, key) => {
    const onChangeMock = vi.fn();
    // generate a number with 2 decimal places and not ends with 0
    const v = Number.parseFloat(`${getRandomInt(8) + 1}.${getRandomInt(9)}${getRandomInt(8) + 1}`);

    const container = render(
      <NumericInput decimalPlaces={2} value={v} onChange={onChangeMock} />,
    ).baseElement;
    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(1);
    });
    const input = container.querySelector('input')!;

    fireEvent.focus(input);
    // input.setSelectionRange(0, input.value.length);
    input.setSelectionRange(null, null);

    await waitFor(() => {
      expect(inputSpy).toHaveBeenCalledTimes(2);
    });

    // // type period
    // userEvent.type(input, key);
    // // should block typing when text is not selected
    // await waitFor(() => {
    //   expect(inputSpy).toHaveBeenCalledTimes(2);
    // });
    // expect(onChangeMock).not.toHaveBeenCalled();

    input.setSelectionRange(0, input.value.length);
    userEvent.type(input, key);
    await waitFor(() => {
      // no new rendering
      expect(inputSpy).toHaveBeenCalledTimes(3);
    });
    expect(onChangeMock).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        value: expectedValue,
      }),
    );
  });

  it.each(['{ArrowLeft}', '{ArrowRight}', '{Tab}', '{Backspace}', '{Delete}'])(
    'should allow key press: %s',
    async (key) => {
      const v = Number.parseFloat(`${getRandomInt(998) + 1}.${getRandomInt(8) + 1}`);

      const container = render(<NumericInput decimalPlaces={2} value={v} />).baseElement;
      await waitFor(() => {
        expect(inputSpy).toHaveBeenCalledTimes(1);
      });
      const input = container.querySelector('input')!;
      fireEvent.focus(input);
      await waitFor(() => {
        expect(inputSpy).toHaveBeenCalledTimes(2);
      });

      // Check the input value before deleting
      const initialValue = input.value;

      // Simulate key press
      userEvent.type(input, key);

      if (key === '{Backspace}') {
        // If Backspace should change the input, expect a re-render
        await waitFor(() => {
          expect(inputSpy).toHaveBeenCalledTimes(3);
        });
      } else {
        // Otherwise, it should NOT re-render
        expect(inputSpy).toHaveBeenCalledTimes(2);
      }
    },
  );

  it.each([undefined, Number.parseFloat(`${getRandomInt(998) + 1}.${getRandomInt(8) + 1}`)])(
    'should unformat on focus and format on unfocus for value = %s',
    async (key) => {
      const onFocusMock = vi.fn();
      const onBlurMock = vi.fn();

      const container = render(
        <NumericInput decimalPlaces={2} value={key} onFocus={onFocusMock} onBlur={onBlurMock} />,
      ).baseElement;
      const input = container.querySelector('input')!;
      // remove trailing decimal when focus
      expect(onFocusMock).not.toBeCalled();
      fireEvent.focus(input);
      await waitFor(() => {
        expect(inputSpy).toHaveBeenCalledTimes(2);
      }, {});
      expect(inputSpy).lastCalledWith(
        expect.objectContaining({
          value: `${key ?? ''}`,
        }),
        expect.anything(),
      );
      expect(onFocusMock).toBeCalled();

      expect(onBlurMock).not.toBeCalled();
      fireEvent.focusOut(input);
      await waitFor(() => {
        expect(inputSpy).toHaveBeenCalledTimes(3);
      }, {});
      expect(onBlurMock).toBeCalled();
      expect(inputSpy).lastCalledWith(
        expect.objectContaining({
          value: key ? `${key}0` : '',
        }),
        expect.anything(),
      );
      if (key) {
        expect(formatNumberSpy).lastCalledWith(key, 2);
      } else {
        expect(formatNumberSpy).not.toHaveBeenCalled();
      }
    },
  );
});
