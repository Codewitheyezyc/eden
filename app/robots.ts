import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://eden-academy.org";
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/onboarding/", "/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
