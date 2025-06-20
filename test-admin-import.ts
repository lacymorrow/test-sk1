/**
 * This script tests the admin import functionality within the Next.js environment
 * Run with: npx tsx --tsconfig next.config.ts test-admin-import.ts
 */

// Import the server action that's used in the admin panel
import { importPayments } from "./src/server/actions/payments";

async function testAdminImport() {
	console.log("🚀 Testing admin import functionality...");

	try {
		// Run the same import that the admin panel uses
		const result = await importPayments("all");

		console.log("✅ Import completed successfully");
		console.log("Import results:", JSON.stringify(result, null, 2));

	} catch (error) {
		console.error("❌ Import failed:", error);
	}
}

testAdminImport();
