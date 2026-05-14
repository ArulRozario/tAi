import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
    return;
  }

  console.log(`Testing Gemini with key: ${apiKey.substring(0, 5)}...`);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: 'Say hello in Tamil' }] }],
      }
    );

    console.log('Gemini Response:', JSON.stringify(response.data.candidates?.[0]?.content?.parts?.[0]?.text, null, 2));
    console.log('Gemini connection: SUCCESS');
  } catch (error: any) {
    console.error('Gemini connection: FAILED');
    console.error('Error:', error.response?.data || error.message);
  }
}

testGemini();
