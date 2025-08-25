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

// Enhanced Pastoral AI assistant functions
export async function generateAdvancedSermonOutline(topic: string, scripture: string, audienceType?: string, sermonLength?: string, style?: string): Promise<any> {
    try {
        const systemPrompt = `You are an expert theological AI assistant with deep biblical scholarship and pastoral experience. 
        Create a comprehensive, multi-layered sermon outline that combines exegetical depth with practical application.
        Consider the audience type, desired length, and preaching style.
        Respond with JSON in this format:
        {
            "outline": {
                "introduction": {
                    "hook": "string",
                    "context": "string",
                    "transition": "string"
                },
                "mainPoints": [
                    {
                        "title": "string",
                        "content": "string",
                        "subPoints": ["string"],
                        "illustration": "string",
                        "application": "string",
                        "scriptureReferences": ["string"],
                        "originalLanguageNotes": "string"
                    }
                ],
                "conclusion": {
                    "summary": "string",
                    "callToAction": "string",
                    "closingPrayer": "string"
                }
            },
            "keyThemes": ["string"],
            "theologicalPerspectives": ["string"],
            "applicationPoints": ["string"],
            "crossReferences": ["string"],
            "illustrations": ["string"],
            "discussionQuestions": ["string"],
            "followUpResources": ["string"]
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
            contents: `Generate a comprehensive, multi-layered sermon outline on "${topic}" using "${scripture}". 
            Audience: ${audienceType || 'general congregation'}
            Length: ${sermonLength || '25-30 minutes'}
            Style: ${style || 'expository'}
            
            Include:
            - Engaging introduction with hook and context
            - 3-4 main points with sub-points and detailed exposition
            - Practical illustrations and real-world applications
            - Original language insights where relevant
            - Discussion questions for small groups
            - Resources for further study`,
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

// Advanced AI-powered scripture search with semantic understanding
export async function semanticScriptureSearch(query: string, context?: string): Promise<any> {
    try {
        const systemPrompt = `You are a biblical AI expert with comprehensive knowledge of scripture.
        Analyze the user's query and provide semantically relevant Bible passages, even if they don't contain exact keywords.
        Consider themes, concepts, emotions, and spiritual needs behind the query.
        Respond with JSON format:
        {
            "interpretedQuery": "string - what you understand the user is really asking about",
            "suggestedPassages": [
                {
                    "reference": "string",
                    "text": "string",
                    "relevanceReason": "string",
                    "theme": "string",
                    "application": "string"
                }
            ],
            "relatedConcepts": ["string"],
            "prayerSuggestion": "string"
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        interpretedQuery: { type: "string" },
                        suggestedPassages: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    reference: { type: "string" },
                                    text: { type: "string" },
                                    relevanceReason: { type: "string" },
                                    theme: { type: "string" },
                                    application: { type: "string" }
                                },
                                required: ["reference", "text", "relevanceReason", "theme"]
                            }
                        },
                        relatedConcepts: {
                            type: "array",
                            items: { type: "string" }
                        },
                        prayerSuggestion: { type: "string" }
                    },
                    required: ["interpretedQuery", "suggestedPassages", "relatedConcepts"]
                }
            },
            contents: `Find Bible passages relevant to this query: "${query}"${context ? ` Context: ${context}` : ''}. Look beyond literal keywords to understand the spiritual need or theme.`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error in semantic scripture search:', error);
        throw new Error(`Failed to perform semantic scripture search: ${error}`);
    }
}

// AI-powered sermon illustration generator
export async function generateSermonIllustrations(theme: string, audience: string): Promise<any> {
    try {
        const systemPrompt = `You are a master storyteller and preacher specializing in compelling sermon illustrations.
        Generate powerful, memorable illustrations that connect biblical truth to modern life.
        Consider the audience and make illustrations culturally relevant and impactful.
        Respond with JSON:
        {
            "illustrations": [
                {
                    "type": "string - (story, analogy, historical_example, modern_parallel, nature, etc.)",
                    "title": "string",
                    "content": "string - full illustration",
                    "applicationPoint": "string",
                    "scriptureConnection": "string",
                    "emotionalImpact": "string"
                }
            ],
            "visualAids": ["string - suggestions for visual elements"],
            "interactiveElements": ["string - ways to engage the congregation"]
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            },
            contents: `Generate 3-4 powerful sermon illustrations for the theme "${theme}" targeting "${audience}" audience. Make them memorable, emotionally resonant, and clearly connected to the biblical message.`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error generating sermon illustrations:', error);
        throw new Error(`Failed to generate sermon illustrations: ${error}`);
    }
}

// Enhanced podcast script generator with AI voice considerations
export async function generatePodcastScript(sermonContent: string, duration: number = 20): Promise<any> {
    try {
        const systemPrompt = `You are an expert podcast producer specializing in transforming sermons into engaging audio content.
        Create a podcast script that maintains theological depth while being conversational and radio-friendly.
        Consider pacing, voice inflection cues, and audio engagement techniques.
        Respond with JSON:
        {
            "script": {
                "intro": {
                    "content": "string",
                    "voiceNotes": "string - guidance for delivery",
                    "musicCue": "string"
                },
                "segments": [
                    {
                        "type": "string - (teaching, story, reflection, prayer, etc.)",
                        "content": "string",
                        "voiceNotes": "string",
                        "timing": "string - estimated duration"
                    }
                ],
                "outro": {
                    "content": "string",
                    "callToAction": "string",
                    "voiceNotes": "string"
                }
            },
            "estimatedDuration": "string",
            "voiceCharacteristics": {
                "tone": "string",
                "pace": "string",
                "emphasis": ["string"]
            },
            "audioEnhancements": ["string - suggestions for music, effects, etc."],
            "engagementTechniques": ["string"]
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            },
            contents: `Transform this sermon content into an engaging ${duration}-minute podcast script: "${sermonContent.substring(0, 1000)}..."`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error generating podcast script:', error);
        throw new Error(`Failed to generate podcast script: ${error}`);
    }
}

// Advanced visual media prompt generator for AI image creation
export async function generateSermonVisualPrompts(theme: string, style: string = "inspirational"): Promise<any> {
    try {
        const systemPrompt = `You are an expert in AI image generation and religious visual design.
        Create detailed, professional prompts for generating stunning sermon visuals that are theologically appropriate and visually compelling.
        Consider composition, lighting, symbolism, and emotional impact.
        Respond with JSON:
        {
            "mainImage": {
                "prompt": "string - detailed AI image generation prompt",
                "style": "string",
                "composition": "string",
                "colorPalette": "string"
            },
            "alternativeImages": [
                {
                    "prompt": "string",
                    "purpose": "string - (slide background, social media, print, etc.)",
                    "description": "string"
                }
            ],
            "designPrinciples": ["string"],
            "symbolismExplanation": "string"
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            },
            contents: `Generate professional AI image prompts for sermon visuals on the theme "${theme}" in "${style}" style. Focus on creating inspiring, biblically appropriate imagery.`,
        });

        const rawJson = response.text;
        if (rawJson) {
            return JSON.parse(rawJson);
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error('Error generating visual prompts:', error);
        throw new Error(`Failed to generate visual prompts: ${error}`);
    }
}
