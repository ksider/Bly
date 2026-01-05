import Mustache from 'mustache';
import less from 'less';
import QRCode from 'qrcode';
import { sanitizeHTML } from './sanitize.js';

export async function renderToSafeHtml(template, context) {
  const rendered = Mustache.render(template, context);
  const sanitized = sanitizeHTML(rendered);
  return await embedQrCodes(sanitized);
}

export async function compileLessSource(source) {
  const output = await less.render(source, { javascriptEnabled: false });
  return output.css;
}

export function applyPreview(iframeEl, { html, css, widthMm, heightMm }) {
  if (!iframeEl) return;
  const w = Number.isFinite(widthMm) && widthMm > 0 ? widthMm : 90;
  const h = Number.isFinite(heightMm) && heightMm > 0 ? heightMm : 55;

  const baseCss = `
    :root { box-sizing: border-box; }
    *, *::before, *::after { box-sizing: inherit; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .playground-viewport {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image:
        linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb),
        linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb);
      background-size: 12px 12px;
      background-position: 0 0, 6px 6px;
      background-color: #f8fafc;
    }
    .badge-box {
      width: ${w}mm;
      height: ${h}mm;
      position: relative;
    }
    .badge-box > .badge-surface {
      width: 100%;
      height: 100%;
      min-height: 100%;
    }
  `;

  const content = `
<!doctype html>
<html>
  <head>
    <style>
      ${baseCss}
      ${css || ''}
    </style>
  </head>
  <body>
    <div class="playground-viewport">
      <div class="badge-box">
        ${html}
      </div>
    </div>
  </body>
</html>`;

  iframeEl.setAttribute('sandbox', '');
  iframeEl.srcdoc = content;
  iframeEl.style.width = '100%';
  iframeEl.style.height = '100%';
}

async function embedQrCodes(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const wrapper = doc.body.firstElementChild || doc.body;
  const holders = Array.from(wrapper.querySelectorAll('.qr-holder[data-qr]'));
  if (!holders.length) return wrapper.innerHTML;

  await Promise.all(
    holders.map(async (holder) => {
      const value = holder.getAttribute('data-qr');
      if (!value) return;
      try {
        const dataUrl = await QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 0 });
        const img = doc.createElement('img');
        img.className = holder.className ? `${holder.className} qr` : 'qr';
        img.setAttribute('alt', 'QR code');
        img.setAttribute('src', dataUrl);
        img.setAttribute('width', holder.getAttribute('width') || '');
        img.setAttribute('height', holder.getAttribute('height') || '');
        holder.replaceWith(img);
      } catch (err) {
        // If QR generation fails, leave the placeholder in place.
      }
    })
  );

  return wrapper.innerHTML;
}
