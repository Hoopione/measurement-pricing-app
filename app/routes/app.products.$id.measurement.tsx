import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, TextField, Button, Banner } from "@shopify/polaris";
import { gql } from "graphql-request";
import { shopifyAdmin, authenticate } from "~/shopify.server";

// 1) Produkt + bestehendes Metafield laden
const PRODUCT_QUERY = gql`
  query ProductWithMeta($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 50) { nodes { id, title, price } }
      metafield(namespace:"measurement", key:"pricing") { id, value }
    }
  }
`;

// 2) Metafield speichern
const UPSERT_METAFIELD = gql`
  mutation UpsertProductMeta($ownerId: ID!, $value: String!) {
    metafieldsSet(metafields: [{
      ownerId: $ownerId,
      namespace: "measurement",
      key: "pricing",
      type: "json",
      value: $value
    }]) {
      userErrors { field, message }
    }
  }
`;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const client = shopifyAdmin({ session });

  const id = `gid://shopify/Product/${params.id}`;
  const data = await client.request(PRODUCT_QUERY, { id });
  return json({ product: data.product });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const client = shopifyAdmin({ session });

  const form = await request.formData();
  const payload = form.get("pricing") as string;
  const ownerId = `gid://shopify/Product/${params.id}`;

  await client.request(UPSERT_METAFIELD, { ownerId, value: payload || "{}" });
  return redirect(request.url);
}

export default function ProductMeasurement() {
  const { product } = useLoaderData<typeof loader>();
  const initial = product.metafield?.value || JSON.stringify({
    unit: "cm",
    mode: "rect",
    tiers: [
      // Beispiel-Stufen:
      // { id: "S", label: "bis 80 x 80", rules: { width: {max:80}, height:{max:80} }, variantId:"VARIANT_GID" }
    ]
  }, null, 2);

  return (
    <Page title={`Measurement – ${product.title}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <p>Varianten (ID für Zuweisung):</p>
            <ul style={{marginBottom: 10}}>
              {product.variants.nodes.map((v:any)=>(
                <li key={v.id}>{v.title} — {v.price} — <code>{v.id}</code></li>
              ))}
            </ul>
            <Form method="post">
              <TextField
                label="Pricing JSON"
                name="pricing"
                multiline={16}
                defaultValue={initial}
                autoComplete="off"
              />
              <div style={{marginTop:12}}>
                <Button submit primary>Speichern</Button>
              </div>
            </Form>
            <Banner tone="info" title="Schema">
              <pre style={{whiteSpace:"pre-wrap"}}>
{`{
  "unit": "cm",
  "mode": "rect",
  "tiers": [
    { "id": "S", "label":"bis 80x80",
      "rules": { "width": {"max":80}, "height":{"max":80} },
      "variantId":"gid://shopify/ProductVariant/1234567890"
    }
  ]
}`}
              </pre>
            </Banner>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
