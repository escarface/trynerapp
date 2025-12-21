import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewProps,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme';

export interface ScreenProps {
  /** Children components */
  children: React.ReactNode;
  /** Whether the screen should scroll */
  scroll?: boolean;
  /** SafeAreaView edges to apply */
  safeAreaEdges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  /** Background color */
  backgroundColor?: string;
  /** Container style */
  style?: ViewProps['style'];
  /** Content container style (for ScrollView) */
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Whether to use KeyboardAvoidingView */
  keyboardAvoiding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  safeAreaEdges = ['top', 'bottom'],
  backgroundColor = colors.neutral.background,
  style,
  contentContainerStyle,
  keyboardAvoiding = false,
}) => {
  const containerStyle = [styles.container, { backgroundColor }, style];

  const content = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContentContainer, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={containerStyle} edges={safeAreaEdges}>
      {wrappedContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContentContainer: {
    flexGrow: 1,
  },

  keyboardAvoidingView: {
    flex: 1,
  },
});

export default Screen;
