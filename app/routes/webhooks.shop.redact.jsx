import { authenticate } from "../shopify.server";
import db from "~/db.server";

export const loader = async () => {
 
  return new Response("Webhook endpoint. Please use POST.", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(`✅ Verified ${topic} webhook for ${shop}`);

    await db.shopData.deleteMany({ where: { shop } });
    await db.customerData.deleteMany({ where: { shop } });
    console.log(`Deleted all data for shop ${shop}`);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};

