import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type LabeledNumberInputProps = Pick<
  TextInputProps,
  'maxLength' | 'onChangeText' | 'onFocus' | 'onSubmitEditing' | 'placeholder' | 'returnKeyType' | 'style' | 'value'
> & {
  label: string;
  disabled?: boolean;
};

export function LabeledNumberInput({
  label,
  disabled = false,
  returnKeyType = 'done',
  style,
  ...inputProps
}: LabeledNumberInputProps) {
  const theme = useTheme();

  return (
    <>
      <ThemedText type="default">{label}</ThemedText>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        editable={!disabled}
        keyboardType="number-pad"
        placeholderTextColor={theme.textSecondary}
        returnKeyType={returnKeyType}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.backgroundSelected },
          style,
          disabled && styles.disabled,
        ]}
      />
    </>
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
