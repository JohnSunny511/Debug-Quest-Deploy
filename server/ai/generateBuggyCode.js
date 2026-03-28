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
    title: z.string(),
    description: z.string(),
    buggyCode: z.string(),
    correctCode: z.string(),
    expectedOutput: z.string(),
    hints: z.array(z.string()).min(1).max(3),
    maxChangePercentage: z.number().min(5).max(100),
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
- Add a short professional challenge title.
- Add a clear question description for learners.
- Add the exact expected output produced by the correct code.
- Add 2 or 3 short hints that help debug the code without revealing the full answer.
- Add a reasonable maxChangePercentage for scoring. Keep it strict but fair, usually between 10 and 45.

⚠️ The buggy version MUST NOT be runnable.
⚠️ Do NOT auto-correct the buggy version.
⚠️ Do NOT add explanations, only output JSON.

Return ONLY valid JSON with keys "title", "description", "buggyCode", "correctCode", "expectedOutput", "hints", and "maxChangePercentage". Example:

{
  "title": "Fix The Sum Function",
  "description": "The function should return the sum of two numbers and print the result.",
  "buggyCode": "def add(a, b)\\n  return a + b", 
  "correctCode": "def add(a, b):\\n    return a + b\\nprint(add(2, 3))",
  "expectedOutput": "5",
  "hints": ["Check the function syntax.", "Look at the indentation.", "Make sure the result is printed."],
  "maxChangePercentage": 25
}
  `,
});


  async function generateBuggyAndCorrect(language, topic) {
    const { output } = await combinedPrompt({ language, topic });
    return {
      title: output.title.trim(),
      description: output.description.trim(),
      buggy: output.buggyCode.trim(),
      correct: output.correctCode.trim(),
      expectedOutput: output.expectedOutput.trim(),
      hints: Array.isArray(output.hints) ? output.hints.map((hint) => String(hint || "").trim()).filter(Boolean) : [],
      maxChangePercentage: Number(output.maxChangePercentage),
    };
  }

  module.exports = { generateBuggyAndCorrect };
