const fs = require('fs');
const QRCode = require('qrcode');

const url = 'exp://bursiform-pseudisodomic-georgianne.ngrok-free.app';

QRCode.toDataURL(url, {
  width: 320,
  margin: 2,
  color: { dark: '#1a0a2e', light: '#ffffff' }
}, (err, dataUrl) => {
  if (err) { console.error('QR error:', err); process.exit(1); }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vedic Astro – Expo QR Code</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; background: #1a0a2e; color: #fff;
      padding: 32px 16px;
    }
    h1 { color: #d4a93a; font-size: 26px; margin-bottom: 6px; }
    .sub { color: #aaa; font-size: 14px; margin-bottom: 28px; }
    .qr-wrap {
      background: #fff; border-radius: 18px; padding: 18px;
      box-shadow: 0 0 60px #d4a93a44; margin-bottom: 24px;
    }
    .qr-wrap img { display: block; border-radius: 8px; }
    .url-box {
      background: #2a1a4e; border: 1px solid #d4a93a55;
      padding: 12px 22px; border-radius: 10px;
      color: #d4a93a; font-size: 12px; word-break: break-all;
      max-width: 360px; text-align: center; margin-bottom: 24px;
    }
    .steps {
      color: #ccc; font-size: 14px; line-height: 2;
      background: #2a1a4e; border-radius: 12px;
      padding: 16px 24px; max-width: 360px; width: 100%;
    }
    .note { color: #666; font-size: 11px; margin-top: 18px; }
  </style>
</head>
<body>
  <h1>🔮 Vedic Astro App</h1>
  <p class="sub">Scan with <strong style="color:#d4a93a">Expo Go</strong> on Android or iOS</p>
  <div class="qr-wrap">
    <img src="${dataUrl}" width="280" height="280" alt="QR Code" />
  </div>
  <div class="url-box">${url}</div>
  <div class="steps">
    1️⃣ Install <strong>Expo Go</strong> from Play / App Store<br>
    2️⃣ Android: scan QR directly in Expo Go<br>
    2️⃣ iOS: scan with Camera app → tap link<br>
    3️⃣ Or open Expo Go → <strong>Enter URL manually</strong>
  </div>
  <p class="note">⚠️ Keep the Metro bundler &amp; ngrok terminals running</p>
</body>
</html>`;

  fs.writeFileSync('expo-qr.html', html);
  console.log('Done! expo-qr.html created with embedded QR.');
});
