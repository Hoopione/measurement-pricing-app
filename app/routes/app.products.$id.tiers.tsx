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

import { GET_PRODUCT_TIER_METAFIELD, UPSERT_PRODUCT_TIER_METAFIELD } from "~/lib/graphql";
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
  return json({ ok: errors.length === 0, errors });
}

export default function ProductTiersPage() {
  const { product, config } = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const busy = nav.state === "submitting";

  const [jsonValue, setJsonValue] = React.useState(
    JSON.stringify(
      config ?? { unit: "cm", mode: "area", tiers: [], fallbackVariantId: null },
      null,
      2
    )
  );

  const rows: VariantRow[] =
    product?.variants?.edges?.map(({ node }: any) => [
      node.title,
      node.id,
      `${node.price} €`,
    ]) ?? [];

  return (
    <Page title={`Preisstaffeln: ${product?.title ?? ""}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              <TextField
                label="Konfiguration (JSON)"
                value={jsonValue}
                onChange={setJsonValue}
                multiline={16}
                name="value"
                autoComplete="off"
              />
              <InlineStack align="end">
                <Button submit primary disabled={busy} loading={busy}>
                  Speichern
                </Button>
              </InlineStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Varianten (Zur Zuordnung der Preisstaffeln)">
            <DataTable
              columnContentTypes={["text", "text", "text"]}
              headings={["Titel", "ID", "Preis"]}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
