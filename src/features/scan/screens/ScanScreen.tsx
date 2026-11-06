import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing,
  type ViewInstance,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';

import type { ScanOrigin } from '../../../components/ui/footer';
import { Text } from '../../../components/ui/Text';

type ScanState = 'idle' | 'error' | 'receipt' | 'text';

type Viewport = {
  x: number;
  y: number;
  width: number;
  height: number;
  ready: boolean;
};

type Props = {
  origin?: ScanOrigin;
};

export default function ScanScreen({ origin }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  const { width: windowWidth, height: windowHeight } =
    useWindowDimensions();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [rawText, setRawText] = useState('');

  const containerRef = useRef<ViewInstance>(null);

  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    width: windowWidth,
    height: windowHeight,
    ready: false,
  });

  // Анимация появления камеры
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 0 = координаты кнопки, 1 = центр экрана
  const flyProgress = useRef(
    new Animated.Value(origin ? 0 : 1),
  ).current;

  // Бесконечное движение лазера
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Анимация карточки результата
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const laserLoopRef =
    useRef<Animated.CompositeAnimation | null>(null);

  const canScanRef = useRef(false);

  const frameSize = viewport.width * 0.75;
  const laserHeight = 4;

  const cornerSize = 60;
  const borderWidth = 5;
  const borderRadius = 48;

  // Получаем координаты именно контейнера сканера в окне
  const measureContainer = () => {
    containerRef.current?.measureInWindow(
      (x, y, width, height) => {
        if (!width || !height) return;

        setViewport((previous) => {
          if (
            previous.ready &&
            Math.abs(previous.x - x) < 0.5 &&
            Math.abs(previous.y - y) < 0.5 &&
            Math.abs(previous.width - width) < 0.5 &&
            Math.abs(previous.height - height) < 0.5
          ) {
            return previous;
          }

          return {
            x,
            y,
            width,
            height,
            ready: true,
          };
        });
      },
    );
  };

  // Рассчитываем начальную позицию относительно контейнера
  const startX = origin
    ? origin.x +
      origin.width / 2 -
      (viewport.x + viewport.width / 2)
    : 0;

  const startY = origin
    ? origin.y +
      origin.height / 2 -
      (viewport.y + viewport.height / 2)
    : 0;

  const translateX = flyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, 0],
  });

  const translateY = flyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, 0],
  });

  const frameScale = flyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      origin && frameSize > 0
        ? Math.min(origin.width, origin.height) / frameSize
        : 1,
      1,
    ],
  });

  // Камера появляется, рамка вылетает из Footer,
  // лазер запускается только после завершения вылета
  useEffect(() => {
    if (!viewport.ready) return;

    let cancelled = false;

    canScanRef.current = false;

    laserLoopRef.current?.stop();
    laserLoopRef.current = null;
    laserAnim.stopAnimation();
    laserAnim.setValue(0);

    fadeAnim.stopAnimation();
    flyProgress.stopAnimation();

    fadeAnim.setValue(0);
    flyProgress.setValue(origin ? 0 : 1);

    const frameAnimation = origin
      ? Animated.spring(flyProgress, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      : Animated.timing(flyProgress, {
          toValue: 1,
          duration: 1,
          useNativeDriver: true,
        });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      frameAnimation,
    ]).start(({ finished }) => {
      if (!finished || cancelled) return;

      canScanRef.current = true;

      laserAnim.setValue(0);

      laserLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),

          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      laserLoopRef.current.start();
    });

    return () => {
      cancelled = true;
      canScanRef.current = false;

      fadeAnim.stopAnimation();
      flyProgress.stopAnimation();
      laserAnim.stopAnimation();

      laserLoopRef.current?.stop();
      laserLoopRef.current = null;
    };
  }, [
    origin?.x,
    origin?.y,
    origin?.width,
    origin?.height,
    viewport.ready,
    viewport.x,
    viewport.y,
    viewport.width,
    viewport.height,
    fadeAnim,
    flyProgress,
    laserAnim,
  ]);

  // Анимация карточки результата
  useEffect(() => {
    if (scanState !== 'idle') {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),

        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      cardScale.setValue(0.8);
      cardOpacity.setValue(0);
    }
  }, [scanState, cardScale, cardOpacity]);

  // Обработка QR-кода
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!canScanRef.current || scanState !== 'idle') {
      return;
    }

    setRawText(data);

    const normalizedData = data.toLowerCase();

    if (normalizedData.includes('error')) {
      setScanState('error');
    } else if (normalizedData.includes('receipt')) {
      setScanState('receipt');
    } else {
      setScanState('text');
    }
  };

  const laserY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, frameSize - laserHeight)],
  });

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5C0A0A" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Нет доступа к камере
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => requestPermission()}
        >
          <Text style={styles.permissionButtonText}>
            Разрешить доступ
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      ref={containerRef}
      collapsable={false}
      onLayout={measureContainer}
      style={styles.container}
    >
      {/* Камера проявляется отдельно от рамки */}
      <Animated.View
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: fadeAnim,
  }}
>
  <CameraView
    style={StyleSheet.absoluteFill}
    facing="back"
    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    onBarcodeScanned={
      scanState === 'idle' ? handleBarcodeScanned : undefined
    }
  />
</Animated.View>
      {}
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View
          style={{
            width: frameSize,
            height: frameSize,
            position: 'relative',
            transform: [
              { translateX },
              { translateY },
            ],
          }}
        >
          <Animated.View
            style={{
              width: frameSize,
              height: frameSize,
              position: 'relative',
              transform: [{ scale: frameScale }],
            }}
          >
            {/* Верхний левый угол */}
            <View
              style={[
                styles.corner,
                {
                  width: cornerSize,
                  height: cornerSize,
                  top: 0,
                  left: 0,
                  borderTopWidth: borderWidth,
                  borderLeftWidth: borderWidth,
                  borderTopLeftRadius: borderRadius,
                },
              ]}
            />

            {/* Верхний правый угол */}
            <View
              style={[
                styles.corner,
                {
                  width: cornerSize,
                  height: cornerSize,
                  top: 0,
                  right: 0,
                  borderTopWidth: borderWidth,
                  borderRightWidth: borderWidth,
                  borderTopRightRadius: borderRadius,
                },
              ]}
            />

            {/* Нижний левый угол */}
            <View
              style={[
                styles.corner,
                {
                  width: cornerSize,
                  height: cornerSize,
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: borderWidth,
                  borderLeftWidth: borderWidth,
                  borderBottomLeftRadius: borderRadius,
                },
              ]}
            />

            {/* Нижний правый угол */}
            <View
              style={[
                styles.corner,
                {
                  width: cornerSize,
                  height: cornerSize,
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: borderWidth,
                  borderRightWidth: borderWidth,
                  borderBottomRightRadius: borderRadius,
                },
              ]}
            />

            {/* Лазер появляется после приземления рамки */}
            {scanState === 'idle' && (
              <Animated.View
                style={[
                  styles.laser,
                  {
                    transform: [{ translateY: laserY }],
                  },
                ]}
              />
            )}
          </Animated.View>
        </Animated.View>
      </View>

      {/* Карточка результата */}
      {scanState !== 'idle' && (
        <View style={styles.cardContainer}>
          <Animated.View
            style={{
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            }}
          >
            <BlurView
              intensity={50}
              tint="dark"
              style={styles.glassCard}
            >
              <View
                style={styles.glareTopLeft}
                pointerEvents="none"
              />

              <View
                style={styles.glareTopRight}
                pointerEvents="none"
              />

              {scanState === 'error' && (
                <Text style={styles.cardText}>
                  КОНТЕНТ{'\n'}НЕ БЫЛ{'\n'}НАЙДЕН
                </Text>
              )}

              {scanState === 'receipt' && (
                <Text style={styles.cardText}>
                  чек с вашей{'\n'}покупки{'\n'}был получен
                </Text>
              )}

              {scanState === 'text' && (
                <Text style={styles.cardText}>
                  {rawText}
                </Text>
              )}

              <TouchableOpacity
                style={styles.closeHint}
                onPress={() => {
                  setRawText('');
                  setScanState('idle');
                }}
              >
                <Text style={styles.closeHintText}>
                  Нажмите, чтобы закрыть
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#414141',
    overflow: 'hidden',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#414141',
    gap: 16,
  },

  permissionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },

  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#640000',
  },

  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  corner: {
    position: 'absolute',
    borderColor: 'rgba(230, 230, 240, 0.85)',
  },

  laser: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: '#FF453A',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },

  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  glassCard: {
    width: 280,
    height: 280,
    backgroundColor: 'rgba(65, 65, 75, 0.55)',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  cardText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },

  glareTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  glareTopRight: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  closeHint: {
    position: 'absolute',
    bottom: 15,
    padding: 8,
  },

  closeHintText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
});