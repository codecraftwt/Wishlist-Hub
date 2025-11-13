// app\routes\webhooks\customers\data_request.jsx

import { authenticate } from "~/shopify.server";

export const loader = async () => {
 
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(`✅ Verified ${topic} webhook for ${shop}`);

    // Log the data request for compliance
    console.log('GDPR Data Request received for:', {
      shop,
      customer: payload.customer?.id,
      orders_requested: payload.orders_requested
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
