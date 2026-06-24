import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GeminiAnalysisResult {
    success: boolean;
    text: string;
    metadata: {
        patientDetails?: {
            name?: string;
            age?: string;
            address?: string;
        };
        doctorDetails?: {
            name?: string;
            specialty?: string;
        };
        medications: string[];
        potentialDiagnosis?: string;
        generalAdvice?: string;
    };
}

const getMimeTypeFromPath = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".webm") return "audio/webm";
    if (ext === ".wav") return "audio/wav";
    if (ext === ".mp3") return "audio/mpeg";
    if (ext === ".mp4" || ext === ".m4a") return "audio/mp4";

    return "image/jpeg";
};

/**
 * Analyze a prescription image using Google Gemini
 */
export const analyzePrescription = async (filePath: string): Promise<GeminiAnalysisResult> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");
        const mimeType = getMimeTypeFromPath(filePath);

        const prompt = `Analyze this prescription image and provide the following details in a clear structured format:
1. Patient details (Name, Age, Address).
2. Doctor details (Name, Specialty if visible).
3. A list of Medicines with dosages.
4. A brief "Potential Diagnosis" based on these specific medications.
5. "General Advice" for the patient regarding these medications (e.g., side effects or timing).

Important: Note that the diagnosis is an AI-generated suggestion and the user should consult their doctor.

Return the response in a structured way so it can be easily parsed.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType,
                },
            },
            { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        // console.log('Prescription Analysis:', text);

        return {
            success: true,
            text: text,
            metadata: parseGeminiResponse(text)
        };
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return {
            success: false,
            text: error.message || "AI Analysis Failed",
            metadata: { medications: [] }
        };
    }
};

export const transcribeAudio = async (filePath: string, mimeType?: string): Promise<{ success: boolean; text: string }> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType || getMimeTypeFromPath(filePath),
                },
            },
            {
                text: `You are an expert audio transcription AI. Your task is to accurately transcribe the spoken words in the provided audio file into plain text.

CRITICAL RULES:
1. Transcribe EXACTLY what is said in the audio. Do not add, invent, or hallucinate any text, medical scenarios, or conditions that are not present in the audio.
2. If the audio is very short (e.g., just "hello"), transcribe ONLY those words.
3. If the audio is silent, unclear, or contains no recognizable speech, output exactly: "No speech detected."
4. Do not add any medical advice, diagnosis, suggestions, follow-up instructions, headers, summaries, or metadata. 
5. Strictly provide the literal transcription only.`,
            },
        ]);

        const response = await result.response;
        const text = response.text().trim();

        return {
            success: true,
            text,
        };
    } catch (error: any) {
        console.error("Gemini Audio Transcription Error:", error);
        return {
            success: false,
            text: error.message || "Audio transcription failed",
        };
    }
};

/**
 * Basic parsing of Gemini's text response into structured metadata
 * This can be further refined with JSON output mode if supported by the model version
 */
const parseGeminiResponse = (text: string) => {
    const metadata: any = {
        patientDetails: {},
        doctorDetails: {},
        medications: [],
        potentialDiagnosis: "",
        generalAdvice: ""
    };

    const lines = text.split('\n');
    let currentSection = "";

    lines.forEach(line => {
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('patient details')) currentSection = "patient";
        else if (lowerLine.includes('doctor details')) currentSection = "doctor";
        else if (lowerLine.includes('medicines') || lowerLine.includes('medication')) currentSection = "meds";
        else if (lowerLine.includes('potential diagnosis')) currentSection = "diagnosis";
        else if (lowerLine.includes('general advice')) currentSection = "advice";

        const cleanLine = line.replace(/^\d+\.|\*|-|•/g, '').replace(/\*\*/g, '').trim();
        if (!cleanLine) return;

        if (currentSection === "patient") {
            if (lowerLine.includes('name:')) metadata.patientDetails.name = cleanLine.split(':')[1]?.trim();
            if (lowerLine.includes('age:')) metadata.patientDetails.age = cleanLine.split(':')[1]?.trim();
            if (lowerLine.includes('address:')) metadata.patientDetails.address = cleanLine.split(':')[1]?.trim();
        } else if (currentSection === "doctor") {
            if (lowerLine.includes('name:')) metadata.doctorDetails.name = cleanLine.split(':')[1]?.trim();
            if (lowerLine.includes('specialty:')) metadata.doctorDetails.specialty = cleanLine.split(':')[1]?.trim();
        } else if (currentSection === "meds") {
            if (cleanLine.length > 3 && !lowerLine.includes('medicine')) {
                metadata.medications.push(cleanLine);
            }
        } else if (currentSection === "diagnosis") {
            metadata.potentialDiagnosis += cleanLine + " ";
        } else if (currentSection === "advice") {
            metadata.generalAdvice += cleanLine + " ";
        }
    });

    metadata.potentialDiagnosis = metadata.potentialDiagnosis.trim();
    metadata.generalAdvice = metadata.generalAdvice.trim();

    return metadata;
};

export const generateQuestionsFromTranscript = async (text: string): Promise<{ success: boolean; questions: string[] }> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const prompt = `Based on the following medical transcript, generate 3 to 5 relevant follow-up questions that a doctor might want to ask the patient, or questions the patient might want to consider. The questions should be direct, short, and helpful. 

CRITICAL RULE: If the transcript is just a greeting (e.g., "hello", "hi"), a microphone test (e.g., "testing 1 2 3"), or completely devoid of any health, medical, or biological concepts, DO NOT generate any questions. Instead, output exactly: "Not enough medical context to generate questions." 
If the transcript mentions ANY health condition, symptom, body part, or medical concept (like "diabetes", "blood sugar", "headache", etc.), you MUST generate questions.

Transcript:
"${text}"

Return the questions as a plain list, one question per line, without any numbering, bullet points, or introductory text.`;

        const result = await model.generateContent([{ text: prompt }]);
        const response = await result.response;
        const responseText = response.text().trim();
        
        const questions = responseText.split('\n').map(q => q.replace(/^[-*•\d.\s]+/, '').trim()).filter(q => q.length > 0);

        return {
            success: true,
            questions,
        };
    } catch (error: any) {
        console.error("Gemini Generate Questions Error:", error);
        return {
            success: false,
            questions: [],
        };
    }
};

export default {
    analyzePrescription,
    transcribeAudio,
    generateQuestionsFromTranscript
};
