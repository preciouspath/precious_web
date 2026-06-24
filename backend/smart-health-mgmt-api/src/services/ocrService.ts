import * as vision from '@google-cloud/vision';
import fs from 'fs';

// Initialize the Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
    apiKey: process.env.GOOGLE_TRANSLATE_API_KEY
});

interface OCRResult {
    success: boolean;
    text: string;
    metadata: {
        diagnosis?: string;
        medications: string[];
        date?: string;
        labResults: string;
    };
}

/**
 * Perform OCR on a document using Google Cloud Vision for professional results
 */
export const processDocument = async (filePath: string): Promise<OCRResult> => {
    try {
        console.log(`[OCR Service] Professional processing: ${filePath}`);

        // Check if API key is valid (not a placeholder or empty)
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        const isPlaceholder = !apiKey || apiKey.includes('your_google_cloud') || apiKey === 'undefined';

        if (isPlaceholder) {
            console.log(`[OCR Service] Using MOCK OCR result for testing`);
            const mockText = "DD FORM 1289\n1 NOV 71\nDOD PRESCRIPTION\nJohn R Doe, HMS, USN\nU.S.S. Neverforgotten (DD 178)\nDiagnosis: Hypertension and Mild Infection\n* Tinct. Belladonna 15 ml\n* Amphojel qsad 120 ml\nSig: 5ml t.i.d a.c.\nDate: 23 Jan 26";

            return {
                success: true,
                text: mockText,
                metadata: parseExtractedText(mockText)
            };
        }

        const fileBuffer = fs.readFileSync(filePath);

        const [result] = await client.documentTextDetection(fileBuffer);
        const fullTextAnnotation = result.fullTextAnnotation;

        const extractedText = fullTextAnnotation?.text || "No text extracted";

        const metadata = parseExtractedText(extractedText);

        return {
            success: true,
            text: extractedText,
            metadata
        };
    } catch (error: any) {
        console.error("[OCR Service] Google Vision Error:", error);
        return {
            success: false,
            text: error.message?.includes('API key not valid')
                ? "OCR Failed: Invalid Google Cloud API Key. Please provide a valid key for professional transcription."
                : "OCR Processing Failed",
            metadata: { medications: [], labResults: "" }
        };
    }
};

/**
 * Basic parsing logic to extract key medical data from text
 */
const parseExtractedText = (text: string) => {
    const metadata: any = {
        diagnosis: "",
        medications: [],
        date: "",
        labResults: ""
    }

    const lines = text.split('\n');

    lines.forEach(line => {
        const lowerLine = line.toLowerCase().trim();
        if (!lowerLine) return;

        if (lowerLine.includes('diagnosis:') || lowerLine.includes('condition:') || lowerLine.includes('impression:')) {
            metadata.diagnosis = line.split(/[:\-]/).slice(1).join(':').trim() || line.trim();
        }

        const medKeywords = ['mg', 'ml', 'tablet', 'cap', 'pill', 'dose', 'daily', 'times', 'morning', 'night', 'evening', 'qty', 'sig:', 'take'];
        const isMedLine = /^\d+\.|\*|-|•/.test(line.trim()) || medKeywords.some(k => lowerLine.includes(k));

        if (isMedLine) {
            const med = line.replace(/^\d+\.|\*|-|•/, '').trim();
            if (med.length > 3 && !medKeywords.includes(med.toLowerCase())) {
                metadata.medications.push(med);
            }
        }

        const dateMatch = line.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{2,4}/);
        if (dateMatch && !metadata.date) {
            metadata.date = dateMatch[0];
        }

        const labPattern = /(?:[A-Z0-9]{2,}\s*[:\-]\s*\d+\.?\d*\s*[a-zA-Z%/]*)/g;
        const matches = line.match(labPattern);
        if (matches) {
            metadata.labResults += matches.join(', ') + " ";
        } else if (lowerLine.includes('result') || lowerLine.includes('value') || lowerLine.includes('range')) {
            metadata.labResults += line.trim() + " ";
        }
    });

    metadata.labResults = metadata.labResults.trim();

    if (!metadata.diagnosis && lines[0] && lines[0].length > 5 && !lines[0].toLowerCase().includes('hospital') && !lines[0].toLowerCase().includes('clinic')) {
        metadata.diagnosis = lines[0].trim();
    }

    return metadata;
};

export default {
    processDocument
};
