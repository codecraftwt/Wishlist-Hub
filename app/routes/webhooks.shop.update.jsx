// app\routes\webhooks\shop\update.jsx

import { authenticate } from "../shopify.server";

export const loader = async () => {
 
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`✅ Verified ${topic} webhook for ${shop}`, payload);

    // Save/update shop info in DB here if needed

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
