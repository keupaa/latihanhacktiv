import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEMINI_MODEL = 'gemini-flash-latest';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/generate-text', async (req, res) => {
    try {
        if (!req.body || !req.body.prompt) {
            return res.status(400).json({ message: "Prompt is required in request body" });
        }
        
        const { prompt } = req.body;
        console.log('Generating text for prompt:', prompt.substring(0, 50) + '...');
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ parts: [{ text: prompt }] }]
        });
        
        console.log('✓ Text generated successfully');
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error('✗ Error generating text:', e);
        res.status(500).json({ message: e.message || String(e) });
    }
});

app.post('/generate-image', upload.single("image"), async (req,res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded. Use 'image' as the field name in form-data" });
        }
        
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required in form-data" });
        }
        
        console.log('Analyzing image:', req.file.originalname, '-', req.file.mimetype);
        
        const base64Image = req.file.buffer.toString("base64");
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{
                parts: [
                    { text: prompt },
                    { 
                        inlineData: {
                            data: base64Image,
                            mimeType: req.file.mimetype
                        }
                    }
                ]
            }]
        });

        console.log('✓ Image analyzed successfully');
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error('✗ Error analyzing image:', e);
        res.status(500).json({ message: e.message || String(e) });
    }
})

app.post('/generate-from-document', upload.single("document"), async (req,res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No document file uploaded. Use 'document' as the field name in form-data" });
        }
        
        const { prompt } = req.body;
        console.log('Processing document:', req.file.originalname, '-', req.file.mimetype);
        
        const base64Document = req.file.buffer.toString("base64");
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{
                parts: [
                    { text: prompt || "Tolong buat ringkasan dari dokumen berikut" },
                    { 
                        inlineData: {
                            data: base64Document,
                            mimeType: req.file.mimetype
                        }
                    }
                ]
            }]
        });
        
        console.log('✓ Document processed successfully');
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error('✗ Error processing document:', e);
        res.status(500).json({ message: e.message || String(e) });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
