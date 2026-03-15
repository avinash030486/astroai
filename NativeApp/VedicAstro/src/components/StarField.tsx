import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const STARS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 0.5,
  op: Math.random() * 0.5 + 0.1,
  dur: Math.random() * 3000 + 2000,
  delay: Math.random() * 4000,
}));

export const StarField: React.FC = () => {
  const anims = useRef(STARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    STARS.forEach((s, i) => {
      const loop = () =>
        Animated.sequence([
          Animated.timing(anims[i], { toValue: 1, duration: s.dur, useNativeDriver: true }),
          Animated.timing(anims[i], { toValue: 0, duration: s.dur, useNativeDriver: true }),
        ]).start(loop);
      setTimeout(loop, s.delay);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {STARS.map((s, i) => (
        <Animated.View
          key={s.id}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size,
            backgroundColor: '#fff',
            opacity: anims[i].interpolate({ inputRange: [0, 1], outputRange: [s.op * 0.2, s.op] }),
          }}
        />
      ))}
    </View>
  );
};
