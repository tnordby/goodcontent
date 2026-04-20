import { enhancedPromptForAds } from "./openai";

export interface KieResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

export async function createImageWithKie(params: {
  model: string;
  prompt: string;
  imageUrls: string[];
  aspectRatio: string;
}): Promise<string> {
  const { model, prompt, imageUrls, aspectRatio } = params;

  // Get environment variables
  const apiKey = process.env.KIE_API_KEY;
  const convexSiteUrl = process.env.CONVEX_SITE_URL;

  const enhancedPrompt = await enhancedPromptForAds(prompt);

  // Build callback URL
  const callBackUrl = `${convexSiteUrl}/webhook/kie-image`;

  // Call Kie.ai API
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      callBackUrl,
      input: {
        prompt: enhancedPrompt,
        image_urls: imageUrls,
        output_format: "png",
        image_size: aspectRatio,
        resolution: "1K", // flux
        aspect_ratio: aspectRatio, // flux, seedream
        quality: "basic", // seedream
        input_urls: imageUrls, // flux
      },
    }),
  });

  if (!response.ok) {
    console.error("Kie.ai API Error:", response.text());
    throw new Error(`Kie.ai API Error: ${response.text()}`);
  }

  const result: KieResponse = await response.json();

  if (result.code !== 200) {
    console.error("Kie.ai API Error:", result.message);
    throw new Error(`Kie.ai API Error: ${result.message}`);
  }

  return result.data.taskId;
}

export async function createVideoWithKie(params: {
  model: string;
  prompt: string;
  imageUrls: string[];
  aspectRatio: string;
}): Promise<string> {
  const { model, prompt, imageUrls, aspectRatio } = params;

  // Get environment variables
  const apiKey = process.env.KIE_API_KEY;
  const convexSiteUrl = process.env.CONVEX_SITE_URL;

  const enhancedPrompt = await enhancedPromptForAds(prompt);

  // Build callback URL
  const callBackUrl = `${convexSiteUrl}/webhook/kie-video`;

  // Call Kie.ai API
  const response = await fetch("https://api.kie.ai/api/v1/veo/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      imageUrls: imageUrls,
      aspectRatio,
      callBackUrl,
      generationType: "REFERENCE_2_VIDEO",
    }),
  });

  if (!response.ok) {
    console.error("Kie.ai API Error:", response.text());
    throw new Error(`Kie.ai API Error: ${response.text()}`);
  }

  const result: KieResponse = await response.json();

  if (result.code !== 200) {
    console.error("Kie.ai API Error:", result.message);
    throw new Error(`Kie.ai API Error: ${result.message}`);
  }

  return result.data.taskId;
}
