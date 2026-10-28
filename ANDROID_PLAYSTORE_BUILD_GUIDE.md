# Smart India Work - Android APK & AAB (Google Play Store) Build Guide

इस गाइड का पालन करके आप इस React/Vite ऐप को Android Studio के ज़रिए Google Play Store के लिए `.aab` (Android App Bundle) या `.apk` फाइल में बदल सकते हैं।

---

## चरण 1: अपने कंप्यूटर पर प्रोजेक्ट डाउनलोड / क्लोन करें
1. AI Studio के ऊपर दाईं ओर **Settings / Export** मेनू से पूरा कोड ZIP फाइल में डाउनलोड करें या GitHub पर एक्सपोर्ट करें।
2. अपने कंप्यूटर पर ZIP को अनज़िप करें और VS Code या टर्मिनल में खोलें:
   ```bash
   npm install
   ```

---

> ⚡ **बड़ी खुशखबरी:** चरण 2, 3 और 4 (Capacitor टूल्स, वेब बिल्ड, और Android फोल्डर) हमने **पहले से ही 100% पूरा कर दिया है**! आपको टर्मिनल में कोई कमांड नहीं चलानी है। 
> आप सीधे नीचे दिए गए **विधि A (Android Studio)** या **विधि B (GitHub Actions Cloud)** का उपयोग कर सकते हैं।

---

## विकल्प A: GitHub Actions से सीधे ऑनलाइन मुफ़्त में `.aab` बनाएं (Bina Laptop ke)

1. अपने इसी GitHub रिपॉज़िटरी में ऊपर **Actions** टैब पर जाएँ।
2. **Build Android AAB for Play Store** पर क्लिक करें।
3. **Run workflow** बटन पर क्लिक करें।
4. 2 से 3 मिनट में GitHub क्लाउड आपकी **`SmartIndiaWork-PlayStore-AAB`** फ़ाइल अपने आप बनाकर डाउनलोड के लिए दे देगा!

---

## विकल्प B: अपने लैपटॉप में Android Studio से `.aab` बनाएं

## चरण 5: Android Studio में खोलें और APK / AAB बनाएं
1. Android Studio में प्रोजेक्ट खोलने के लिए रन करें:
   ```bash
   npx cap open android
   ```
2. **Android Studio खुल जाने पर:**
   - टॉप मेनू में जाएँ: **Build** -> **Generate Signed Bundle / APK...**
   - **Android App Bundle (.aab)** चुनें (Google Play Store के लिए AAB अनिवार्य है) या टेस्टिंग के लिए **APK** चुनें।
   - **Create New Keystore**: अपनी चाबी (Keystore file) और पासवर्ड सुरक्षित रखें।
   - **Build Variants**: `release` चुनें और **Finish** दबाएं।
3. कुछ ही मिनटों में आपकी `.aab` फाइल `android/app/release/app-release.aab` में बनकर तैयार हो जाएगी!

---

## चरण 6: Google Play Console पर अपलोड करें
1. **Play Console** ([play.google.com/console](https://play.google.com/console)) में लॉगिन करें।
2. **Create App** -> Name: `Smart India Work` -> Default Language: `Hindi` या `English`.
3. **App Releases** -> **Production** -> **Create New Release** में अपनी `app-release.aab` फाइल ड्रैग और ड्रॉप करें।
4. **Store Settings & Data Safety:**
   - **Privacy Policy URL:** ऐप के Legal Terms मेनू में दिया गया प्राइवेसी लिंक पेस्ट करें।
   - **Category:** Business / Productivity / Local Services.
   - **Location Permission:** "App functionality / Delivery & local worker matching" टिक करें।
5. **Send for Review:** सबमिट करें! आमतौर पर 2-3 दिनों में ऐप लाइव हो जाती है।
