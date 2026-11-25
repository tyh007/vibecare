import { Hono } from "hono";
import { z } from "zod";

import { requireUser, type AuthVariables } from "../auth/middleware.js";
import { selectAdapter } from "../ai/adapter.js";
import { RemoteAiError } from "../ai/remote.js";
import { TemplateAiAdapter } from "../ai/template.js";
import { AppError } from "../util/errors.js";
import { rateLimit } from "../util/rateLimit.js";
import { logger } from "../util/logger.js";

const MAX_MESSAGE = 4000;

const partnerSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE),
  partnerName: z.string().trim().min(1).max(64),
  partnerType: z.enum(["cat", "dog", "panda"]),
  mood: z.number().int().min(1).max(5).optional(),
});

const cbtSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_MESSAGE),
      }),
    )
    .max(200)
    .optional(),
});

const moderateSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE),
});

export function aiRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  // 20 requests / 10s burst, 2 r/s steady — enough for normal use, blocks abuse.
  const aiLimiter = rateLimit({ scope: "ai", capacity: 20, refillPerSec: 2 });
  app.use("/ai/*", aiLimiter);

  app.post("/ai/partner", async (c) => {
    const { userId } = c.get("user");
    const body = partnerSchema.parse(await c.req.json().catch(() => ({})));
    const adapter = selectAdapter(userId);
    try {
      const result = await adapter.partnerReply({
        message: body.message,
        partnerName: body.partnerName,
        partnerType: body.partnerType,
        mood: body.mood,
      });
      return c.json(result);
    } catch (err) {
      if (err instanceof RemoteAiError) {
        console.warn(`[ai] remote partner failed, falling back to template:`, err.message);
        const fallback = new TemplateAiAdapter();
        return c.json(await fallback.partnerReply({
          message: body.message,
          partnerName: body.partnerName,
          partnerType: body.partnerType,
          mood: body.mood,
        }));
      }
      throw err;
    }
  });

  app.post("/ai/cbt", async (c) => {
    const { userId } = c.get("user");
    const body = cbtSchema.parse(await c.req.json().catch(() => ({})));
    const history = (body.conversationHistory ?? []).slice(-12);
    const adapter = selectAdapter(userId);
    try {
      const result = await adapter.cbtReply({
        message: body.message,
        conversationHistory: history,
      });
      return c.json(result);
    } catch (err) {
      if (err instanceof RemoteAiError) {
        console.warn(`[ai] remote CBT failed, falling back to template:`, err.message);
        const fallback = new TemplateAiAdapter();
        return c.json(await fallback.cbtReply({
          message: body.message,
          conversationHistory: history,
        }));
      }
      throw err;
    }
  });

  app.post("/ai/moderate", async (c) => {
    const { userId } = c.get("user");
    const body = moderateSchema.parse(await c.req.json().catch(() => ({})));
    try {
      const adapter = selectAdapter(userId);
      const result = await adapter.moderate({ message: body.message, userId });
      return c.json(result);
    } catch (err) {
      console.error("[ai] moderate failed", err);
      return c.json({
        flagged: false,
        severity: null,
        reason: "Moderation service unavailable",
        requiresIntervention: false,
        moderationUnavailable: true,
      });
    }
  });

  return app;
}
