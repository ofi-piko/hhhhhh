import React from 'react';
import { Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import type { TextProps, TextInputProps } from 'react-native';

const fontStyle = { fontFamily: 'Volkhov' } as const;

export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[fontStyle, style]} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[fontStyle, style]} />;
}
