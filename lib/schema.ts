import { z } from "zod";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "./constants";

export const imageSchema = z
  .object({
    model: z.string().min(1, "Please select a model"),
    prompt: z
      .string()
      .min(3, "Prompt must be at least 3 characters long")
      .max(1000, "Prompt must be at most 1000 characters long")
      .trim(),
    aspectRatio: z.string().min(1, "Please select an aspect ratio"),
    characterImageUrl: z.string().url("Please enter a valid URL").optional(),
    objectImageUrl: z.string().url("Please enter a valid URL").optional(),
  })
  .refine((data) => data.characterImageUrl || data.objectImageUrl, {
    message: "At least one image URL is required",
    path: ["characterImageUrl"],
  });

export const videoSchema = z
  .object({
    model: z.string().min(1, "Please select a model"),
    prompt: z
      .string()
      .min(3, "Prompt must be at least 3 characters long")
      .max(1000, "Prompt must be at most 1000 characters long")
      .trim(),
    aspectRatio: z.string().min(1, "Please select an aspect ratio"),
    characterImageUrl: z.string().url("Please enter a valid URL").optional(),
    objectImageUrl: z.string().url("Please enter a valid URL").optional(),
  })
  .refine((data) => data.characterImageUrl || data.objectImageUrl, {
    message: "At least one image URL is required",
    path: ["characterImageUrl"],
  });

export const characterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  imageUrl: z
    .instanceof(File, { message: "Character image is required" })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be at most 5MB"
    )
    .refine(
      (file) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type),
      "Only JPEG, PNG, and JPG files are allowed"
    ),
});

export type ImageSchema = z.infer<typeof imageSchema>;
export type VideoSchema = z.infer<typeof videoSchema>;
export type CharacterSchema = z.infer<typeof characterSchema>;
