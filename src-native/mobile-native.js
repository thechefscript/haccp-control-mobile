import { Capacitor } from '@capacitor/core';
import {
  Camera,
  MediaTypeSelection
} from '@capacitor/camera';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2pdf from 'html2pdf.js';

import { LocalNotifications } from '@capacitor/local-notifications';

function getExtension(result, blob) {
  const format = result?.metadata?.format?.toLowerCase();

  if (format === 'jpeg' || format === 'jpg') return 'jpg';
  if (format === 'png') return 'png';
  if (format === 'webp') return 'webp';

  const type = blob?.type || '';

  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';

  return 'jpg';
}

async function resultToFile(result) {
  if (!result?.webPath) {
    throw new Error('No image path returned.');
  }

  const response = await fetch(result.webPath);

  if (!response.ok) {
    throw new Error('Unable to read image.');
  }

  const blob = await response.blob();
  const extension = getExtension(result, blob);

  return new File(
    [blob],
    `haccp-evidence-${Date.now()}.${extension}`,
    {
      type: blob.type || `image/${extension}`,
      lastModified: Date.now()
    }
  );
}

async function takeEvidencePhoto() {
  try {
    const result = await Camera.takePhoto({
      quality: 80,
      targetWidth: 1600,
      targetHeight: 1200,
      correctOrientation: true,
      saveToGallery: false,
      includeMetadata: true
    });

    const file = await resultToFile(result);

    return {
      cancelled: false,
      file,
      webPath: result.webPath,
      uri: result.uri,
      metadata: result.metadata || null
    };

  } catch (error) {
    if (
      error?.code === 'OS-PLUG-CAMR-0006' ||
      /cancel/i.test(error?.message || '')
    ) {
      return { cancelled: true };
    }

    console.error('[HACCP Camera]', error);
    throw error;
  }
}

async function chooseEvidencePhoto() {
  try {
    const { results } = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
      quality: 80,
      targetWidth: 1600,
      targetHeight: 1200,
      includeMetadata: true
    });

    const result = results?.[0];

    if (!result) {
      return { cancelled: true };
    }

    const file = await resultToFile(result);

    return {
      cancelled: false,
      file,
      webPath: result.webPath,
      uri: result.uri,
      metadata: result.metadata || null
    };

  } catch (error) {
    if (/cancel/i.test(error?.message || '')) {
      return { cancelled: true };
    }

    console.error('[HACCP Gallery]', error);
    throw error;
  }
}

async function scanHaccpQr() {
  try {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      // QR_CODE = 0
      hint: 0,

      scanInstructions: 'Scan HACCP QR label',

      // BACK camera = 1
      cameraDirection: 1,

      // ADAPTIVE orientation = 3
      scanOrientation: 3,

      cancelButtonAccessibilityLabel: 'Cancel QR scanner',
      torchButtonOnAccessibilityLabel: 'Turn flashlight off',
      torchButtonOffAccessibilityLabel: 'Turn flashlight on'
    });

    const value = String(
      result?.ScanResult || ''
    ).trim();

    if (!value) {
      return { cancelled: true };
    }

    return {
      cancelled: false,
      value,
      format: result?.format ?? null
    };

  } catch (error) {

    if (/cancel/i.test(error?.message || '')) {
      return { cancelled: true };
    }

    console.error(
      '[HACCP QR Scanner]',
      error
    );

    throw error;
  }
}


function normalizePdfBase64(value) {
  const input = String(value || '').trim();

  if (!input) {
    throw new Error('PDF data is empty.');
  }

  const marker = 'base64,';
  const index = input.indexOf(marker);

  return index >= 0
    ? input.slice(index + marker.length)
    : input;
}

function safePdfFilename(value) {
  let filename = String(
    value || 'HACCP-Record.pdf'
  )
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');

  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  return filename;
}

async function writeHaccpPdfToCache(
  base64,
  filename
) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      'Native PDF storage is only available in the installed app.'
    );
  }

  const cleanBase64 =
    normalizePdfBase64(base64);

  const cleanFilename =
    safePdfFilename(filename);

  const result =
    await Filesystem.writeFile({
      path: `haccp-reports/${cleanFilename}`,
      data: cleanBase64,
      directory: Directory.Cache,
      recursive: true
    });

  return {
    filename: cleanFilename,
    uri: result.uri
  };
}

async function saveHaccpPdfBase64(options = {}) {
  return writeHaccpPdfToCache(
    options.base64,
    options.filename
  );
}

async function shareHaccpPdfBase64(options = {}) {
  const file =
    await writeHaccpPdfToCache(
      options.base64,
      options.filename
    );

  const supported =
    await Share.canShare();

  if (!supported.value) {
    throw new Error(
      'Native sharing is not available on this device.'
    );
  }

  await Share.share({
    title:
      options.title ||
      'HACCP Record',

    text:
      options.text ||
      'HACCP record exported from HACCP Control.',

    files: [
      file.uri
    ],

    dialogTitle:
      'Share HACCP PDF'
  });

  return file;
}


async function shareHaccpPdfHtml(options = {}) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      'Native PDF sharing is only available in the installed app.'
    );
  }

  const html = String(options.html || '').trim();

  if (!html) {
    throw new Error('HACCP report HTML is empty.');
  }

  const filename = safePdfFilename(
    options.filename || 'HACCP-Record.pdf'
  );

  const pdfDataUri = await html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape'
      },
      pagebreak: {
        mode: ['css', 'legacy']
      }
    })
    .from(html, 'string')
    .toPdf()
    .outputPdf('datauristring');

  return shareHaccpPdfBase64({
    base64: pdfDataUri,
    filename,
    title: options.title || 'HACCP Record',
    text:
      options.text ||
      'HACCP record exported from HACCP Control.'
  });
}

/* =========================================================
   MOBILE 1.4 - SAFE LOCAL NOTIFICATIONS

   IMPORTANT:
   These functions DO NOT run during app boot/login.
   They execute only when explicitly called.
========================================================= */

async function requestHaccpNotificationPermission() {
  if (!Capacitor.isNativePlatform()) {
    return {
      granted: false,
      display: 'unsupported'
    };
  }

  let permission =
    await LocalNotifications.checkPermissions();

  if (permission.display !== 'granted') {
    permission =
      await LocalNotifications.requestPermissions();
  }

  return {
    granted:
      permission.display === 'granted',

    display:
      permission.display
  };
}

async function sendHaccpNotification(options = {}) {
  if (!Capacitor.isNativePlatform()) {
    return {
      sent: false,
      reason: 'not-native'
    };
  }

  const permission =
    await requestHaccpNotificationPermission();

  if (!permission.granted) {
    return {
      sent: false,
      reason: 'permission-denied'
    };
  }

  const requestedId =
    Number(options.id);

  const id =
    Number.isInteger(requestedId)
      ? requestedId
      : Math.floor(Date.now() / 1000) % 2000000000;

  await LocalNotifications.schedule({
    notifications: [
      {
        id,

        title:
          String(
            options.title ||
            'HACCP Control'
          ),

        body:
          String(
            options.body ||
            'HACCP attention required.'
          ),

        extra:
          options.extra || {}
      }
    ]
  });

  return {
    sent: true,
    id
  };
}

async function cancelHaccpNotification(id) {
  if (!Capacitor.isNativePlatform()) {
    return {
      cancelled: false
    };
  }

  const notificationId =
    Number(id);

  if (!Number.isInteger(notificationId)) {
    return {
      cancelled: false
    };
  }

  await LocalNotifications.cancel({
    notifications: [
      {
        id: notificationId
      }
    ]
  });

  try {
    const delivered =
      await LocalNotifications.getDeliveredNotifications();

    const matches =
      (delivered.notifications || [])
        .filter(
          notification =>
            notification.id === notificationId
        );

    if (matches.length) {
      await LocalNotifications.removeDeliveredNotifications({
        notifications: matches
      });
    }

  } catch (error) {
    console.warn(
      '[HACCP Notification Cleanup]',
      error
    );
  }

  return {
    cancelled: true,
    id: notificationId
  };
}


window.HACCPMobile = {
  isNative() {
    return Capacitor.isNativePlatform();
  },

  getPlatform() {
    return Capacitor.getPlatform();
  },

  takeEvidencePhoto,

  chooseEvidencePhoto,

  scanQr: scanHaccpQr,

  notify: sendHaccpNotification,

  cancelNotification: cancelHaccpNotification,

  savePdfBase64: saveHaccpPdfBase64,

  sharePdfBase64: shareHaccpPdfBase64,

  sharePdfHtml: shareHaccpPdfHtml
};

console.log(
  `[HACCP Mobile] Native bridge ready: ${Capacitor.getPlatform()}`
);
/* =========================================================
   MOBILE 1.1 PHOTO INPUT BRIDGE
   Native Camera / Gallery -> existing HACCP photo inputs
========================================================= */

function putNativeFileIntoInput(input, file) {
  const transfer = new DataTransfer();

  transfer.items.add(file);
  input.files = transfer.files;

  input.dispatchEvent(
    new Event('change', {
      bubbles: true
    })
  );
}


async function useNativePhotoSource(input, source) {
  try {
    const result =
      source === 'camera'
        ? await window.HACCPMobile.takeEvidencePhoto()
        : await window.HACCPMobile.chooseEvidencePhoto();

    if (
      !result ||
      result.cancelled ||
      !result.file
    ) {
      return;
    }

    putNativeFileIntoInput(
      input,
      result.file
    );

  } catch (error) {

    console.error(
      `[HACCP Mobile] ${source} failed:`,
      error
    );

    /*
      Fallback to the existing HTML file input.
    */

    if (source === 'gallery') {

      const capture =
        input.getAttribute('capture');

      input.removeAttribute('capture');

      input.click();

      if (capture !== null) {
        setTimeout(
          () => input.setAttribute(
            'capture',
            capture
          ),
          500
        );
      }

    } else {

      input.click();

    }
  }
}


function enhancePhotoInput(inputId) {

  const input =
    document.getElementById(inputId);

  if (!input) {
    return;
  }

  if (
    input.dataset.nativePhotoReady === 'true'
  ) {
    return;
  }

  const label =
    input.closest('label');

  if (!label) {
    return;
  }

  input.dataset.nativePhotoReady = 'true';


  const actions =
    document.createElement('div');

  actions.className =
    'native-photo-actions';

  actions.style.cssText = `
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    align-items:center;
  `;


  const cameraButton =
    document.createElement('button');

  cameraButton.type = 'button';
  cameraButton.className = 'secondary';
  cameraButton.textContent = 'Camera';


  const galleryButton =
    document.createElement('button');

  galleryButton.type = 'button';
  galleryButton.className = 'secondary';
  galleryButton.textContent = 'Gallery';


  cameraButton.addEventListener(
    'click',
    async () => {

      cameraButton.disabled = true;
      galleryButton.disabled = true;

      try {

        await useNativePhotoSource(
          input,
          'camera'
        );

      } finally {

        cameraButton.disabled = false;
        galleryButton.disabled = false;

      }
    }
  );


  galleryButton.addEventListener(
    'click',
    async () => {

      cameraButton.disabled = true;
      galleryButton.disabled = true;

      try {

        await useNativePhotoSource(
          input,
          'gallery'
        );

      } finally {

        cameraButton.disabled = false;
        galleryButton.disabled = false;

      }
    }
  );


  actions.append(
    cameraButton,
    galleryButton
  );


  /*
    Keep the original input in the DOM so
    the existing app.js listeners continue
    to work.

    Only hide its old label on native.
  */

  label.before(actions);
  label.style.display = 'none';
}


function initialiseNativePhotoInputs() {

  if (
    !window.HACCPMobile?.isNative?.()
  ) {
    return;
  }


  [
    'receivingPhotoInput',
    'thawingPhotoInput',
    'sanitationPhotoInput',
    'sanitationVerifyPhotoInput'
  ].forEach(
    enhancePhotoInput
  );


  console.log(
    '[HACCP Mobile] Native photo controls ready'
  );
}


if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    initialiseNativePhotoInputs
  );

} else {

  initialiseNativePhotoInputs();

}



/* =========================================================
   MOBILE 1.2 QR SCANNER TEST CONTROL
========================================================= */

function initialiseNativeQrScanner() {

  if (!window.HACCPMobile?.isNative?.()) {
    return;
  }

  if (document.getElementById('nativeQrScanButton')) {
    return;
  }

  const header = document.querySelector('.mobile-header');

  if (!header) {
    console.warn('[HACCP QR] Mobile header not found');
    return;
  }

  const button = document.createElement('button');

  button.id = 'nativeQrScanButton';
  button.type = 'button';
  button.className = 'secondary';
  button.textContent = 'Scan QR';

  button.addEventListener('click', async () => {

    button.disabled = true;

    try {
      const result = await window.HACCPMobile.scanQr();

      if (!result || result.cancelled) {
        return;
      }

      console.log(
        '[HACCP QR] Result:',
        result.value
      );

      const scannedUrl = new URL(result.value);

      const configuredPublicUrl = String(
        window.HACCP_CONFIG?.PUBLIC_APP_URL || ''
      ).trim();

      const allowedHost = configuredPublicUrl
        ? new URL(configuredPublicUrl).host
        : 'fugo-haccp.pnbrmsh.workers.dev';

      if (scannedUrl.host !== allowedHost) {
        throw new Error(
          'This QR code does not belong to HACCP Control.'
        );
      }

      const supportedTypes = [
        'equipment',
        'sanitation',
        'thawing'
      ];

      const qrType = supportedTypes.find(
        type => scannedUrl.searchParams.has(type)
      );

      if (!qrType) {
        throw new Error(
          'Unsupported HACCP QR code.'
        );
      }

      const recordId =
        scannedUrl.searchParams.get(qrType);

      if (!recordId) {
        throw new Error(
          'QR code is missing its record ID.'
        );
      }

      /*
        Keep the Capacitor app itself open.
        Only copy the HACCP QR parameter.
      */
      window.dispatchEvent(
        new CustomEvent('haccp:native-qr', {
          detail: {
            type: qrType,
            id: recordId,
            url: result.value
          }
        })
      );

    } catch (error) {

      console.error('[HACCP QR]', error);

      alert('Unable to scan QR code.');

    } finally {
      button.disabled = false;
    }
  });

  const menuButton =
    document.getElementById('mobileMenuBtn');

  if (menuButton) {
    menuButton.before(button);
  } else {
    header.appendChild(button);
  }

  console.log(
    '[HACCP Mobile] QR scanner ready'
  );
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initialiseNativeQrScanner
  );
} else {
  initialiseNativeQrScanner();
}
