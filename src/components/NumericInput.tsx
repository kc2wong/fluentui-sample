import React, { useState, forwardRef, useRef } from 'react';
import { Input, InputProps } from '@fluentui/react-components';
import { formatNumber } from '../utils/string-util';

export declare type InputOnChangeData = {
  /** Updated input value from the user */
  value?: number;
};

type NumericInputProps = Omit<InputProps, 'type' | 'value' | 'onChange'> & {
  value?: number;
  decimalPlaces?: number; // Maximum decimal places allowed
  onChange?: (
    ev: React.ChangeEvent<HTMLInputElement>,
    data: InputOnChangeData
  ) => void;
};

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ appearance, value, decimalPlaces, onFocus, onBlur, onChange, readOnly, ...others }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isToAppendDecimal = useRef(false);

    const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;

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

      // Allow only digits and a single decimal point
      const currentValue = (e.target as HTMLInputElement).value;
      if (!/^\d$/.test(key) && key !== '.') {
        e.preventDefault();
      } else if (key === '.' && currentValue.includes('.')) {
        e.preventDefault();
      }

      // Prevent entering additional decimal points
      if (key === '.' && (decimalPlaces === 0 || currentValue.includes('.'))) {
        e.preventDefault();
      }

      // Prevent exceeding allowed decimal places
      if (currentValue.includes('.') && key >= '0' && key <= '9') {
        const [, decimalPart] = currentValue.split('.');
        if (
          decimalPlaces &&
          decimalPart &&
          decimalPart.length >= decimalPlaces
        ) {
          e.preventDefault();
        }
      }
    };

    return (
      <Input
        {...others}
        ref={ref}
        appearance={readOnly ? 'underline' : appearance}
        value={
          value === undefined
            ? ''
            : isFocused && readOnly !== true
            ? `${value.toString()}${isToAppendDecimal.current ? '.' : ''}`
            : formatNumber(value, decimalPlaces)
        }
        onFocus={(ev) => {
          setIsFocused(true);
          if (onFocus) {
            onFocus(ev);
          }
        }}
        onBlur={(ev) => {
          setIsFocused(false);
          if (onBlur) {
            onBlur(ev);
          }
        }}
        onKeyDown={handleInput}
        onChange={(ev, data) => {
          const value = data.value;
          const isEndWithDecimal = value.endsWith('.');
          isToAppendDecimal.current = isEndWithDecimal;
          if (onChange) {
            if (isEndWithDecimal) {
              onChange(ev, {
                value:
                  value.length === 1
                    ? 0
                    : parseFloat(value.substring(0, value.length - 1)),
              });
            } else {
              onChange(ev, {
                value: value.length === 0 ? undefined : parseFloat(value),
              });
            }
          }
        }}
      />
    );
  }
);
