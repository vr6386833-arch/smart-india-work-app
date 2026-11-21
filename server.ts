import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function isValidVerhoeff12(digits: string): boolean {
  if (!/^[2-9]\d{11}$/.test(digits)) return false;
  if (/^(\d)\1{11}$/.test(digits)) return false;
  let c = 0;
  const rev = digits.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][rev[i]]];
  }
  return c === 0;
}

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'smart-india-work-api' });
  });

  app.post('/api/verify-aadhaar', async (req, res) => {
    try {
      const body = req.body as {
        imageDataUrl?: unknown;
        expectedName?: unknown;
        expectedAadhaar?: unknown;
      };

      const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
      const expectedName = typeof body?.expectedName === 'string' ? body.expectedName.trim() : '';
      const expectedAadhaar =
        typeof body?.expectedAadhaar === 'string'
          ? body.expectedAadhaar.replace(/\D/g, '').slice(0, 12)
          : '';

      if (!expectedName || expectedName.length < 2) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'कृपया पहले अपना पूरा नाम दर्ज करें।',
          reasonEn: 'Please enter your full name first.',
        });
      }

      if (!isValidVerhoeff12(expectedAadhaar)) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'आधार नंबर अमान्य है (UIDAI चेकसम गलत है)। कृपया सही 12-अंकों का आधार नंबर डालें।',
          reasonEn: 'Invalid 12-digit Aadhaar number (UIDAI checksum mismatch).',
        });
      }

      const dataUrlMatch = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
        imageDataUrl
      );
      if (!dataUrlMatch) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'कृपया आधार कार्ड की सही फोटो (JPG/PNG) अपलोड करें।',
          reasonEn: 'Please upload a valid Aadhaar card image (JPG/PNG/WebP).',
        });
      }

      if (!aiClient) {
        return res.status(503).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'आधार कार्ड OCR सत्यापन सेवा अभी कॉन्फ़िगर नहीं है।',
          reasonEn: 'Aadhaar OCR verification service is not configured on the server.',
        });
      }

      const mimeType = dataUrlMatch[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : dataUrlMatch[1].toLowerCase();
      const base64Data = dataUrlMatch[2];
      const expectedLast4 = expectedAadhaar.slice(-4);

      const promptText = [
        'Inspect this uploaded Indian identity document photo strictly.',
        `Worker applicant entered Name: "${expectedName}"`,
        `Worker applicant entered Aadhaar last 4 digits: "${expectedLast4}"`,
        '',
        'Rules:',
        '1) Set isAadhaarCard = true ONLY if this is genuinely a front or full Indian Aadhaar card (Government of India / Unique Identification Authority of India / Mera Aadhaar format with name, photo/QR, or 12-digit XXXX XXXX XXXX format). If it is a blank wall, random selfie, unrelated object, blurred unreadable blob, or non-Aadhaar paper, set isAadhaarCard = false.',
        '2) Extract extractedName as printed on the Aadhaar card (English or Hindi).',
        '3) Extract extractedLast4Digits (only the last 4 digits visible on the card; empty string if not legible).',
        '4) Set nameMatchesCard = true ONLY if extractedName reasonably matches the applicant entered Name (allow minor Hindi/English spelling differences, middle name, or case differences; set false if clearly a different person!).',
        '5) Set last4MatchesCard = true if extractedLast4Digits is empty/masked-cropped OR equals the applicant last 4 digits; set false ONLY if clear 4 digits are visible on card and DO NOT match the entered last 4 digits.',
      ].join('\n');

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: promptText },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAadhaarCard: { type: Type.BOOLEAN },
              extractedName: { type: Type.STRING },
              extractedLast4Digits: { type: Type.STRING },
              nameMatchesCard: { type: Type.BOOLEAN },
              last4MatchesCard: { type: Type.BOOLEAN },
              reasonHi: { type: Type.STRING },
              reasonEn: { type: Type.STRING },
            },
            required: [
              'isAadhaarCard',
              'extractedName',
              'extractedLast4Digits',
              'nameMatchesCard',
              'last4MatchesCard',
              'reasonHi',
              'reasonEn',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim()) as {
        isAadhaarCard?: boolean;
        extractedName?: string;
        extractedLast4Digits?: string;
        nameMatchesCard?: boolean;
        last4MatchesCard?: boolean;
        reasonHi?: string;
        reasonEn?: string;
      };

      const isAadhaarCard = Boolean(parsed.isAadhaarCard);
      const extractedName = (parsed.extractedName || '').trim();
      const extractedLast4Digits = (parsed.extractedLast4Digits || '').replace(/\D/g, '').slice(-4);
      const nameMatches = isAadhaarCard && Boolean(parsed.nameMatchesCard) && Boolean(extractedName);
      const numberMatches =
        isAadhaarCard &&
        (extractedLast4Digits.length === 4 ? extractedLast4Digits === expectedLast4 : Boolean(parsed.last4MatchesCard));

      const verified = isAadhaarCard && nameMatches && numberMatches;

      let reasonHi = parsed.reasonHi || '';
      let reasonEn = parsed.reasonEn || '';
      if (!isAadhaarCard) {
        reasonHi =
          'अपलोड की गई फोटो असली आधार कार्ड की नहीं है। कृपया अपने असली आधार कार्ड की साफ फोटो अपलोड करें।';
        reasonEn =
          'Uploaded photo does not look like a real Indian Aadhaar Card. Please upload a clear Aadhaar card front photo.';
      } else if (!nameMatches) {
        reasonHi = extractedName
          ? `आधार कार्ड पर नाम "${extractedName}" लिखा है, जो आपके डाले नाम "${expectedName}" से मेल नहीं खाता!`
          : 'आधार कार्ड पर नाम साफ नहीं दिख रहा है या आपके नाम से मेल नहीं खाता।';
        reasonEn = extractedName
          ? `Name on Aadhaar Card ("${extractedName}") does not match your entered name ("${expectedName}").`
          : 'Could not verify your name on the uploaded Aadhaar photo.';
      } else if (!numberMatches) {
        reasonHi = `आधार फोटो पर दिख रहे अंतिम 4 अंक (${extractedLast4Digits || '????'}) आपके डाले आधार नंबर (XXXX-${expectedLast4}) से मेल नहीं खाते।`;
        reasonEn = `Aadhaar number on photo (ending ${extractedLast4Digits || '????'}) does not match entered Aadhaar (ending ${expectedLast4}).`;
      } else {
        reasonHi = `✓ आधार कार्ड व नाम (${extractedName}) सफलतापूर्वक सत्यापित हो गया!`;
        reasonEn = `✓ Aadhaar Card & Name (${extractedName}) verified successfully!`;
      }

      return res.json({
        verified,
        isAadhaarCard,
        nameMatches,
        numberMatches,
        extractedName,
        extractedLast4Digits,
        reasonHi,
        reasonEn,
      });
    } catch (err) {
      console.error('Aadhaar verification error:', err);
      return res.status(502).json({
        verified: false,
        isAadhaarCard: false,
        nameMatches: false,
        numberMatches: false,
        extractedName: '',
        extractedLast4Digits: '',
        reasonHi: 'आधार फोटो जांचने में सर्वर त्रुटि आई — कृपया दोबारा प्रयास करें।',
        reasonEn: 'Failed to analyze Aadhaar photo. Please try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart India Work server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
