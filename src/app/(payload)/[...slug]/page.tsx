/***
 * ! CMS - Include both Payload CMS and Builder.io CMS and configured to work together
 * ? Payload CMS
 * ? Builder.io
 */

import { RenderBuilderContent } from "@/app/(app)/(integrations)/builder.io/[...slug]/builder-io";
import { env } from "@/env";
import { getPayloadClient } from "@/lib/payload/payload";
import type { Media } from "@/payload-types";
import type { PageBlock } from "@/types/blocks";
import { builder } from "@builder.io/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "../payload-blocks";

import { AppLayout } from "@/components/layouts/app-layout";
import "@/styles/builder-io.css";

interface PageProps {
	params: Promise<{
		slug: string[];
	}>;
	searchParams: Promise<{
		preview?: string;
	}>;
}

interface ProcessedParams {
	params: { slug: string[] };
	searchParams: { preview?: string };
	slugString: string;
}

// Helper function to check if CMS features are enabled
function checkCMSFeatures() {
	if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED && !env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED) {
		notFound();
	}
}

// Helper function to process params and searchParams
async function processParams(paramsPromise: Promise<{ slug: string[] }>, searchParamsPromise: Promise<{ preview?: string }>): Promise<ProcessedParams> {
	const params = await paramsPromise;
	const searchParams = await searchParamsPromise;
	const slugString = params.slug.join("/");

	return { params, searchParams, slugString };
}

function initializeBuilderIfNeeded() {
	if (env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED && env.NEXT_PUBLIC_BUILDER_API_KEY && builder && !builder.apiKey) {
		try {
			builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY);
		} catch (error) {
			console.warn("Failed to initialize Builder.io:", error);
		}
	}
}

// Helper function to query Payload CMS
async function queryPayloadPage(slugString: string, slug: string[], depth = 0) {
	if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) return null;

	const payload = await getPayloadClient();
	if (!payload) return null;

	try {
		// First try with the joined slug
		let pageQuery = await payload.find({
			collection: "pages",
			where: {
				slug: {
					equals: slugString,
				},
			},
			depth,
		});

		// If no results, try with just the first segment of the slug
		if (pageQuery?.docs?.length === 0 && slug.length > 0) {
			pageQuery = await payload.find({
				collection: "pages",
				where: {
					slug: {
						equals: slug[0],
					},
				},
				depth,
			});
		}

		// Try a more flexible query if still not found
		if (pageQuery?.docs?.length === 0) {
			pageQuery = await payload.find({
				collection: "pages",
				where: {
					slug: {
						like: slug[0],
					},
				},
				depth,
			});
		}

		return pageQuery?.docs[0] || null;
	} catch (error) {
		console.warn("Error fetching page from Payload:", error);
		return null;
	}
}

// Helper function to query Builder.io
async function queryBuilderContent(slugString: string) {
	if (!env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED) return null;

	try {
		initializeBuilderIfNeeded();
		const builderContent = await builder
			.get("page", {
				userAttributes: {
					urlPath: `/${slugString}`,
				},
				prerender: false,
			})
			.toPromise();

		return builderContent;
	} catch (error) {
		// Silently handle errors
		return null;
	}
}

// Skip routes that should be handled by other Next.js mechanisms
const shouldSkip = (slugString: string) => {
	return (
		slugString.startsWith("api/") ||
		slugString.includes(".") || // Any file with extension
		// Next.js built-in routes
		slugString === "manifest.json" ||
		slugString === "sitemap.xml" ||
		slugString === "robots.txt" ||
		slugString === "favicon.ico" ||
		// Static assets
		slugString.startsWith("_next/") ||
		slugString.startsWith("static/") ||
		// Other common static files
		slugString.endsWith(".js") ||
		slugString.endsWith(".css") ||
		slugString.endsWith(".png") ||
		slugString.endsWith(".jpg") ||
		slugString.endsWith(".jpeg") ||
		slugString.endsWith(".gif") ||
		slugString.endsWith(".svg") ||
		slugString.endsWith(".ico") ||
		slugString.endsWith(".webp") ||
		slugString.endsWith(".woff") ||
		slugString.endsWith(".woff2") ||
		slugString.endsWith(".ttf") ||
		slugString.endsWith(".eot")
	);
};

export async function generateMetadata({ params: paramsPromise, searchParams: searchParamsPromise }: PageProps): Promise<Metadata> {
	checkCMSFeatures();

	const { params, slugString } = await processParams(paramsPromise, searchParamsPromise);

	if (shouldSkip(slugString)) {
		notFound();
	}

	// Try Payload CMS first (no depth needed for metadata)
	const payloadPage = await queryPayloadPage(slugString, params.slug);
	if (payloadPage) {
		const { meta } = payloadPage;
		const isMedia = (image: any): image is Media => {
			return image && typeof image === 'object' && 'url' in image;
		};

		return {
			title: meta?.title,
			description: meta?.description,
			openGraph: meta?.image && isMedia(meta.image) && meta.image.url
				? {
					images: [{
						url: meta.image.url,
						width: 1200,
						height: 630
					}],
				}
				: undefined,
		};
	}

	// Try Builder.io if no Payload page
	const builderContent = await queryBuilderContent(slugString);
	if (builderContent) {
		return {
			title: builderContent.data?.title || "Page",
			description: builderContent.data?.description || "",
		};
	}

	notFound();
}

export default async function Page({ params: paramsPromise, searchParams: searchParamsPromise }: PageProps) {
	checkCMSFeatures();

	const { params, searchParams, slugString } = await processParams(paramsPromise, searchParamsPromise);

	if (shouldSkip(slugString)) {
		notFound();
	}

	// Try Payload CMS first (with depth for full content)
	const payloadPage = await queryPayloadPage(slugString, params.slug, 2);
	if (payloadPage) {
		return (
			<AppLayout>
				<BlockRenderer blocks={(payloadPage?.layout as PageBlock[]) ?? []} />
			</AppLayout>
		);
	}

	// Try Builder.io if no Payload page
	const builderContent = await queryBuilderContent(slugString);
	if (builderContent) {
		return (
			<>
				<RenderBuilderContent content={builderContent} model="page" />
			</>
		);
	}

	// If no content found in either CMS, return 404
	notFound();
}
