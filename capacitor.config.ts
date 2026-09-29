import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.thechefscript.haccpcontrol',
  appName: 'HACCP Control',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#ffffff'
  }
};

export default config;
