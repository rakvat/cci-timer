import { createElement, Fragment } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type LabeledNumberInputProps = Pick<
  TextInputProps,
  | 'editable'
  | 'onChangeText'
  | 'onFocus'
  | 'onSubmitEditing'
  | 'placeholder'
  | 'returnKeyType'
  | 'style'
  | 'value'
> & {
  label: string;
  disabled?: boolean;
};

export function LabeledNumberInput({
  label,
  disabled = false,
  style,
  ...inputProps
}: LabeledNumberInputProps) {
  const theme = useTheme();

  return createElement(
    Fragment,
    null,
    createElement(ThemedText, { type: 'default' }, label),
    createElement(TextInput, {
      accessibilityLabel: label,
      keyboardType: 'number-pad',
      maxLength: 2,
      placeholderTextColor: theme.textSecondary,
      returnKeyType: inputProps.returnKeyType ?? 'done',
      style: [
        styles.input,
        { color: theme.text, borderColor: theme.backgroundSelected },
        style,
        disabled && styles.disabled,
      ],
      ...inputProps,
    }),
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
});
