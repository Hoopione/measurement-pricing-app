import { gql } from "graphql-request";

// Lädt Produkt + das eine Metafield (namespace=measurement, key=pricing)
export const GET_PRODUCT_TIER_METAFIELD = gql`
  query ProductWithMeta($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 50) {
        edges {
          node {
            id
            title
            price
          }
        }
      }
      metafield(namespace: "measurement", key: "pricing") {
        id
        value
      }
    }
  }
`;

// Speichert das Metafield am Produkt (als JSON-String)
export const UPSERT_PRODUCT_TIER_METAFIELD = gql`
  mutation UpsertProductMeta($productId: ID!, $value: String!) {
    metafieldsSet(
      metafields: [
        {
          ownerId: $productId
          namespace: "measurement"
          key: "pricing"
          type: "json"
          value: $value
        }
      ]
    ) {
      userErrors {
        field
        message
      }
    }
  }
`;