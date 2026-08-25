import React from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
} from 'react-native';

const codeForceIcon = require('../../../assets/images/codeforce-icon.png');

type CodeForceMarkProps = Omit<ImageProps, 'source' | 'style'> & {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Branded onboarding mark. This is intentionally an Image rather than the
 * legacy Figma SVG so the first visible screen uses the same CodeForce icon
 * installed in Android launcher resources.
 */
export const CodeForceMark: React.FC<CodeForceMarkProps> = ({
  width = 112,
  height = 112,
  style,
  ...props
}) => (
  <Image
    source={codeForceIcon}
    resizeMode="contain"
    style={[{width, height}, style]}
    {...props}
  />
);
