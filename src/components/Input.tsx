import { forwardRef } from 'react';
import { Input as FluentUiInput, InputProps } from '@fluentui/react-components';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ appearance, readOnly, ...others }, ref) => {
    return (
      <FluentUiInput
        {...others}
        appearance={readOnly ? 'underline' : appearance}
        readOnly={readOnly}
        ref={ref}
      />
    );
  }
);
