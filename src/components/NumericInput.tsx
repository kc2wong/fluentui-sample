import React, { useState, forwardRef } from 'react';
import { Input, InputProps } from '@fluentui/react-components';
import { formatNumber } from '../utils/string-util';

export declare type InputOnChangeData = {
  /** Updated input value from the user */
  value?: number;
};

type NumericInputProps = Omit<InputProps, 'type' | 'value' | 'onChange'> & {
  value?: number;
  decimalPlaces?: number; // Maximum decimal places allowed
  onChange?: (ev: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void;
};

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    { appearance, value, decimalPlaces = 2, onFocus, onBlur, onChange, readOnly, ...others },
    ref,
  ) => {
    const [, setIsFocused] = useState(false);
    const [formattedValue, setFormattedValue] = useState(
      value === undefined ? '' : formatNumber(value, decimalPlaces),
    );

    const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;
      const input = e.target as HTMLInputElement;
      const currentValue = input.value;

      // Get selected text
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;
      const selectedText = currentValue.substring(selectionStart, selectionEnd);

      // Allow navigation and control keys
      if (
        key === 'Backspace' ||
        key === 'Delete' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'Tab'
      ) {
        return;
      }

      // Prevent typing '.' if decimalPlaces === 0
      if (decimalPlaces === 0 && key === '.') {
        e.preventDefault();
        return;
      }

      // Allow only digits and a single decimal point
      if (!/^\d$/.test(key) && key !== '.') {
        e.preventDefault();
      } else if (key === '.') {
        // Allow typing a period if replacing a selected text that contains a period
        if (currentValue.includes('.') && !selectedText.includes('.')) {
          e.preventDefault();
        }
      }

      // Prevent exceeding allowed decimal places
      if (currentValue.includes('.') && key >= '0' && key <= '9') {
        const [, decimalPart] = currentValue.split('.');
        if (decimalPlaces && decimalPart && decimalPart.length >= decimalPlaces) {
          e.preventDefault();
        }
      }
    };

    return (
      <Input
        {...others}
        ref={ref}
        appearance={readOnly ? 'underline' : appearance}
        onBlur={(ev) => {
          setIsFocused(false);
          setFormattedValue(value === undefined ? '' : formatNumber(value, decimalPlaces)); // Reset to formatted
          if (onBlur) {
            onBlur(ev);
          }
        }}
        onChange={(ev, data) => {
          let newValue = data.value;
          const isEndWithDecimal = newValue.endsWith('.');

          if (isEndWithDecimal) {
            setFormattedValue(newValue); // Preserve trailing decimal
            onChange?.(ev, {
              value: newValue.length === 1 ? 0 : parseFloat(newValue.slice(0, -1)),
            });
          } else {
            setFormattedValue(newValue || '');
            onChange?.(ev, { value: newValue.length === 0 ? undefined : parseFloat(newValue) });
          }
        }}
        onFocus={(ev) => {
          setIsFocused(true);
          setFormattedValue(value === undefined ? '' : value.toString()); // Show raw value
          if (onFocus) {
            onFocus(ev);
          }
        }}
        onKeyDown={handleInput}
        value={formattedValue}
      />
    );
  },
);

NumericInput.displayName = 'NumericInput';
