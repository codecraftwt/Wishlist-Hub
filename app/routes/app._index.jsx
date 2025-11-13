import { useEffect } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Layout,
  Box,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let themeId = null;

  try {
    const response = await admin.graphql(`
      query {
        themes(first: 10, roles: [MAIN]) {
          edges {
            node {
              id
            }
          }
        }
      }
    `);

    const data = await response.json();

    const mainTheme = data?.data?.themes?.edges?.[0]?.node;
    if (mainTheme && mainTheme.id) {
      const match = mainTheme.id.match(/\/(\d+)$/);
      themeId = match ? match[1] : null; 
    }
  } catch (error) {
    console.error("Failed to fetch live theme:", error);
  }

  if (!themeId) {
    try {
      const fallbackResponse = await admin.graphql(`
        query {
          themes(first: 1, roles: [PUBLISHED]) {
            edges {
              node {
                id
              }
            }
          }
        }
      `);
      const fallbackData = await fallbackResponse.json();
      const published = fallbackData?.data?.themes?.edges?.[0]?.node;
      if (published?.id) {
        const match = published.id.match(/\/(\d+)$/);
        themeId = match ? match[1] : "current";
      }
    } catch (error) {
      console.error("Fallback theme fetch failed:", error);
    }
  }

  themeId = themeId || "current";

  const shopDomain = session.shop.replace(".myshopify.com", "");
  const themeEditorUrl = `https://admin.shopify.com/store/${shopDomain}/themes/${themeId}/editor?context=apps`;

  return {
    shop: session.shop,
    themeId,
    themeEditorUrl,
  };
};



export default function Index() {
  const { themeEditorUrl } = useLoaderData();

  useEffect(() => {
    document.title = "WishList Hub | Dashboard";
  }, []);

  return (
    <Page fullWidth>
      <TitleBar title="WishList Hub" />

      <BlockStack gap="700">
        <div style={{ textAlign: "center" }}>
          <Box
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            paddingBlock="1000"
            paddingInline="600"
            borderRadius="400"
            shadow="card"
          >
            <BlockStack align="center" gap="400">
              <Text
                as="h1"
                variant="heading3xl"
                alignment="center"
                style={{
                  fontWeight: 800,
                  color: "white",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  marginBottom: "20px",
                }}
              >
                Welcome to <span style={{ color: "#006effff" }}>Wishlist Hub❤️</span>
              </Text>

              <Text
                as="p"
                variant="bodyLg"
                alignment="center"
                style={{
                  maxWidth: "900px",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: "1.8",
                  fontWeight: 400,
                }}
              >
                Instantly add a powerful Wishlist system to your Shopify store — no
                coding, setup, or theme editing required. Just install, toggle{" "}
                <span style={{ color: "#ff9500ff", fontWeight: 700 }}>ON</span>, and let
                <span style={{ color: "#0044ffff", fontWeight: 600 }}> WishList Hub</span> do
                the magic.
              </Text>

              <Box
                background="rgba(255,255,255,0.2)"
                padding="400"
                borderRadius="300"
                shadow="card"
                style={{ backdropFilter: "blur(10px)" }}
              >
                <Text
                  as="p"
                  variant="bodySm"
                  alignment="center"
                  style={{
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  ✨ Transform your store in seconds • No technical skills required
                </Text>
              </Box>
            </BlockStack>
          </Box>
        </div>

        {[
          {
            title: "Why WishList Hub?",
            content: (
              <>
                <Text
                  as="p"
                  variant="bodyLg"
                  alignment="center"
                  tone="subdued"
                  maxWidth="750px"
                  style={{
                    margin: "0 auto 20px",
                    lineHeight: "1.7",
                  }}
                >
                  Shopify doesn’t offer a built-in wishlist feature. WishList Hub gives your
                  customers a beautiful, seamless wishlist experience — instantly.
                </Text>

                <InlineStack gap="400" align="center">
                  {[
                    {
                      title: "Single-Click Activation",
                      desc: "Enable WishList Hub with one switch. No coding or setup required.",
                    },
                    {
                      title: "Works Everywhere",
                      desc: "Heart icons appear automatically across your entire store.",
                    },
                    {
                      title: "Smart Customization",
                      desc: "Match your brand with effortless style settings.",
                    },
                  ].map((item, idx) => (
                    <Card
                      key={idx}
                      padding="600"
                      background="bg-surface"
                      shadow="card"
                      style={{
                        flex: 1,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        border: "1px solid #e1e5e9",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px)";
                        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 25px rgba(0,0,0,0.06)";
                      }}
                    >
                      <BlockStack gap="300" align="center">
                                               <Text
                          variant="headingLg"
                          as="h3"
                          alignment="center"
                          style={{
                            color: "#2C1A4C",
                            fontWeight: 700,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          alignment="center"
                          style={{
                            color: "#666",
                            fontSize: "1rem",
                            lineHeight: "1.6",
                          }}
                        >
                          {item.desc}
                        </Text>
                      </BlockStack>
                    </Card>
                  ))}
                </InlineStack>
              </>
            ),
          },

          {
            title: "How WishList Hub Works",
            content: (
              <>
                <Text
                  as="p"
                  variant="bodySm"
                  alignment="center"
                  tone="subdued"
                  maxWidth="700px"
                  style={{
                    margin: "0 auto 40px",
                    lineHeight: "1.6",
                  }}
                >
                  Activating WishList Hub is effortless. Just follow these two steps:
                </Text>

                <Layout>
                  {[
                    {
                      step: "1. Install WishList Hub",
                      desc: "Get WishList Hub from the Shopify App Store with one click.",
                      img: "/app.png",
                    },
                    {
                      step: "2. Enable Wishlist",
                      desc: "Turn it ON in your admin panel — instantly activates.",
                      img: "/Enable.png",
                    },
                  ].map((step, i) => (
                    <Layout.Section oneHalf key={i}>
                      <div
                        style={{
                          textAlign: "center",
                          padding: "30px 10px",
                        }}
                      >
                        <Card
                          padding="500"
                          background="bg-surface"
                          shadow="card"
                          style={{
                            minHeight: "350px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <BlockStack gap="300" align="center">
                            <Text
                              variant="headingLg"
                              as="h3"
                              style={{
                                color: "#2C1A4C",
                                fontWeight: 600,
                              }}
                            >
                              {step.step}
                            </Text>

                            <Text
                              alignment="center"
                              tone="subdued"
                              style={{
                                fontSize: "1rem",
                                maxWidth: "400px",
                              }}
                            >
                              {step.desc}
                            </Text>

                            <div
                              style={{
                                width: "100%",
                                height: "320px",
                                borderRadius: "12px",
                                overflow: "hidden",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                marginTop: "20px",
                              }}
                            >
                              <img
                                src={step.img}
                                alt={step.step}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  transition: "transform 0.4s ease",
                                }}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.transform = "scale(1.05)")
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              />
                            </div>
                          </BlockStack>
                        </Card>
                      </div>
                    </Layout.Section>
                  ))}
                </Layout>

                <Divider style={{ margin: "40px 0" }} />

                <Text
                  as="p"
                  alignment="center"
                  style={{ fontSize: "4rem", fontWeight: "bold", marginBottom: "20px" }}
                >
                  Once enabled, WishList Hub automatically:
                </Text>

                <Layout>
                  {[
                    {
                      title: "❤️ Wishlist heart icon",
                      desc: " Heart Icon appears on all product cards automatically.",
                      img: "/heart.png",
                    },
                    {
                      title: "💖 Wishlist button",
                      desc: "Wishlist Button is displayed on every product page instantly.",
                      img: "/button.png",
                    },
                       {
                      title: "🗂️ Wishlist Page",
                      desc: "Admin Needs to Add the Section From the App .",
                      img: "/page1.png",
                    },
                    {
                      title: "🗂️ Wishlist Page",           
                      desc: "Once Added! The Wishlist Page Section is Inserted into Shopify theme. ",
                      img: "/page.png",
                    },
                    {
                      title: "❤️ Wishlist Counter",
                      desc: "A Floating counter icon showing the number of wishlist items",
                      img: "/counter .png",
                    },
                       {
                      title: "❤️ Wishlist Counter",
                      desc: "A Slide-out drawer Available on Click of the Counter for quick access and management.",
                      img: "/counter1.png",
                    },
                    {
                      title: "🎨 Seamless design",
                      desc: "Blends with any Shopify theme perfectly.",
                      img: "/theme.png",
                    },
                  ].map((f, i) => (
                    <Layout.Section oneThird key={i}>
                      <div>
                        <Card
                          padding="500"
                          background="bg-surface"
                          shadow="card"
                          style={{
                            height: "340px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            textAlign: "center",
                          }}
                        >
                          <div>
                            <Text
                              variant="headingMd"
                              as="h3"
                              style={{
                                color: "#2C1A4C",
                                fontWeight: 800,
                                marginBottom: "10px",
                              }}
                            >
                              {f.title}
                            </Text>
                            <Text
                              alignment="center"
                              tone="subdued"
                              style={{
                                fontSize: "2rem",
                                lineHeight: "1.5",
                                marginBottom: "16px",
                              }}
                            >
                              {f.desc}
                            </Text>
                          </div>

                          <div
                            style={{
                              width: "100%",
                              height: "320px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
                            }}
                          >
                            <img
                              src={f.img}
                              alt={f.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                marginTop: "20px",
                                objectFit: "contain",
                                transition: "transform 0.4s ease",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.transform = "scale(1.05)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                              }
                            />
                          </div>
                        </Card>
                      </div>
                    </Layout.Section>
                  ))}
                </Layout>
              </>
            ),
          },

          {
            title: "Why Your Store Needs WishList Hub",
            content: (
              <>
                <Text
                  as="p"
                  variant="bodySm"
                  alignment="center"
                  tone="subdued"
                  maxWidth="700px"
                  style={{
                    margin: "0 auto 20px",
                    lineHeight: "1.7",
                  }}
                >
                  Without a wishlist, shoppers forget items they love or lose interest.
                  WishList Hub keeps them engaged and brings them back to buy.
                </Text>

                <InlineStack gap="400" align="center">
                  {[
                    {
                      title: "Boosts Engagement",
                      desc: (
                        <>
                          Keeps customers connected to products they love.{" "}
                          <span style={{ fontSize: "1.5em" }}>🔥</span>
                        </>
                      ),
                    },
                    {
                      title: "Increases Conversions",
                      desc: (
                        <>
                          Turns interest into sales by bringing shoppers back to purchase.{" "}
                          <span style={{ fontSize: "1.5em" }}>🚀</span>
                        </>
                      ),
                    },
                  ].map((item, idx) => (
                    <Card
                      key={idx}
                      padding="600"
                      background="bg-surface"
                      shadow="card"
                      style={{
                        flex: 1,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        border: "1px solid #e1e5e9",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px)";
                        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 25px rgba(0,0,0,0.06)";
                      }}
                    >
                      <BlockStack gap="300" align="center">
                        <Text
                          style={{
                            fontSize: "3rem",
                            lineHeight: 1,
                          }}
                        >
                          {item.icon}
                        </Text>
                        <Text
                          variant="headingLg"
                          as="h3"
                          alignment="center"
                          style={{
                            color: "#2C1A4C",
                            fontWeight: 700,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          alignment="center"
                          style={{
                            color: "#666",
                            fontSize: "1rem",
                            lineHeight: "1.6",
                          }}
                        >
                          {item.desc}
                        </Text>
                      </BlockStack>
                    </Card>
                  ))}
                </InlineStack>
              </>
            ),
          },

          {
            title: "Ready to see WishList Hub in action?",
            content: (
              <>
                <Text
                  as="p"
                  variant="bodySm"
                  tone="subdued"
                  alignment="center"
                  maxWidth="700px"
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  Activate WishList Hub now to add a powerful wishlist system across your
                  store in seconds. No code. No complexity. Just magic.<span style={{ fontSize: "1.5em" }}>✨</span>
                </Text>

                <InlineStack gap="400" align="center">
                  <Button
                    size="large"
                    variant="primary"
                    onClick={() => window.open(themeEditorUrl, "_blank")}
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      padding: "16px 32px",
                      boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
                    }}
                  >
                  <span style={{ fontSize: "1.5em" }}>🚀  </span>
                     Enable Wishlist Now
                  </Button>
                </InlineStack>
              </>
            ),
          },
        ].map((section, i) => (
          <div
            key={i}
            style={{
              marginBlockStart: i === 0 ? "40px" : "50px",
            }}
          >
            <Card
              sectioned={false}
              style={{
                borderRadius: "18px",
                boxShadow: "0 6px 25px rgba(0,0,0,0.06)",
                background: "white",
              }}
            >
              <div
                style={{
                  padding: "20px 10px",
                }}
              >
                <BlockStack gap="600" align="center">
                  <Text
                    as="h2"
                    variant="heading2xl"
                    alignment="center"
                    style={{
                      fontSize: "2rem",
                      color: "#2C1A4C",
                      fontWeight: 700,
                      marginTop: "40px",
                      marginBottom: "40px",
                    }}
                  >
                    {section.title}
                  </Text>
                  {section.content}
                </BlockStack>
              </div>
            </Card>
          </div>
        ))}
      </BlockStack>
    </Page>
  );
}
