import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { screenPadding, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';

type Props = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard shell for any screen containing a form (FitTrack guidelines §10). Gives every form the
 * same keyboard behavior instead of each screen inventing its own:
 *
 * - the focused field can always be scrolled clear of the keyboard, since the content scrolls;
 * - `keyboardShouldPersistTaps="handled"` makes buttons fire on the *first* tap while the keyboard
 *   is open (the default swallows that tap just to dismiss the keyboard) while taps on blank space
 *   still dismiss it;
 * - dragging the list dismisses the keyboard.
 *
 * Android resizes the window itself (`softwareKeyboardLayoutMode: "resize"` in app.json), so only
 * iOS needs the padding behavior — applying it on both would double-count the keyboard height.
 */
export function KeyboardAwareScreen({ children, contentContainerStyle }: Props) {
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: screenPadding,
    gap: spacing.md,
  },
});
