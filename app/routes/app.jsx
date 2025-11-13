import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import {
  Spinner,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Card,
  ProgressBar,
} from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "", shop: session.shop };
};

export default function App() {
  const { apiKey, shop } = useLoaderData();
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (navigation.state === "loading") {
      let value = 0;
      const interval = setInterval(() => {
        value = Math.min(value + Math.random() * 6, 95);
        setProgress(value);
      }, 180);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [navigation.state]);

  if (navigation.state === "loading") {
    return (
      <AppProvider isEmbeddedApp apiKey={apiKey} shop={shop}>
        <Box
          as="div"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          background="bg-surface-secondary"
          width="100%"
          position="relative"
        >
          <Card
            padding="800"
            roundedAbove="sm"
            background="bg-surface"
            shadow="md"
          >
            <BlockStack align="center" gap="400">
              <InlineStack align="center" gap="200">
                <Spinner
                  accessibilityLabel="Loading Walstar Wishlist Hub"
                  size="large"
                />
              </InlineStack>

              <Text variant="headingLg" as="h2" alignment="center">
                Initializing Walstar Wishlist Hub
              </Text>
              <Text variant="bodyMd" tone="subdued" alignment="center">
                Setting up your app — please wait a moment.
              </Text>

              <Box width="100%" marginBlockStart="400">
                <InlineStack align="center">
                  <Box width="250px">
                    <ProgressBar progress={progress} size="small" />
                  </Box>
                </InlineStack>
              </Box>

              <Text
                variant="bodySm"
                tone="subdued"
                alignment="center"
                style={{ marginTop: "0.25rem" }}
              >
                {Math.round(progress)}% complete
              </Text>
            </BlockStack>
          </Card>
        </Box>
      </AppProvider>
    );
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} shop={shop}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/wishlist">Wishlist</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
