import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, shopifyApp, BillingInterval } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

export const MONTHLY_PLAN = 'Monthly subscription';
export const ANNUAL_PLAN = 'Annual subscription';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  billing: {
    [MONTHLY_PLAN]: {
      lineItems: [
        {
          amount: 10,
          currencyCode: 'USD',
          interval: BillingInterval.Every30Days,
        }
      ],
    },
    [ANNUAL_PLAN]: {
      lineItems: [
        {
          amount: 100,
          currencyCode: 'USD',
          interval: BillingInterval.Annual,
        }
      ],
    },
  },
  webhooks: {
    path: "/webhooks",
  },
  auth: {
    afterAuth: async ({ session, admin, redirect }) => {
      try {
        console.log('Registering webhooks for shop:', session.shop);
        
        const webhooksToRegister = [
          {
            path: "/webhooks/app/uninstalled",
            topic: "APP_UNINSTALLED",
          },
          {
            path: "/webhooks/shop/update",
            topic: "SHOP_UPDATE",
          },
          {
            path: "/webhooks/app/update",
            topic: "APP_UPDATE",
          },
          {
            path: "/webhooks/app/scopes_update",
            topic: "APP_SCOPES_UPDATE",
          },
        
          {
            path: "/webhooks/customers/data_request",
            topic: "CUSTOMERS_DATA_REQUEST",
          },
          {
            path: "/webhooks/customers/redact",
            topic: "CUSTOMERS_REDACT",
          },
          {
            path: "/webhooks/shop/redact",
            topic: "SHOP_REDACT",
          },
        ];

        const registration = await registerWebhooks({ session, webhooks: webhooksToRegister });
        console.log("Webhook registration result:", registration);
        
        if (registration && registration.success) {
          console.log('Webhooks registered successfully');
        } else {
          console.error('Webhook registration failed:', registration.result);
        }

      } catch (error) {
        console.error('Error in afterAuth:', error);
      }

      return redirect("/app");
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {})
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
