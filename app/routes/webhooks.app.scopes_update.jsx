import { authenticate } from "~/shopify.server";
import db from "~/db.server";

export const loader = async () => {
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    // Authenticate the webhook
    const { payload, session, topic, shop } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);
    const current = payload.current;

    if (session) {
      await db.session.update({
        where: {
          id: session.id,
        },
        data: {
          scope: current.toString(),
        },
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
