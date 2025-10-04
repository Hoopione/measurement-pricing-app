import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "~/shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {
    apikey: process.env.SHOPIFY_API_KEY || "",
  };
};

export default function App() {
  const { apikey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apikey}>
      <nav style={{ padding: "1rem", background: "#f6f6f7", marginBottom: "1rem" }}>
        <ul style={{ listStyle: "none", display: "flex", gap: "2rem", margin: 0 }}>
          <li>
            <Link to="/app" rel="home">🏠 Home</Link>
          </li>
          <li>
            <Link to="/app/additional">📄 Additional Page</Link>
          </li>
          <li>
            <Link to="/app/products/1018299296979/measurement">📏 Measurement Testseite</Link>
          </li>
        </ul>
      </nav>

      <Outlet />
    </AppProvider>
  );
}

// Fehlerbehandlung
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// Header-Funktion
export const headers: HeadersFunction = ({ headers }) => {
  return headers;
};