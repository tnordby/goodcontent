"use node";

import ImageKit from "imagekit";
import { action } from "../_generated/server";
import { v } from "convex/values";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const uploadImage = action({
  args: {
    fileUrl: v.string(),
    fileName: v.string(),
    folderPath: v.string(),
  },
  handler: async (ctx, args) => {
    // Upload the image to ImageKit
    const result = await imagekit.upload({
      file: args.fileUrl,
      fileName: args.fileName,
      folder: args.folderPath,
    });
    return result;
  },
});
