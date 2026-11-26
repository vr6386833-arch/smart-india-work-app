// Official UIDAI Verhoeff Checksum Validator + Client Helper for Server-Side Aadhaar Card OCR & Name Match
import { resolveApiUrl } from './apiConfig';

export interface AadhaarVerificationResult {
  verified: boolean;
  serverUnavailable?: boolean;
  isAadhaarCard: boolean;
  nameMatches: boolean;
  numberMatches: boolean;
  extractedName: string;
  extractedLast4Digits: string;
  reasonHi: string;
  reasonEn: string;
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const OBVIOUS_FAKE_AADHAAR = new Set([
  '123456789012',
  '234567890123',
  '987654321098',
  '999999999999',
  '222222222222',
  '333333333333',
  '444444444444',
  '555555555555',
  '666666666666',
  '777777777777',
  '888888888888',
]);

/**
 * Validates a 12-digit Indian Aadhaar number using UIDAI rules:
 * - Exactly 12 numeric digits
 * - First digit cannot be '0' or '1'
 * - Not all identical or trivial sequential digits
 * - Passes UIDAI Verhoeff checksum algorithm
 */
export function validateAadhaarVerhoeff(rawInput: string): {
  valid: boolean;
  digits: string;
  reasonHi: string;
  reasonEn: string;
} {
  const digits = (rawInput || '').replace(/\D/g, '');
  if (digits.length !== 12) {
    return {
      valid: false,
      digits,
      reasonHi: 'कृपया पूरे 12 अंकों का आधार नंबर दर्ज करें।',
      reasonEn: 'Please enter a full 12-digit Aadhaar number.',
    };
  }
  if (digits[0] === '0' || digits[0] === '1') {
    return {
      valid: false,
      digits,
      reasonHi: 'असली आधार नंबर कभी 0 या 1 से शुरू नहीं होता — कृपया सही आधार नंबर डालें।',
      reasonEn: 'Valid Aadhaar numbers never start with 0 or 1.',
    };
  }
  if (/^(\d)\1{11}$/.test(digits) || OBVIOUS_FAKE_AADHAAR.has(digits)) {
    return {
      valid: false,
      digits,
      reasonHi: 'यह नकली/अमान्य आधार नंबर है — कृपया असली आधार कार्ड का 12-अंकों का नंबर डालें।',
      reasonEn: 'Invalid/dummy Aadhaar pattern detected. Please enter a genuine Aadhaar number.',
    };
  }

  let c = 0;
  const reversed = digits.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }

  if (c !== 0) {
    return {
      valid: false,
      digits,
      reasonHi: 'आधार नंबर गलत है (UIDAI चेकसम मेल नहीं खाया) — कृपया कार्ड देखकर सही 12 अंक डालें।',
      reasonEn: 'Invalid Aadhaar number (UIDAI Verhoeff checksum failed). Please check your card.',
    };
  }

  return {
    valid: true,
    digits,
    reasonHi: '✓ आधार नंबर UIDAI चेकसम के अनुसार सही है।',
    reasonEn: '✓ Aadhaar number passes UIDAI Verhoeff checksum.',
  };
}

/**
 * Generates a one-way SHA-256 fingerprint of a 12-digit Aadhaar number so duplicate
 * Aadhaar IDs can be prevented without storing raw 12-digit Aadhaar in Firestore.
 */
export async function computeAadhaarHash(digits12: string): Promise<string> {
  const clean = digits12.replace(/\D/g, '');
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(`siw_aadhaar_v1:${clean}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Safe deterministic fallback if SubtleCrypto unavailable in older WebView context
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}_${clean.slice(-4)}`;
}

/**
 * Normalizes Indian person names for comparison (strips titles like Mr/Shri/Smt/Kumar punctuation).
 */
export function normalizePersonName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|shri|smt|kumari|late|s\/o|d\/o|w\/o|c\/o)\b\.?/gi, ' ')
    .replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function doNamesRoughlyMatch(expectedName: string, cardName: string): boolean {
  const a = normalizePersonName(expectedName);
  const b = normalizePersonName(cardName);
  if (!a || !b) return false;
  if (a === b || b.includes(a) || a.includes(b)) return true;

  const tokensA = a.split(' ').filter((t) => t.length >= 2);
  const tokensB = b.split(' ').filter((t) => t.length >= 2);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const overlap = tokensA.filter((ta) =>
    tokensB.some((tb) => tb === ta || (ta.length >= 4 && tb.startsWith(ta.slice(0, 4))))
  );
  return overlap.length >= Math.min(tokensA.length, tokensB.length) || overlap.length >= 1 && tokensA.length === 1;
}

/**
 * Calls the server-side Gemini Vision Aadhaar Card OCR & Name Match API (/api/verify-aadhaar).
 * Never stores or accesses any API key in browser code.
 */
export async function verifyAadhaarCardWithServer(params: {
  imageDataUrl: string;
  expectedName: string;
  expectedAadhaar: string;
}): Promise<AadhaarVerificationResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(resolveApiUrl('/api/verify-aadhaar'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return {
        verified: false,
        serverUnavailable: res.status === 429 || res.status === 503 || res.status === 404 || res.status >= 500,
        isAadhaarCard: false,
        nameMatches: false,
        numberMatches: false,
        extractedName: '',
        extractedLast4Digits: '',
        reasonHi:
          data?.reasonHi ||
          'आधार फोटो सत्यापन सेवा अभी उपलब्ध नहीं है।',
        reasonEn:
          data?.reasonEn ||
          'Aadhaar photo verification service is currently unavailable.',
      };
    }

    return data as AadhaarVerificationResult;
  } catch {
    window.clearTimeout(timeoutId);
    return {
      verified: false,
      serverUnavailable: true,
      isAadhaarCard: false,
      nameMatches: false,
      numberMatches: false,
      extractedName: '',
      extractedLast4Digits: '',
      reasonHi: 'आधार फोटो जांच सर्वर से कनेक्ट नहीं हो सका।',
      reasonEn: 'Could not reach Aadhaar verification server.',
    };
  }
}
