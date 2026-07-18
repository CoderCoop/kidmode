import React from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KioskProvider} from './src/kiosk';
import {Sandbox} from './src/shell';
import {palette} from './src/theme/theme';

/**
 * App root.
 *
 * Provider order matters:
 *   GestureHandlerRootView  — required at the top for react-native-gesture-handler
 *   SafeAreaProvider        — insets for the chrome overlay
 *   KioskProvider           — enters device lockdown on mount (autoLock)
 *   Sandbox                 — the secured play surface
 */
function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KioskProvider autoLock>
          <Sandbox />
        </KioskProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvas},
});

export default App;
