import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {ParentalGate} from '../src/parentalGate';

// A stable, non-random pad keeps the test asserting behaviour, not luck.
jest.mock('../src/parentalGate/randomizedPad', () => {
  const actual = jest.requireActual('../src/parentalGate/randomizedPad');
  return {...actual, shuffledDigits: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]};
});

const cfg = {pin: '2468', idleDismissMs: 10_000_000, recoveryHoldMs: 5000};

function enter(getByLabelText: (l: string) => unknown, pin: string) {
  for (const d of pin.split('')) {
    fireEvent.press(getByLabelText(`Digit ${d}`) as never);
  }
}

describe('ParentalGate', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('opens straight to the PIN pad and unlocks on the correct PIN', () => {
    const onUnlock = jest.fn();
    const {getByText, getByLabelText} = render(
      <ParentalGate open config={cfg} onUnlock={onUnlock} onClose={jest.fn()} />,
    );

    expect(getByText(/Enter your PIN/i)).toBeTruthy();
    enter(getByLabelText, '2468');
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('does not unlock on a wrong PIN', () => {
    const onUnlock = jest.fn();
    const {getByLabelText} = render(
      <ParentalGate open config={cfg} onUnlock={onUnlock} onClose={jest.fn()} />,
    );

    enter(getByLabelText, '1357');
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it('offers a Forgot PIN? hold-to-exit fallback', () => {
    const onUnlock = jest.fn();
    const {getByText} = render(
      <ParentalGate open config={cfg} onUnlock={onUnlock} onClose={jest.fn()} />,
    );

    fireEvent.press(getByText('Forgot PIN?'));
    // The recovery view is shown.
    expect(getByText(/Hold to exit/i)).toBeTruthy();

    // Holding for the full duration exits without the PIN.
    fireEvent(getByText('Hold to exit'), 'pressIn');
    jest.advanceTimersByTime(5000);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('cancels the recovery hold if released early', () => {
    const onUnlock = jest.fn();
    const {getByText} = render(
      <ParentalGate open config={cfg} onUnlock={onUnlock} onClose={jest.fn()} />,
    );

    fireEvent.press(getByText('Forgot PIN?'));
    fireEvent(getByText('Hold to exit'), 'pressIn');
    jest.advanceTimersByTime(2000);
    fireEvent(getByText('Hold to exit'), 'pressOut');
    jest.advanceTimersByTime(5000);
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
