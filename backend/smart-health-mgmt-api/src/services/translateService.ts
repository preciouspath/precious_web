import Translate from '@google-cloud/translate';

/**
 * Translation Service
 * Uses Google Cloud Translation API to translate text between languages
 */

// Initialize the translate client (v2 API)
// This will use GOOGLE_APPLICATION_CREDENTIALS env var if set
// Or you can use an API key
const translateClient = new Translate.v2.Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY
});

interface TranslationResult {
    translatedText: string;
    detectedSourceLanguage: string;
}

/**
 * Translate text to target language
 */
export const translateText = async (
    text: string,
    targetLanguage: string
): Promise<TranslationResult> => {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error('Text to translate cannot be empty');
        }

        // Limit text length to 30,000 characters (API limit)
        if (text.length > 30000) {
            throw new Error('Text too long. Maximum 30,000 characters allowed.');
        }

        // Check if API key is valid (not a placeholder or empty)
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        const isPlaceholder = !apiKey || apiKey.includes('your_google_cloud') || apiKey === 'undefined';

        if (isPlaceholder) {
            console.log(`[Translation Service] Using MOCK translation for: ${targetLanguage}`);
            return {
                translatedText: `[Mock Translation: ${targetLanguage}] ${text}`,
                detectedSourceLanguage: 'auto'
            };
        }

        const [translation, metadata] = await translateClient.translate(text, targetLanguage);

        return {
            translatedText: Array.isArray(translation) ? translation[0] : translation,
            detectedSourceLanguage: metadata?.data?.translations?.[0]?.detectedSourceLanguage || 'unknown'
        };
    } catch (error: any) {
        console.error('[Translation Service] Error:', error);
        // Fallback to mock even on error if not in production
        if (process.env.APP_ENV !== 'production') {
            return {
                translatedText: `[Error Fallback Mock: ${targetLanguage}] ${text}`,
                detectedSourceLanguage: 'error'
            };
        }
        throw new Error(`Translation failed: ${error.message}`);
    }
};

/**
 * Detect the language of the given text
 */
export const detectLanguage = async (text: string): Promise<string> => {
    try {
        if (!text || text.trim().length === 0) {
            return 'unknown';
        }

        const [detection] = await translateClient.detect(text);
        const detections = Array.isArray(detection) ? detection : [detection];

        return detections[0]?.language || 'unknown';
    } catch (error: any) {
        console.error('[Translation Service] Language detection error:', error);
        return 'unknown';
    }
};

/**
 * Get list of supported languages
 */
export const getSupportedLanguages = async () => {
    try {
        const [languages] = await translateClient.getLanguages();
        return languages;
    } catch (error: any) {
        console.error('[Translation Service] Error getting languages:', error);
        return [];
    }
};

export default {
    translateText,
    detectLanguage,
    getSupportedLanguages
};
