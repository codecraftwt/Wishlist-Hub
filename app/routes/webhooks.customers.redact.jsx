// app\routes\webhooks\customers\redact.jsx

import { authenticate } from "~/shopify.server";
import db from "~/db.server";

export const loader = async () => {
 
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(`✅ Verified ${topic} webhook for ${shop}`);

    // Delete customer data
    const customerId = payload.customer?.id;
    if (customerId) {
      await db.customerData.deleteMany({
        where: {
          shop: shop,
          customerId: customerId.toString()
        }
      });
      console.log(`Deleted data for customer ${customerId} from shop ${shop}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
