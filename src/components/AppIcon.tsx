/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, ViewStyle } from 'react-native';

export type IconName =
  | 'dashboard'
  | 'timer'
  | 'shield'
  | 'settings'
  | 'reels'
  | 'bolt'
  | 'zen'
  | 'moon'
  | 'leaf'
  | 'lock'
  | 'target'
  | 'chart'
  | 'trophy'
  | 'flame'
  | 'share'
  | 'palette'
  | 'check'
  | 'close'
  | 'arrow-right'
  | 'sparkle'
  | 'wave'
  | 'coffee'
  | 'rain'
  | 'info'
  | 'phone'
  | 'bell'
  | 'sun'
  | 'brain'
  | 'compass'
  | 'eye'
  | 'hand'
  | 'ear'
  | 'heart'
  | 'refresh'
  | 'users'
  | 'book'
  | 'walk'
  | 'tree'
  | 'play'
  | 'pause'
  | 'alert'
  | 'calendar'
  | 'camera'
  | 'music'
  | 'ghost'
  | 'crown'
  | 'dot'
  | 'thumb-up'
  | 'thumb-down'
  | 'filter';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const AppIconComponent: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = '#6ee3ad',
  style,
}) => {
  const s = size;

  switch (name) {
    case 'dashboard':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: s * 0.12, paddingBottom: s * 0.08 }, style]}>
          <View style={{ width: s * 0.22, height: s * 0.45, backgroundColor: color, borderRadius: s * 0.06 }} />
          <View style={{ width: s * 0.22, height: s * 0.85, backgroundColor: color, borderRadius: s * 0.06 }} />
          <View style={{ width: s * 0.22, height: s * 0.6, backgroundColor: color, borderRadius: s * 0.06 }} />
        </View>
      );

    case 'timer':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.88,
              borderRadius: (s * 0.88) / 2,
              borderWidth: s * 0.1,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Hour hand */}
            <View
              style={{
                position: 'absolute',
                top: s * 0.18,
                width: s * 0.09,
                height: s * 0.25,
                backgroundColor: color,
                borderRadius: s * 0.04,
              }}
            />
            {/* Minute hand */}
            <View
              style={{
                position: 'absolute',
                left: s * 0.35,
                width: s * 0.24,
                height: s * 0.09,
                backgroundColor: color,
                borderRadius: s * 0.04,
              }}
            />
            {/* Center dot */}
            <View
              style={{
                width: s * 0.16,
                height: s * 0.16,
                borderRadius: (s * 0.16) / 2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'shield':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.84,
              height: s * 0.92,
              borderWidth: s * 0.1,
              borderColor: color,
              borderTopLeftRadius: s * 0.2,
              borderTopRightRadius: s * 0.2,
              borderBottomLeftRadius: s * 0.44,
              borderBottomRightRadius: s * 0.44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.24,
                height: s * 0.24,
                borderRadius: (s * 0.24) / 2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'settings':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.84,
              height: s * 0.84,
              borderRadius: (s * 0.84) / 2,
              borderWidth: s * 0.1,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.3,
                height: s * 0.3,
                borderRadius: (s * 0.3) / 2,
                borderWidth: s * 0.08,
                borderColor: color,
              }}
            />
          </View>
          {/* Cog teeth */}
          <View style={{ position: 'absolute', top: 0, width: s * 0.16, height: s * 0.16, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', bottom: 0, width: s * 0.16, height: s * 0.16, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', left: 0, width: s * 0.16, height: s * 0.16, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', right: 0, width: s * 0.16, height: s * 0.16, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'reels':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.8,
              borderWidth: s * 0.1,
              borderColor: color,
              borderRadius: s * 0.16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Play triangle */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: s * 0.3,
                borderLeftColor: color,
                borderTopWidth: s * 0.18,
                borderTopColor: 'transparent',
                borderBottomWidth: s * 0.18,
                borderBottomColor: 'transparent',
                marginLeft: s * 0.08,
              }}
            />
          </View>
        </View>
      );

    case 'bolt':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.35,
              height: s * 0.5,
              backgroundColor: color,
              transform: [{ skewX: '-24deg' }],
              borderRadius: 2,
            }}
          />
          <View
            style={{
              width: s * 0.32,
              height: s * 0.45,
              backgroundColor: color,
              transform: [{ skewX: '-24deg' }, { translateY: -s * 0.1 }, { translateX: -s * 0.08 }],
              borderRadius: 2,
            }}
          />
        </View>
      );

    case 'zen':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.9,
              height: s * 0.9,
              borderRadius: (s * 0.9) / 2,
              borderWidth: s * 0.08,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.54,
                height: s * 0.54,
                borderRadius: (s * 0.54) / 2,
                borderWidth: s * 0.08,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.22,
                  height: s * 0.22,
                  borderRadius: (s * 0.22) / 2,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'moon':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderRadius: (s * 0.85) / 2,
              borderWidth: s * 0.12,
              borderColor: color,
              borderRightColor: 'transparent',
              borderTopColor: 'transparent',
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'lock':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Shackle */}
          <View
            style={{
              width: s * 0.48,
              height: s * 0.44,
              borderWidth: s * 0.09,
              borderColor: color,
              borderTopLeftRadius: s * 0.24,
              borderTopRightRadius: s * 0.24,
              borderBottomWidth: 0,
              marginBottom: -1,
            }}
          />
          {/* Body */}
          <View
            style={{
              width: s * 0.72,
              height: s * 0.5,
              backgroundColor: color,
              borderRadius: s * 0.1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.14,
                height: s * 0.14,
                borderRadius: (s * 0.14) / 2,
                backgroundColor: '#0b0b0b',
              }}
            />
          </View>
        </View>
      );

    case 'leaf':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.75,
              height: s * 0.75,
              borderTopLeftRadius: s * 0.75,
              borderBottomRightRadius: s * 0.75,
              borderTopRightRadius: s * 0.15,
              borderBottomLeftRadius: s * 0.15,
              borderWidth: s * 0.1,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '-15deg' }],
            }}
          >
            <View
              style={{
                width: s * 0.08,
                height: s * 0.45,
                backgroundColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        </View>
      );

    case 'target':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.88,
              borderRadius: (s * 0.88) / 2,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.44,
                height: s * 0.44,
                borderRadius: (s * 0.44) / 2,
                borderWidth: s * 0.08,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.18,
                  height: s * 0.18,
                  borderRadius: (s * 0.18) / 2,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'chart':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: s * 0.1, paddingBottom: s * 0.08 }, style]}>
          <View style={{ width: s * 0.18, height: s * 0.35, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.18, height: s * 0.55, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.18, height: s * 0.85, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.18, height: s * 0.65, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'trophy':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.48,
              borderBottomLeftRadius: s * 0.32,
              borderBottomRightRadius: s * 0.32,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          />
          {/* Stem & base */}
          <View style={{ width: s * 0.14, height: s * 0.22, backgroundColor: color }} />
          <View style={{ width: s * 0.55, height: s * 0.09, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'flame':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.6,
              height: s * 0.75,
              borderTopLeftRadius: s * 0.6,
              borderBottomLeftRadius: s * 0.3,
              borderBottomRightRadius: s * 0.3,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.28,
                height: s * 0.36,
                borderRadius: s * 0.18,
                backgroundColor: '#0b0b0b',
              }}
            />
          </View>
        </View>
      );

    case 'share':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ position: 'absolute', left: s * 0.1, top: s * 0.38, width: s * 0.22, height: s * 0.22, borderRadius: s * 0.11, backgroundColor: color }} />
          <View style={{ position: 'absolute', right: s * 0.1, top: s * 0.15, width: s * 0.22, height: s * 0.22, borderRadius: s * 0.11, backgroundColor: color }} />
          <View style={{ position: 'absolute', right: s * 0.1, bottom: s * 0.15, width: s * 0.22, height: s * 0.22, borderRadius: s * 0.11, backgroundColor: color }} />
          {/* Branch lines */}
          <View style={{ position: 'absolute', left: s * 0.24, top: s * 0.32, width: s * 0.5, height: s * 0.07, backgroundColor: color, transform: [{ rotate: '-28deg' }] }} />
          <View style={{ position: 'absolute', left: s * 0.24, bottom: s * 0.32, width: s * 0.5, height: s * 0.07, backgroundColor: color, transform: [{ rotate: '28deg' }] }} />
        </View>
      );

    case 'palette':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.78,
              borderRadius: s * 0.39,
              borderWidth: s * 0.09,
              borderColor: color,
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingHorizontal: s * 0.1,
            }}
          >
            <View style={{ width: s * 0.14, height: s * 0.14, borderRadius: s * 0.07, backgroundColor: color }} />
            <View style={{ width: s * 0.14, height: s * 0.14, borderRadius: s * 0.07, backgroundColor: color }} />
            <View style={{ width: s * 0.14, height: s * 0.14, borderRadius: s * 0.07, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.38,
              borderLeftWidth: s * 0.14,
              borderBottomWidth: s * 0.14,
              borderColor: color,
              transform: [{ rotate: '-45deg' }, { translateY: -s * 0.08 }],
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: s * 0.12, backgroundColor: color, borderRadius: 2, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
          <View style={{ width: s * 0.7, height: s * 0.12, backgroundColor: color, borderRadius: 2, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
        </View>
      );

    case 'arrow-right':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.55, height: s * 0.1, backgroundColor: color, borderRadius: 2 }} />
          <View
            style={{
              position: 'absolute',
              right: s * 0.2,
              width: s * 0.32,
              height: s * 0.32,
              borderTopWidth: s * 0.1,
              borderRightWidth: s * 0.1,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'sparkle':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.16, height: s * 0.85, backgroundColor: color, borderRadius: s * 0.08, position: 'absolute' }} />
          <View style={{ width: s * 0.85, height: s * 0.16, backgroundColor: color, borderRadius: s * 0.08, position: 'absolute' }} />
          <View style={{ width: s * 0.36, height: s * 0.36, borderRadius: s * 0.18, backgroundColor: color, position: 'absolute' }} />
        </View>
      );

    case 'wave':
      return (
        <View style={[{ width: s, height: s, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s * 0.08 }, style]}>
          <View style={{ width: s * 0.12, height: s * 0.4, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.12, height: s * 0.8, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.12, height: s * 0.55, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.12, height: s * 0.95, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.12, height: s * 0.35, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'coffee':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.6,
              height: s * 0.5,
              borderBottomLeftRadius: s * 0.25,
              borderBottomRightRadius: s * 0.25,
              borderWidth: s * 0.09,
              borderColor: color,
            }}
          />
          {/* Saucer */}
          <View style={{ width: s * 0.75, height: s * 0.08, backgroundColor: color, borderRadius: 2, marginTop: s * 0.06 }} />
        </View>
      );

    case 'rain':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.72,
              height: s * 0.44,
              borderRadius: s * 0.22,
              borderWidth: s * 0.09,
              borderColor: color,
            }}
          />
          <View style={{ flexDirection: 'row', gap: s * 0.14, marginTop: s * 0.08 }}>
            <View style={{ width: s * 0.07, height: s * 0.2, backgroundColor: color, transform: [{ rotate: '20deg' }], borderRadius: 2 }} />
            <View style={{ width: s * 0.07, height: s * 0.2, backgroundColor: color, transform: [{ rotate: '20deg' }], borderRadius: 2 }} />
            <View style={{ width: s * 0.07, height: s * 0.2, backgroundColor: color, transform: [{ rotate: '20deg' }], borderRadius: 2 }} />
          </View>
        </View>
      );

    case 'info':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderRadius: (s * 0.85) / 2,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: s * 0.1, height: s * 0.1, borderRadius: s * 0.05, backgroundColor: color, marginBottom: s * 0.06 }} />
            <View style={{ width: s * 0.1, height: s * 0.32, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'phone':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.6,
              height: s * 0.9,
              borderRadius: s * 0.12,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: s * 0.06,
            }}
          >
            <View style={{ width: s * 0.2, height: s * 0.05, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: s * 0.12, height: s * 0.12, borderRadius: s * 0.06, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'bell':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.55,
              borderTopLeftRadius: s * 0.32,
              borderTopRightRadius: s * 0.32,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          />
          <View style={{ width: s * 0.78, height: s * 0.08, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.16, height: s * 0.1, borderRadius: s * 0.08, backgroundColor: color, marginTop: 1 }} />
        </View>
      );

    case 'sun':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.44,
              height: s * 0.44,
              borderRadius: (s * 0.44) / 2,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
          {/* Rays */}
          <View style={{ position: 'absolute', top: s * 0.06, width: s * 0.08, height: s * 0.12, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', bottom: s * 0.06, width: s * 0.08, height: s * 0.12, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', left: s * 0.06, width: s * 0.12, height: s * 0.08, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', right: s * 0.06, width: s * 0.12, height: s * 0.08, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'brain':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: s * 0.06 }, style]}>
          <View
            style={{
              width: s * 0.36,
              height: s * 0.64,
              borderTopLeftRadius: s * 0.18,
              borderBottomLeftRadius: s * 0.18,
              borderTopRightRadius: s * 0.08,
              borderBottomRightRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: s * 0.36,
              height: s * 0.64,
              borderTopRightRadius: s * 0.18,
              borderBottomRightRadius: s * 0.18,
              borderTopLeftRadius: s * 0.08,
              borderBottomLeftRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'compass':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderRadius: (s * 0.85) / 2,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.12,
                height: s * 0.44,
                backgroundColor: color,
                borderRadius: 2,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        </View>
      );

    case 'eye':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.86,
              height: s * 0.52,
              borderRadius: s * 0.26,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.22,
                height: s * 0.22,
                borderRadius: (s * 0.22) / 2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'hand':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.52,
              height: s * 0.62,
              borderTopLeftRadius: s * 0.16,
              borderTopRightRadius: s * 0.16,
              borderBottomLeftRadius: s * 0.12,
              borderBottomRightRadius: s * 0.12,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: s * 0.14,
              top: s * 0.36,
              width: s * 0.14,
              height: s * 0.26,
              borderRadius: s * 0.07,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'ear':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.54,
              height: s * 0.76,
              borderTopLeftRadius: s * 0.27,
              borderBottomLeftRadius: s * 0.27,
              borderTopRightRadius: s * 0.1,
              borderBottomRightRadius: s * 0.27,
              borderWidth: s * 0.09,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.14,
                height: s * 0.22,
                borderRadius: s * 0.07,
                borderWidth: s * 0.07,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'heart':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.44,
              height: s * 0.44,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
              borderTopLeftRadius: s * 0.22,
              borderTopRightRadius: s * 0.22,
            }}
          />
        </View>
      );

    case 'refresh':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.74,
              height: s * 0.74,
              borderRadius: (s * 0.74) / 2,
              borderWidth: s * 0.09,
              borderColor: color,
              borderRightColor: 'transparent',
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: s * 0.12,
              right: s * 0.18,
              width: s * 0.22,
              height: s * 0.22,
              borderTopWidth: s * 0.09,
              borderRightWidth: s * 0.09,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'users':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Back user */}
          <View
            style={{
              position: 'absolute',
              right: s * 0.14,
              top: s * 0.15,
              width: s * 0.28,
              height: s * 0.28,
              borderRadius: (s * 0.28) / 2,
              borderWidth: s * 0.07,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: s * 0.08,
              bottom: s * 0.2,
              width: s * 0.44,
              height: s * 0.24,
              borderTopLeftRadius: s * 0.12,
              borderTopRightRadius: s * 0.12,
              borderWidth: s * 0.07,
              borderColor: color,
            }}
          />
          {/* Front user */}
          <View
            style={{
              position: 'absolute',
              left: s * 0.16,
              top: s * 0.24,
              width: s * 0.32,
              height: s * 0.32,
              borderRadius: (s * 0.32) / 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: s * 0.08,
              bottom: s * 0.1,
              width: s * 0.48,
              height: s * 0.28,
              borderTopLeftRadius: s * 0.14,
              borderTopRightRadius: s * 0.14,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'book':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: s * 0.04 }, style]}>
          <View
            style={{
              width: s * 0.38,
              height: s * 0.54,
              borderTopLeftRadius: s * 0.08,
              borderBottomLeftRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: s * 0.38,
              height: s * 0.54,
              borderTopRightRadius: s * 0.08,
              borderBottomRightRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'walk':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Head */}
          <View style={{ width: s * 0.2, height: s * 0.2, borderRadius: s * 0.1, backgroundColor: color, marginBottom: s * 0.04 }} />
          {/* Torso & angled legs */}
          <View style={{ width: s * 0.1, height: s * 0.3, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ flexDirection: 'row', gap: s * 0.12, marginTop: -s * 0.04 }}>
            <View style={{ width: s * 0.09, height: s * 0.25, backgroundColor: color, transform: [{ rotate: '20deg' }], borderRadius: 2 }} />
            <View style={{ width: s * 0.09, height: s * 0.25, backgroundColor: color, transform: [{ rotate: '-20deg' }], borderRadius: 2 }} />
          </View>
        </View>
      );

    case 'tree':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.3,
              borderRightWidth: s * 0.3,
              borderBottomWidth: s * 0.45,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          <View style={{ width: s * 0.12, height: s * 0.2, backgroundColor: color, marginTop: 1 }} />
        </View>
      );

    case 'play':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.48,
              borderLeftColor: color,
              borderTopWidth: s * 0.28,
              borderTopColor: 'transparent',
              borderBottomWidth: s * 0.28,
              borderBottomColor: 'transparent',
              marginLeft: s * 0.1,
            }}
          />
        </View>
      );

    case 'pause':
      return (
        <View style={[{ width: s, height: s, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s * 0.16 }, style]}>
          <View style={{ width: s * 0.16, height: s * 0.56, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ width: s * 0.16, height: s * 0.56, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'alert':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.42,
              borderRightWidth: s * 0.42,
              borderBottomWidth: s * 0.72,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          <View style={{ position: 'absolute', top: s * 0.38, width: s * 0.08, height: s * 0.22, backgroundColor: '#09130e', borderRadius: 1 }} />
          <View style={{ position: 'absolute', top: s * 0.66, width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: '#09130e' }} />
        </View>
      );

    case 'calendar':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.74,
              height: s * 0.7,
              borderRadius: s * 0.1,
              borderWidth: s * 0.08,
              borderColor: color,
              paddingTop: s * 0.14,
            }}
          >
            <View style={{ width: '100%', height: s * 0.06, backgroundColor: color }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: s * 0.08 }}>
              <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color }} />
              <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color }} />
              <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color }} />
            </View>
          </View>
          {/* Top binder rings */}
          <View style={{ position: 'absolute', top: s * 0.08, left: s * 0.26, width: s * 0.08, height: s * 0.12, backgroundColor: color, borderRadius: 2 }} />
          <View style={{ position: 'absolute', top: s * 0.08, right: s * 0.26, width: s * 0.08, height: s * 0.12, backgroundColor: color, borderRadius: 2 }} />
        </View>
      );

    case 'camera':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.24, height: s * 0.08, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2, marginBottom: -1 }} />
          <View
            style={{
              width: s * 0.8,
              height: s * 0.6,
              borderRadius: s * 0.12,
              borderWidth: s * 0.08,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: (s * 0.28) / 2,
                borderWidth: s * 0.07,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'music':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.62, height: s * 0.14, backgroundColor: color, borderRadius: 2, marginBottom: -s * 0.02 }} />
          <View style={{ width: s * 0.62, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: s * 0.09, height: s * 0.44, backgroundColor: color }} />
            <View style={{ width: s * 0.09, height: s * 0.44, backgroundColor: color }} />
          </View>
          <View style={{ width: s * 0.72, flexDirection: 'row', justifyContent: 'space-between', marginTop: -s * 0.08 }}>
            <View style={{ width: s * 0.2, height: s * 0.16, borderRadius: s * 0.08, backgroundColor: color }} />
            <View style={{ width: s * 0.2, height: s * 0.16, borderRadius: s * 0.08, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'ghost':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.7,
              height: s * 0.72,
              borderTopLeftRadius: s * 0.35,
              borderTopRightRadius: s * 0.35,
              borderWidth: s * 0.08,
              borderColor: color,
              alignItems: 'center',
              paddingTop: s * 0.16,
            }}
          >
            <View style={{ flexDirection: 'row', gap: s * 0.14 }}>
              <View style={{ width: s * 0.09, height: s * 0.09, borderRadius: s * 0.045, backgroundColor: color }} />
              <View style={{ width: s * 0.09, height: s * 0.09, borderRadius: s * 0.045, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    case 'crown':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.74,
              height: s * 0.42,
              borderWidth: s * 0.08,
              borderColor: color,
              borderTopWidth: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              paddingHorizontal: 2,
            }}
          >
            <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color, marginTop: -s * 0.1 }} />
            <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color, marginTop: -s * 0.18 }} />
            <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: color, marginTop: -s * 0.1 }} />
          </View>
          <View style={{ width: s * 0.74, height: s * 0.08, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case 'thumb-up':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.44,
              height: s * 0.44,
              borderRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
              marginTop: s * 0.16,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: s * 0.1,
              left: s * 0.28,
              width: s * 0.22,
              height: s * 0.36,
              borderTopLeftRadius: s * 0.1,
              borderTopRightRadius: s * 0.1,
              borderWidth: s * 0.08,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      );

    case 'thumb-down':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.44,
              height: s * 0.44,
              borderRadius: s * 0.08,
              borderWidth: s * 0.08,
              borderColor: color,
              marginBottom: s * 0.16,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: s * 0.1,
              left: s * 0.28,
              width: s * 0.22,
              height: s * 0.36,
              borderBottomLeftRadius: s * 0.1,
              borderBottomRightRadius: s * 0.1,
              borderWidth: s * 0.08,
              borderColor: color,
              borderTopWidth: 0,
            }}
          />
        </View>
      );

    case 'filter':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.1,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: s * 0.08,
            }}
          />
          <View
            style={{
              width: s * 0.44,
              height: s * 0.1,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: s * 0.08,
            }}
          />
          <View
            style={{
              width: s * 0.22,
              height: s * 0.1,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'dot':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.48,
              height: s * 0.48,
              borderRadius: (s * 0.48) / 2,
              backgroundColor: color,
            }}
          />
        </View>
      );

    default:
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.5, height: s * 0.5, borderRadius: (s * 0.5) / 2, backgroundColor: color }} />
        </View>
      );
  }
};

export const AppIcon = React.memo(AppIconComponent);

