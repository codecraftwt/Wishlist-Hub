// app\routes\webhooks\app\update.jsx

import { authenticate } from "~/shopify.server";
import db from "~/db.server";

export const loader = async () => {
 
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};


export const action = async ({ request }) => {
  try {
    const { payload, session, topic, shop } = await authenticate.webhook(request);

    console.log(`Verified ${topic} webhook for ${shop}`);

    if (session) {
      await db.session.update({
        where: { id: session.id },
        data: { shopInfo: JSON.stringify(payload) },
      });
    }

    return new Response("Webhook verified", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
