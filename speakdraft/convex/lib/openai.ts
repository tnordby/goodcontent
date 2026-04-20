export async function enhancedPromptForAds(
  originalPrompt: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert advertising copywriter and creative director specializing in visual ad campaigns. Your task is to enhance image generation prompts to create compelling, professional, commercial-quality advertisements.

When enhancing prompts, focus on:
- Commercial appeal and marketing effectiveness
- Professional visual composition and lighting
- Brand-appropriate aesthetics and mood
- Attention-grabbing visual elements
- Clear product/service presentation
- Emotional resonance with target audience

IMPORTANT: Return ONLY the enhanced prompt text as a plain string. Do not include any JSON formatting, markdown, or extra explanation. The output must be a clean, single-line string that can be directly embedded in JSON.`,
        },
        {
          role: "user",
          content: `Enhance this image generation prompt for a modern commercial advertisement: "${originalPrompt}". Return only the enhanced prompt text, nothing else.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.text()}`);
  }

  const result = await response.json();
  const enhancedPrompt = result.choices?.[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    throw new Error("OpenAI returned empty response");
  }

  return enhancedPrompt.replace(/[\n\r]/g, " ").replace(/"/g, '\\"');
}
