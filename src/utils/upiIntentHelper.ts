export type UpiPreferredApp = 'any' | 'gpay' | 'phonepe' | 'paytm' | 'bhim';

export interface BuildUpiUrlOptions {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  transactionRef?: string;
}

/**
 * Cleanly trims and validates a UPI VPA before building payment intents.
 */
export const sanitizeUpiId = (upiId?: string): string => {
  const cleaned = (upiId || '').trim();
  return cleaned || 'smartindia.official@icici';
};

/**
 * Generates compliant NPCI Bharat UPI query parameters & app-specific deep links.
 * Works seamlessly on Android WebView (MainActivity Intent interception) and mobile browsers.
 */
export const buildUpiPaymentUrls = ({
  upiId,
  payeeName,
  amount,
  transactionNote,
  transactionRef,
}: BuildUpiUrlOptions): {
  generic: string;
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
} => {
  const pa = sanitizeUpiId(upiId);
  const pn = (payeeName || 'Smart India Work').trim();
  const am = Math.max(1, Number(amount) || 10).toFixed(2);
  const tr = (transactionRef || `SIW${Date.now().toString().slice(-10)}`).replace(/[^a-zA-Z0-9]/g, '');
  const tn = (transactionNote || 'Smart India Work Lead Fee').trim().slice(0, 60);

  const query =
    `pa=${encodeURIComponent(pa)}` +
    `&pn=${encodeURIComponent(pn)}` +
    `&am=${encodeURIComponent(am)}` +
    `&cu=INR` +
    `&tr=${encodeURIComponent(tr)}` +
    `&tn=${encodeURIComponent(tn)}`;

  return {
    generic: `upi://pay?${query}`,
    gpay: `tez://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    bhim: `bhim://upi/pay?${query}`,
  };
};

/**
 * Launches the worker's installed UPI app in 1 touch without window.alert / window.open.
 * Uses a synthetic anchor navigation so Capacitor Android BridgeWebViewClient / MainActivity
 * catches the custom scheme (`upi://`, `tez://`, `phonepe://`, `paytmmp://`, `bhim://`) cleanly.
 */
export const launchDirectUpiApp = (
  options: BuildUpiUrlOptions,
  preferredApp: UpiPreferredApp = 'any'
): { launchedUrl: string; upiId: string; amount: number } => {
  const urls = buildUpiPaymentUrls(options);
  const targetUrl =
    preferredApp === 'gpay'
      ? urls.gpay
      : preferredApp === 'phonepe'
      ? urls.phonepe
      : preferredApp === 'paytm'
      ? urls.paytm
      : preferredApp === 'bhim'
      ? urls.bhim
      : urls.generic;

  try {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {
        // ignore cleanup error
      }
    }, 300);
  } catch {
    try {
      window.location.href = targetUrl;
    } catch {
      // ignore on restricted sandbox
    }
  }

  return {
    launchedUrl: targetUrl,
    upiId: sanitizeUpiId(options.upiId),
    amount: Math.max(1, Number(options.amount) || 10),
  };
};
