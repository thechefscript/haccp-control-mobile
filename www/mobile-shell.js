(() => {
  'use strict';
  const native = !!window.Capacitor?.isNativePlatform?.();
  if (native) {
    document.documentElement.classList.add('capacitor-native');
    document.documentElement.dataset.platform = window.Capacitor.getPlatform?.() || 'native';
  }
})();
