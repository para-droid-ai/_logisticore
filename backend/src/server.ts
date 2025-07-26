
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import gameRoutes from './routes/gameRoutes';
import lyriaRoutes, { setLyriaAiInstance } from './routes/lyriaRoutes';

const app = express();
const port = process.env.PORT || 3001;

// Initialize GoogleGenAI for Lyria
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found. Lyria AI functionality may be limited.");
}
const lyriaAiInstance = GEMINI_API_KEY ? new GoogleGenAI(GEMINI_API_KEY) : null;
if (lyriaAiInstance) {
    setLyriaAiInstance(lyriaAiInstance);
}

app.use(cors());
app.use(express.json());

app.use('/api/game', gameRoutes);
app.use('/api/lyria', lyriaRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the Attrition Doctrine backend!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
