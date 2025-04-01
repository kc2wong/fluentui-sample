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
    const [isFocused, setIsFocused] = useState(false);
    const [formattedValue, setFormattedValue] = useState('');

    const newFormattedValue = formatNumber(value, decimalPlaces);
    if (!isFocused && newFormattedValue !== formattedValue) {
      setFormattedValue(newFormattedValue);
    }

    const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;
      const input = e.target as HTMLInputElement;
      const currentValue = input.value;

      // Get selected text
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;
      const selectedText = currentValue.substring(selectionStart, selectionEnd);

      // Allow navigation
      if (key === 'Tab') {
        return;
      }

      if (readOnly) {
        e.preventDefault();
        return;
      } else if (
        key === 'Backspace' ||
        key === 'Delete' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'Tab'
      ) {
        // Allow navigation and control keys
        return;
      }
      // if (readOnly && key !== 'Tab') {
      //   e.preventDefault();
      //   return;
      // }

      // // Allow navigation and control keys
      // if (
      //   key === 'Backspace' ||
      //   key === 'Delete' ||
      //   key === 'ArrowLeft' ||
      //   key === 'ArrowRight' ||
      //   key === 'Tab'
      // ) {
      //   return;
      // }

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
          const newStrValue = data.value;
          const isEndWithDecimal = newStrValue.endsWith('.');

          setFormattedValue(newStrValue || '');
          const newValue = isEndWithDecimal
            ? newStrValue.length === 1
              ? 0 // "." means 0
              : parseFloat(newStrValue.slice(0, -1)) // remove trailing period
            : newStrValue.length === 0
              ? undefined // empty string
              : parseFloat(newStrValue);
          if (newValue != value) {
            onChange?.(ev, {
              value: newValue,
            });
          }
        }}
        onFocus={(ev) => {
          setIsFocused(true);
          if (!readOnly) {
            setFormattedValue(value === undefined ? '' : value.toString()); // Show raw value
          }
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
