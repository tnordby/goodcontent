// import { internalMutation } from "./_generated/server";

// export const backfillMissingCredits = internalMutation({
//   args: {},
//   handler: async (ctx) => {
//     const users = await ctx.db
//       .query("users")
//       .filter((q) => q.eq(q.field("credits"), undefined))
//       .collect();

//     let updatedCount = 0;
//     for (const user of users) {
//       await ctx.db.patch(user._id, {
//         credits: 2,
//         updatedAt: Date.now(),
//       });
//       updatedCount++;
//     }

//     console.log(`Backfilled ${updatedCount} users`);

//     return {
//       totalUsers: users.length,
//       updatedCount,
//     };
//   },
// });
