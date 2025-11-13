import {
  Page,
  Card,
  DataTable,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Box,
  Text,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shopResponse = await admin.graphql(`
    query {
      shop {
        id
      }
    }
  `);
  const shopData = await shopResponse.json();
  const shopId = shopData.data?.shop?.id?.replace('gid://shopify/Shop/', '') || session.shop;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const where = {
    ShopId: shopId,
    ...(search && {
      OR: [
        { productTitle: { contains: search, mode: "insensitive" } },
        { variantTitle: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const wishlists = await db.wishlist.findMany({
    where,
    orderBy: { id: "desc" },
  });

  return json({
    wishlists,
    shop: shopId,
  });
}

export default function WishlistPage() {
  const { wishlists, shop } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const rows = wishlists.map((item) => {
    const productTitle = item.productTitle || "Unknown Product";
    const variantTitle = item.variantTitle || "";

    return [
      item.customerId,
      productTitle,
      variantTitle,
      item.quantity,
    ];
  });

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    params.delete("page"); 
    navigate(`?${params.toString()}`);
  };

  return (
    <Page fullWidth>
      <TitleBar title="Wishlist Hub" />

      <BlockStack gap="500">
        <Box
          background="bg-surface-secondary"
          paddingBlock="400"
          paddingInline="600"
          borderRadius="400"
          shadow="card"
        >
          <BlockStack align="center" gap="200">
            <Text
              as="h1"
              variant="heading2xl"
              alignment="center"
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "#2C1A4C",
              }}
            >
              Wishlist Management ❤️
            </Text>
            <BlockStack align="center" gap="100">
              <Text
                as="p"
                alignment="center"
                style={{
                  fontSize: "50px",
                  color: "#5c5c5c",
                  maxWidth: "600px",
                }}
              >
                View and manage all wishlist items from your logged-in customers. Search and Analyze wishlist data to understand customer preferences.
              </Text>
              <Text
                as="p"
                alignment="center"
                style={{
                  fontSize: "1rem",
                  color: "#888",
                  maxWidth: "600px",
                  fontStyle: "italic",
                }}
              >
                <strong>Note:</strong> Guest user wishlists are stored locally and not displayed here.
              </Text>
            </BlockStack>
          </BlockStack>
        </Box>

        <Card padding="600" shadow="card">
          <BlockStack gap="400">
            <Text
              as="h2"
              variant="headingLg"
              style={{
                color: "#2C1A4C",
                fontWeight: 600,
              }}
            >
              Wishlist Items
            </Text>

            <Divider />

            <InlineStack gap="400" align="end">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search Wishlist"
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search by product or variant title..."
                  autoComplete="off"
                />
              </div>
              <Button onClick={handleSearch} variant="primary" size="large">
                Search
              </Button>
              {searchValue && (
                <Button onClick={() => {
                  setSearchValue("");
                  const params = new URLSearchParams(searchParams);
                  params.delete("search");
                  params.delete("page");
                  navigate(`?${params.toString()}`);
                }} variant="secondary" size="large">
                  Clear
                </Button>
              )}
            </InlineStack>

            {rows.length > 0 ? (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "numeric",
                ]}
                headings={[
                  "Customer ID",
                  "Product Title",
                  "Variant Title",
                  "Quantity",
                ]}
                rows={rows}
                increasedTableDensity
              />
            ) : (
              <Box
                background="bg-surface"
                padding="600"
                borderRadius="300"
                shadow="card"
              >
                <BlockStack align="center" gap="300">
                  <Text
                    as="p"
                    variant="bodyMd"
                    tone="subdued"
                    alignment="center"
                  >
                    No wishlist items found. {searchValue ? "Try adjusting your search criteria." : "Customers haven't added any items to their wishlists yet."}
                  </Text>
                  {searchValue && (
                    <Button onClick={() => setSearchValue("")} variant="secondary">
                      Clear Search
                    </Button>
                  )}
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

