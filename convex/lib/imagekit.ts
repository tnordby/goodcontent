"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const uploadImage = action({
  args: {
    fileUrl: v.string(),
    fileName: v.string(),
    folderPath: v.string(),
  },
  handler: async () => {
    throw new Error(
      "ImageKit is not used in GoodContent and has been removed from this project."
    );
  },
});
