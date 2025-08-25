import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeArticle(text: string): Promise<string> {
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Something went wrong";
}

export interface Sentiment {
    rating: number;
    confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
    try {
        const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        rating: { type: "number" },
                        confidence: { type: "number" },
                    },
                    required: ["rating", "confidence"],
                },
            },
            contents: text,
        });

        const rawJson = response.text;

        console.log(`Raw JSON: ${rawJson}`);

        if (rawJson) {
            const data: Sentiment = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        throw new Error(`Failed to analyze sentiment: ${error}`);
    }
}

export async function analyzeImage(jpegImagePath: string): Promise<string> {
    const imageBytes = fs.readFileSync(jpegImagePath);

    const contents = [
        {
            inlineData: {
                data: imageBytes.toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        `Analyze this image in detail and describe its key elements, context,
and any notable aspects.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

export async function analyzeVideo(mp4VideoPath: string): Promise<string> {
    const videoBytes = fs.readFileSync(mp4VideoPath);

    const contents = [
        {
            inlineData: {
                data: videoBytes.toString("base64"),
                mimeType: "video/mp4",
            },
        },
        `Analyze this video in detail and describe its key elements, context,
    and any notable aspects.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

export async function generateImage(
    prompt: string,
    imagePath: string,
): Promise<void> {
    try {
        // IMPORTANT: only this gemini model supports image generation
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            return;
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
            return;
        }

        for (const part of content.parts) {
            if (part.text) {
                console.log(part.text);
            } else if (part.inlineData && part.inlineData.data) {
                const imageData = Buffer.from(part.inlineData.data, "base64");
                fs.writeFileSync(imagePath, imageData);
                console.log(`Image saved as ${imagePath}`);
            }
        }
    } catch (error) {
        throw new Error(`Failed to generate image: ${error}`);
    }
}

// Pastoral AI assistant functions
export async function generateSermonOutline(topic: string, scripture: string): Promise<any> {
    try {
        const systemPrompt = `You are an expert theological AI assistant specializing in sermon preparation. 
        Create a detailed sermon outline with biblical insights and practical applications.
        Respond with JSON in this format:
        {
            "outline": {
                "sections": [
                    {
                        "title": "string",
                        "content": "string", 
                        "notes": "string",
                        "scriptureReferences": ["string"]
                    }
                ]
            },
            "keyThemes": ["string"],
            "applicationPoints": ["string"],
            "crossReferences": ["string"]
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        outline: {
                            type: "object",
                            properties: {
                                sections: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            title: { type: "string" },
                                            content: { type: "string" },
                                            notes: { type: "string" },
                                            scriptureReferences: {
                                                type: "array",
                                                items: { type: "string" }
                                            }
                                        },
                                        required: ["title", "content", "notes"]
                                    }
                                }
                            },
                            required: ["sections"]
                        },
                        keyThemes: {
                            type: "array",
                            items: { type: "string" }
                        },
                        applicationPoints: {
                            type: "array", 
                            items: { type: "string" }
                        },
                        crossReferences: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["outline", "keyThemes", "applicationPoints", "crossReferences"]
                }
            },
            contents: `Generate a comprehensive sermon outline on the topic "${topic}" using the scripture passage "${scripture}". Include 3-4 main points with detailed notes, practical applications, and relevant cross-references.`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error generating sermon outline:', error);
        throw new Error(`Failed to generate sermon outline: ${error}`);
    }
}

export async function providePastoralGuidance(question: string, context?: string): Promise<string> {
    try {
        const systemPrompt = `You are a wise, compassionate pastoral AI assistant with deep biblical knowledge. 
        Provide thoughtful, scripturally-grounded guidance that is encouraging, practical, and theologically sound.
        Always cite relevant scripture passages when appropriate.
        Keep responses warm, pastoral in tone, and focused on spiritual growth and biblical truth.`;

        const fullPrompt = context 
            ? `Context: ${context}\n\nQuestion: ${question}`
            : question;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
            },
            contents: fullPrompt,
        });

        return response.text || "I'm here to help with your pastoral questions. Could you please rephrase your question?";
    } catch (error) {
        console.error('Error providing pastoral guidance:', error);
        throw new Error(`Failed to provide pastoral guidance: ${error}`);
    }
}

export async function generateBiblicalInsights(passage: string): Promise<any> {
    try {
        const systemPrompt = `You are a biblical scholar AI providing deep scriptural insights.
        Analyze the given passage and provide historical context, theological significance, and practical applications.
        Respond with JSON in this format:
        {
            "historicalContext": "string",
            "theologicalSignificance": "string",
            "keyThemes": ["string"],
            "practicalApplications": ["string"],
            "crossReferences": ["string"],
            "originalLanguageInsights": "string"
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        historicalContext: { type: "string" },
                        theologicalSignificance: { type: "string" },
                        keyThemes: {
                            type: "array",
                            items: { type: "string" }
                        },
                        practicalApplications: {
                            type: "array",
                            items: { type: "string" }
                        },
                        crossReferences: {
                            type: "array",
                            items: { type: "string" }
                        },
                        originalLanguageInsights: { type: "string" }
                    },
                    required: ["historicalContext", "theologicalSignificance", "keyThemes", "practicalApplications", "crossReferences"]
                }
            },
            contents: `Provide comprehensive biblical insights for this passage: "${passage}"`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error generating biblical insights:', error);
        throw new Error(`Failed to generate biblical insights: ${error}`);
    }
}
