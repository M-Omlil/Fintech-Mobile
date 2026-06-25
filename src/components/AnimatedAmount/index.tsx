import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import { AmountText, type AmountTextProps } from "@components/AmountText";

/**
 * Animate a number from its previous value to `target` (count-up). Returns the live value
 * each frame. Drives the dashboard "wow" reveal — re-runs whenever `target` changes (e.g.
 * a filter switch) so figures morph rather than jump.
 */
export function useCountUp(target: number, duration = 900): number {
  const anim = useRef(new Animated.Value(0)).current;
  const fromRef = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setDisplay(target);
      return;
    }
    anim.setValue(0);
    const id = anim.addListener(({ value }) => setDisplay(from + delta * value));
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        fromRef.current = target;
        setDisplay(target);
      }
    });
    return () => anim.removeListener(id);
  }, [target, duration, anim]);

  return display;
}

export type AnimatedAmountProps = AmountTextProps & { duration?: number };

/** {@link AmountText} that counts up to its value on mount and whenever the value changes. */
export function AnimatedAmount({ value, duration, ...rest }: AnimatedAmountProps) {
  const live = useCountUp(value, duration);
  return <AmountText value={Math.round(live)} {...rest} />;
}
