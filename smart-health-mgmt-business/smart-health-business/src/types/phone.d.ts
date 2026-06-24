declare module 'react-international-phone' {
  import { FC, InputHTMLAttributes } from 'react';

  export interface CountrySelectorStyleProps {
    buttonClassName?: string;
    buttonStyle?: React.CSSProperties;
    dropdownStyleProps?: {
      className?: string;
      style?: React.CSSProperties;
    };
  }

  export interface PhoneMeta {
    country: {
      dialCode: string;
      iso2: string;
      name: string;
    };
    inputValue: string;
  }

  export interface PhoneInputProps {
    value?: string;
    onChange?: (phone: string, meta: PhoneMeta) => void;
    defaultCountry?: string;
    className?: string;
    inputClassName?: string;
    containerClassName?: string;
    style?: React.CSSProperties;
    inputProps?: InputHTMLAttributes<HTMLInputElement>;
    international?: boolean;
    countrySelectorStyleProps?: CountrySelectorStyleProps;
    disableDialCodeAndPrefix?: boolean;
    showDisabledDialCodeAndPrefix?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }

  export const PhoneInput: FC<PhoneInputProps>;
}