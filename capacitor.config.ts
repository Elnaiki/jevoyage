import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cm.jevoyage.app',
  appName: 'JeVoyage',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1C3A5A',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1C3A5A',
      showSpinner: true,
      spinnerColor: '#3FCEC8',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
