import { json } from "@remix-run/node";
import db from "../db.server";

/* ------------------------------- CORS ----------------------------------- */
const SHOPIFY_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/;

function withCors(request, response) {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = SHOPIFY_ORIGIN_REGEX.test(origin)
    ? origin
    : "https://wishhub-2.myshopify.com";

  const headers = new Headers(response.headers || {});
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Accept"
  );
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function errorResponse(request, message, status = 500) {
  const res = json({ ok: false, error: message }, { status });
  return withCors(request, res);
}

function ok(request, payload, init = 200, extraHeaders) {
  const res = json({ ok: true, ...payload }, { status: init, headers: extraHeaders });
  return withCors(request, res);
}

const hasCustomerId = (v) => !!(v && String(v).trim() !== "");

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const shop = url.searchParams.get("shop");

    console.log("[wishlist] Loader hit", {
      customerId,
      shop,
      origin: request.headers.get("origin"),
      method: request.method,
      url: request.url
    });

    if (hasCustomerId(customerId) && shop) {
      console.log("[wishlist] Fetching wishlists for customer:", customerId, "shop:", shop);

      const wishlists = await db.wishlist.findMany({
        where: { customerId: String(customerId), ShopId: String(shop) }
      });

      const duration = Date.now() - startTime;
      console.log(`[wishlist] Query completed in ${duration}ms, found ${wishlists.length} items`);

      return ok(request, { migrated: false, wishlists });
    }

    console.log("[wishlist] No valid customerId or shop provided");
    return ok(request, { migrated: false, wishlists: [] });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("[wishlist] Loader error after", duration, "ms:", err);
    console.error("[wishlist] Error stack:", err.stack);
    return errorResponse(request, "Internal server error");
  }
}

/* -------------------------------- Action -------------------------------- */
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  if (request.method !== "POST") {
    return errorResponse(request, "Method Not Allowed", 405);
  }

  let data = {};
  const contentType = request.headers.get("Content-Type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("form")) {
      data = Object.fromEntries(await request.formData());
    } else {
      return errorResponse(request, "Unsupported content type", 415);
    }

    if (data.payload) {
      data = { ...data, ...data.payload };
      delete data.payload; // Clean up to avoid confusion
      console.log("[wishlist] Flattened nested payload:", { keys: Object.keys(data) });
    }
  } catch (e) {
    console.error("[wishlist] Parse body error:", e);
    return errorResponse(request, "Invalid request body", 400);
  }

  try {
    if (data.action === "DELETE" || data._action === "DELETE") {
      return await handleDelete(request, data);
    }

    if (data.action === "MIGRATE") {
      return await handleMigrate(request, data);
    }

    if (!hasCustomerId(data.customerId)) {
      return ok(request, {
        message: "Guest wishlist data must be stored client-side",
        wishlist: [],
      });
    }

    return await handleUpsert(request, data);
  } catch (err) {
    console.error("[wishlist] Action error:", err);
    return errorResponse(request, "Operation failed");
  }
}

/* ----------------------------- Upsert Handler ---------------------------- */
async function handleUpsert(request, data) {
  const {
    customerId,
    productId,
    variantId, 
    productTitle,
    shop,
    quantity: qty = "1",
    price,
    productImage,
    variantTitle,
  } = data;

  if (!productId || !shop || !productTitle) {
    return errorResponse(request, "Missing required fields: productId/productTitle/shop", 400);
  }

  const parsedQty = parseInt(qty, 10) || 1;
  const parsedPrice = Number.isFinite(parseFloat(price)) ? parseFloat(price) : 0;

  let cleanedProductTitle = productTitle.replace(/\r?\n/g, ' ').trim();

  try {
    const wishlist = await db.wishlist.upsert({
      where: {
        customerId_productId_variantId_ShopId: {
          customerId: String(customerId),
          productId: String(productId),
          variantId: variantId ? String(variantId) : "default",
          ShopId: String(shop),
        },
      },
      update: {
        quantity: { increment: parsedQty },
        productTitle: cleanedProductTitle,
        productImage,
        price: parsedPrice,
        variantId: variantId ? String(variantId) : "default",
        variantTitle: variantTitle || null,
      },
      create: {
        customerId: String(customerId),
        productId: String(productId),
        variantId: variantId ? String(variantId) : "default",
        ShopId: String(shop),
        productTitle: cleanedProductTitle,
        quantity: parsedQty,
        price: parsedPrice,
        productImage,
        variantTitle: variantTitle || null,
      },
    });

    return ok(request, { message: "Item added/updated", wishlist });
  } catch (e) {
    console.warn("[wishlist] Upsert failed, trying fallback:", e?.code || e?.message);

    try {
      const existing = await db.wishlist.findFirst({
        where: {
          customerId: String(customerId),
          productId: String(productId),
          variantId: variantId ? String(variantId) : "default",
          ShopId: String(shop),
        },
      });

      const wishlist = existing
        ? await db.wishlist.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + parsedQty,
              productTitle: cleanedProductTitle,
              productImage,
              price: parsedPrice,
              variantId: variantId ? String(variantId) : "default",
              variantTitle: variantTitle || null,
            },
          })
        : await db.wishlist.create({
            data: {
              customerId: String(customerId),
              productId: String(productId),
              variantId: variantId ? String(variantId) : "default",
              ShopId: String(shop),
              productTitle: cleanedProductTitle,
              quantity: parsedQty,
              price: parsedPrice,
              productImage,
              variantTitle: variantTitle || null,
            },
          });

      return ok(request, { message: "Item added/updated (fallback)", wishlist });
    } catch (inner) {
      console.error("[wishlist] Fallback failed:", inner);
      return errorResponse(request, "Database operation failed", 500);
    }
  }
}

async function handleDelete(request, data) {
  const { customerId } = data;

  if (!hasCustomerId(customerId)) {
    return ok(request, {
      message: "Guest wishlist deletion must be handled client side",
      deletedCount: 0,
    });
  }

  if (Array.isArray(data.ids) && data.ids.length) {
    const validIds = data.ids.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    const result = await db.wishlist.deleteMany({ where: { id: { in: validIds } } });
    return ok(request, { message: `Deleted ${result.count} items`, deletedCount: result.count });
  }

  if (data.id) {
    const id = parseInt(data.id, 10);
    if (isNaN(id)) return errorResponse(request, "Invalid ID format", 400);
    await db.wishlist.delete({ where: { id } });
    return ok(request, { message: "Item deleted successfully" });
  }

  
  if (data.productId && data.shop) {
    const whereClause = {
      customerId: String(customerId),
      productId: String(data.productId),
      ShopId: String(data.shop),
    };

    
    if (data.variantId) {
      whereClause.variantId = String(data.variantId);
    }

    const result = await db.wishlist.deleteMany({
      where: whereClause,
    });
    return ok(request, { message: `Deleted ${result.count} items`, deletedCount: result.count });
  }

  return errorResponse(request, "Missing ID(s) for deletion", 400);
}

async function handleMigrate(request, data) {
  const { customerId, localStorageItems } = data;

  if (!hasCustomerId(customerId) || !Array.isArray(localStorageItems)) {
    return errorResponse(request, "Invalid migration data", 400);
  }

  const items = localStorageItems
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? "").trim(),
      variantId: item.variantId ? String(item.variantId) : null,
      productTitle: String(item.productTitle ?? item.title ?? ""),
      variantTitle: item.variantTitle || null, 
      quantity: Math.max(1, parseInt(item.quantity ?? 1, 10) || 1),
      price: Number.isFinite(parseFloat(item.price)) ? parseFloat(item.price) : 0,
      productImage: item.productImage ?? item.image ?? null,
      shop: item.shop ? String(item.shop) : null,
    }))
    .filter((it) => it.productId && it.shop);

  if (!items.length) {
    return ok(request, { message: "No items to migrate" });
  }

  console.log("[wishlist] Migrating localStorage → DB", {
    customerId: String(customerId),
    count: items.length,
    itemsWithVariants: items.filter(item => item.variantId).length,
  });

  try {
    const ops = items.map((it) =>
      db.wishlist.upsert({
        where: {
          customerId_productId_variantId_ShopId: {
            customerId: String(customerId),
            productId: it.productId,
            variantId: it.variantId || "default",
            ShopId: it.shop,
          },
        },
        update: {
          quantity: { increment: it.quantity },
          productTitle: it.productTitle,
          price: it.price,
          productImage: it.productImage,
          variantId: it.variantId || "default",
          variantTitle: it.variantTitle || null,
        },
        create: {
          customerId: String(customerId),
          productId: it.productId,
          variantId: it.variantId || "default",
          productTitle: it.productTitle,
          quantity: it.quantity,
          price: it.price,
          productImage: it.productImage,
          ShopId: it.shop,
          variantTitle: it.variantTitle || null,
        },
      })
    );

    await db.$transaction(ops);
    return ok(request, { message: "Migration successful" });
  } catch (e) {
    console.warn("[wishlist] Migration transaction failed, falling back:", e?.code || e?.message);
    for (const it of items) {
      try {
        const existing = await db.wishlist.findFirst({
          where: {
            customerId: String(customerId),
            productId: it.productId,
            variantId: it.variantId || "default",
            ShopId: it.shop,
          },
        });

        if (existing) {
          await db.wishlist.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + it.quantity,
              productTitle: it.productTitle || existing.productTitle,
              price: it.price ?? existing.price,
              productImage: it.productImage ?? existing.productImage,
              variantId: it.variantId || "default",
              variantTitle: it.variantTitle || existing.variantTitle,
            },
          });
        } else {
          await db.wishlist.create({
            data: {
              customerId: String(customerId),
              productId: it.productId,
              variantId: it.variantId || "default",
              productTitle: it.productTitle,
              quantity: it.quantity,
              price: it.price,
              productImage: it.productImage,
              ShopId: it.shop,
              variantTitle: it.variantTitle || null,
            },
          });
        }
      } catch (inner) {
        console.error("[wishlist] Migration item failed:", inner);
      }
    }
    return ok(request, { message: "Migration completed with fallbacks" });
  }
}
