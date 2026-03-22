  const { genkit } = require('genkit');
  const { googleAI } = require('@genkit-ai/googleai');
  const { z } = require('zod');
  const dotenv = require('dotenv');
  dotenv.config();

  const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  });

  const combinedSchema = z.object({
    buggyCode: z.string(),
    correctCode: z.string(),
  });

  const combinedPrompt = ai.definePrompt({
  name: 'generateBuggyAndCorrectCode',
  input: {
    schema: z.object({
      language: z.string(),
      topic: z.string(),
    })
  },
  output: { schema: combinedSchema },
  prompt: `
You are a coding challenge generator.

Generate a SHORT code snippet in {{{language}}} about {{{topic}}}.

- Produce a buggy version with EXACTLY 2–3 errors. At least one MUST be a **syntax error** 
  (such as missing colon/semicolon/parenthesis, wrong variable name, or wrong indentation).
- Then produce the correct, working version.

⚠️ The buggy version MUST NOT be runnable.
⚠️ Do NOT auto-correct the buggy version.
⚠️ Do NOT add explanations, only output JSON.

Return ONLY valid JSON with keys "buggyCode" and "correctCode". Example:

{
  "buggyCode": "def add(a, b)\\n  return a + b", 
  "correctCode": "def add(a, b):\\n    return a + b"
}
  `,
});


  async function generateBuggyAndCorrect(language, topic) {
    const { output } = await combinedPrompt({ language, topic });
    return {
      buggy: output.buggyCode.trim(),
      correct: output.correctCode.trim()
    };
  }

  module.exports = { generateBuggyAndCorrect };
