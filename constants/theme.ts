export const COLORS = {
  primary: '#FC4E68FF', // Light pink as requested
  primaryDark: '#ff9aa2',
  secondary: '#b5eaea', // Light blue
  secondaryDark: '#98d6ea',
  accent: '#ffd1dc', // Softer pink
  background: '#ffffff',
  card: '#f9f9f9',
  text: '#333333',
  textLight: '#666666',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  available: '#a7f3d0', // Light green for available vehicles
  unavailable: '#fecaca', // Light red for unavailable
  pending: '#fef3c7', // Light yellow for pending status
  confirmed: '#bfdbfe', // Light blue for confirmed status
  completed: '#d1fae5', // Light green for completed status
  shadow: 'rgba(0, 0, 0, 0.05)',
  border: '#e5e7eb',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  bold: 'Poppins-Bold',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 5,
  },
};