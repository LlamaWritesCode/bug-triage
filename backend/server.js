require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini only if key exists
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

app.use(cors());
app.use(express.json());
app.use('/recordings', express.static(path.join(__dirname, 'sessions')));

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

// --- ROBUST FALLBACK LOGIC ---
function generateFallbackTriage(bugData) {
    const hasErrors = bugData.logs && bugData.logs.some(l => l.type === 'error');
    return {
        summary: bugData.userDescription || "Browser session captured with technical logs.",
        reproSteps: [
            "1. User opened the application.",
            "2. User performed interactions.",
            "3. Technical logs were recorded."
        ],
        severity: hasErrors ? "High" : "Low",
        reason: "Fallback logic: Error detection triggered based on console logs."
    };
}

app.post('/api/report', upload.single('video'), async (req, res) => {
    try {
        const sessionId = `bug-${Date.now()}`;
        const sessionPath = path.join(sessionsDir, sessionId);
        fs.mkdirSync(sessionPath);

        const bugData = JSON.parse(req.body.data);
        let aiResponse = null;

        // Try AI first
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `Analyze: Logs: ${JSON.stringify(bugData.logs)}. User says: ${bugData.userDescription}. Return JSON: {summary, reproSteps[], severity, reason}`;
                const result = await model.generateContent(prompt);
                aiResponse = JSON.parse(result.response.text().replace(/```json|```/g, ""));
                console.log("🤖 AI Triage Successful");
            } catch (err) {
                console.warn("⚠️ AI failed, using fallback");
                aiResponse = generateFallbackTriage(bugData);
            }
        } else {
            console.warn("⚠️ No API Key, using fallback");
            aiResponse = generateFallbackTriage(bugData);
        }

        // --- THE FIX: Ensure finalData is complete before writing ---
        const finalData = { 
            ...bugData, 
            triage: aiResponse 
        };

        // Write the JSON file
        fs.writeFileSync(path.join(sessionPath, 'data.json'), JSON.stringify(finalData, null, 2));

        // Move the Video file
        if (req.file) {
            fs.renameSync(req.file.path, path.join(sessionPath, 'video.webm'));
        }

        console.log(`✅ Session ${sessionId} saved with triage data.`);
        res.json({ success: true, sessionId });

    } catch (err) {
        console.error("Critical Save Error:", err);
        res.status(500).json({ error: "Server failed to save report" });
    }
});

app.listen(3000, () => console.log('🚀 Server running at http://localhost:3000'));