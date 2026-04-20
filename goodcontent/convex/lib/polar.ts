// convex/example.ts
import { Polar } from "@convex-dev/polar";
import { api, components } from "../_generated/api";

export const polar = new Polar(components.polar, {
  getUserInfo: async (ctx: any): Promise<any> => {
    const user = await ctx.runQuery(api.users.current);
    return {
      userId: user.clerkId,
      email: user.email,
    };
  },

  products: {
    pro: process.env.POLAR_PRO_PRODUCT_ID!,
    enterprise: process.env.POLAR_ENTERPRISE_PRODUCT_ID!,
  },
});

// Export API functions from the Polar client
export const {
  getConfiguredProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();
