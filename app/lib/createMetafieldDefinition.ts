// app/lib/createMetafieldDefinition.ts
import { gql } from "graphql-request";
import { shopifyAdmin } from "../shopify.server"; // <- existiert im Template

const MUTATION = gql`
  mutation CreateDefinition {
    metafieldDefinitionCreate(definition: {
      name: "Measurement Pricing",
      namespace: "measurement",
      key: "pricing",
      type: "json",
      ownerType: PRODUCT
    }) {
      createdDefinition { id, name, namespace, key, type { name } }
      userErrors { field, message }
    }
  }
`;

export async function ensureMetafieldDefinition(session: any) {
  const client = shopifyAdmin({ session });
  await client.request(MUTATION);
}
