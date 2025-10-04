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
  Banner,
} from "@shopify/polaris";

import {
  GET_PRODUCT_TIER_METAFIELD,
  UPSERT_PRODUCT_TIER_METAFIELD,
} from "../lib/graphql";
import { authenticate } from "../shopify.server";

type VariantRow = [string, string, string];

// Hilfsfunktion: numerische ID -> GID
function toProductGid(idOrGid: string) {
  if (idOrGid.startsWith("gid://")) return idOrGid;
  return `gid://shopify/Product/${idOrGid}`;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const raw = decodeURIComponent(params.id!);
  const id = toProductGid(raw);

  try {
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

    return json({
      product,
      config,
      error: null as string | null,
    });
  } catch (e: any) {
    // Fehler an die UI liefern statt 500
    return json(
      {
        product: null,
        config: null,
        error:
          e?.message ??
          "Fehler beim Laden der Produktdaten. Prüfe API-Scopes und Logs.",
      },
      { status: 200 }
    );
  }
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const raw = decodeURIComponent(params.id!);
  const productId = toProductGid(raw);

  try {
    const form = await request.formData();
    const value = (form.get("value") as string) ?? "{}";

    const resp = await admin.graphql(UPSERT_PRODUCT_TIER_METAFIELD, {
      variables: { productId, value },
    });
    const body = await resp.json();

    const errors: Array<{ field?: string[]; message: string }> =
      body?.data?.metafieldsSet?.userErrors ?? [];

    return json({ ok: errors.length === 0, errors });
  } catch (e: any) {
    return json({
      ok: false,
      errors: [{ message: e?.message ?? "Unbekannter Fehler beim Speichern." }],
    });
  }
}

export default function ProductTiersPage() {
  const { product, config, error } = useLoaderData<typeof loader>();
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
        {error ? (
          <Layout.Section>
            <Banner tone="critical" title="Fehler">
              {error}
            </Banner>
          </Layout.Section>
        ) : null}

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