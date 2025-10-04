// app/shopify.server.ts
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// ---------------------------------------------------------------------
// Shopify App-Initialisierung
// ---------------------------------------------------------------------
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: (process.env.SCOPES || "").split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// ---------------------------------------------------------------------
// Exporte, die von Remix/den Routen genutzt werden
// ---------------------------------------------------------------------
export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

// ---------------------------------------------------------------------
// ✅ Fehlender Helper: Admin GraphQL Client
// In deinen Routen kannst du damit den Admin-GraphQL-Client erzeugen:
//   const client = shopifyAdmin(session);
//   const result = await client.query({ data: { query: "...", variables: {} } });
// ---------------------------------------------------------------------
export function shopifyAdmin(session: any) {
  return new shopify.api.clients.Graphql({ session });
}