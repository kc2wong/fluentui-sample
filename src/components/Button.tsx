import {
  Button as FluentUiButton,
  ButtonProps as FluentUiButtonButtonProps,
} from '@fluentui/react-components';

type ButtonProps = FluentUiButtonButtonProps;

export const Button: React.FC<ButtonProps> = (props) => {
  return <FluentUiButton {...props}></FluentUiButton>;
};

Button.displayName = 'Button';
