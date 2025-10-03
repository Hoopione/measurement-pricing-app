import * as React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  InlineStack,
  Button,
  DataTable,
} from "@shopify/polaris";

import { GET_PRODUCT_TIER_METAFIELD, UPSERT_PRODUCT_TIER_METAFIELD } from "~/app/lib/graphql";
import { authenticate } from "~/shopify.server"; // kommt aus dem Shopify-CLI-Template

type VariantRow = [string, string, string];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const id = decodeURIComponent(params.id!);

  // Admin-GraphQL aufrufen
  const resp = await admin.graphql(GET_PRODUCT_TIER_METAFIELD, {
    variables: { id },
  });
  const body = await resp.json();

  const product = body?.data?.product;
  const mfRaw = product?.metafield?.value;
  let config: unknown = null;
  try {
    config = mfRaw ? JSON.parse(mfRaw) : null;
  } catch {
    config = null;
  }

  return json({ product, config });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const id = decodeURIComponent(params.id!);
  const form = await request.formData();
  const value = form.get("value") as string;

  const resp = await admin.graphql(UPSERT_PRODUCT_TIER_METAFIELD, {
    variables: { productId: id, value },
  });
  const body = await resp.json();

  const errors = body?.data?.metafieldsSet?.userErrors ?? [];
  return json({ ok: errors.length =
