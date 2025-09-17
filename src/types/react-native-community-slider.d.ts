declare module '@react-native-community/slider' {
  import type {ComponentType} from 'react';
  import type {ViewProps} from 'react-native';

  export interface SliderProps extends ViewProps {
    value?: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
  }

  const Slider: ComponentType<SliderProps>;
  export default Slider;
}