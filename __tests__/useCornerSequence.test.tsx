import {act, renderHook} from '@testing-library/react-native';
import {useCornerSequence} from '../src/parentalGate/useCornerSequence';
import type {Corner} from '../src/parentalGate/types';

const ORDER: Corner[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

describe('useCornerSequence', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('completes when all four corners are tapped in order', () => {
    const onComplete = jest.fn();
    const {result} = renderHook(() =>
      useCornerSequence({timeoutMs: 4000, onComplete}),
    );

    ORDER.forEach(corner => act(() => result.current.press(corner)));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets progress when a wrong corner is tapped', () => {
    const onComplete = jest.fn();
    const {result} = renderHook(() =>
      useCornerSequence({timeoutMs: 4000, onComplete}),
    );

    act(() => result.current.press('topLeft'));
    act(() => result.current.press('bottomLeft')); // wrong -> reset
    expect(result.current.progress).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('forgives an immediate repeat of the last correct corner', () => {
    const onComplete = jest.fn();
    const {result} = renderHook(() =>
      useCornerSequence({timeoutMs: 4000, onComplete}),
    );

    act(() => result.current.press('topLeft'));
    act(() => result.current.press('topLeft')); // repeat -> ignored, not reset
    expect(result.current.progress).toBe(1);
  });

  it('resets after the timeout elapses between taps', () => {
    const onComplete = jest.fn();
    const {result} = renderHook(() =>
      useCornerSequence({timeoutMs: 4000, onComplete}),
    );

    act(() => result.current.press('topLeft'));
    act(() => result.current.press('topRight'));
    expect(result.current.progress).toBe(2);

    act(() => jest.advanceTimersByTime(4001));
    expect(result.current.progress).toBe(0);

    // A late continuation should not complete the sequence.
    act(() => result.current.press('bottomRight'));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
