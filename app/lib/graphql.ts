export const GET_PRODUCT_TIER_METAFIELD = `#graphql
  query($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
          }
        }
      }
      metafield(namespace: "custom", key: "measurement_pricing") {
        id
        value
        type
      }
    }
  }
`;

export const UPSERT_PRODUCT_TIER_METAFIELD = `#graphql
  mutation Upsert($productId: ID!, $value: String!) {
    metafieldsSet(
      metafields: [
        {
          namespace: "custom",
          key: "measurement_pricing",
          ownerId: $productId,
          type: "json",
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
