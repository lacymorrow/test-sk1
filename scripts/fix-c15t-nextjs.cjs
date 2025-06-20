#!/usr/bin/env node

/**
 * Fix @c15t/nextjs compatibility with Next.js 15 ESM
 * This script patches the problematic import in the @c15t/nextjs package
 */

const fs = require('fs');
const path = require('path');

// Fix @c15t/nextjs next/headers import
const nextjsPackagePath = path.join(
  process.cwd(),
  'node_modules',
  '@c15t',
  'nextjs',
  'dist',
  'components',
  'consent-manager-provider',
  'index.js'
);

if (fs.existsSync(nextjsPackagePath)) {
  console.log('🔧 Fixing @c15t/nextjs Next.js 15 compatibility...');

  let content = fs.readFileSync(nextjsPackagePath, 'utf8');
  let wasFixed = false;

  // The issue is that we need to add .js extension to the import
  // Replace dynamic import without extension with one that has extension
  if (content.includes('await import("next/headers")')) {
    content = content.replace(
      'await import("next/headers")',
      'await import("next/headers.js")'
    );
    wasFixed = true;
  }

  // Handle require pattern
  if (content.includes('const t = require("next/headers")')) {
    // Replace the require with a proper dynamic import that has the .js extension
    content = content.replace(
      'const t = require("next/headers");',
      'const { headers } = await import("next/headers.js");'
    );

    // Update the usage of t.headers() to just headers()
    content = content.replace(
      '(0,t.headers)()',
      'headers()'
    );

    wasFixed = true;
  }

  // Handle original ES module import pattern if it exists
  const originalImport = 'import*as t from"next/headers"';
  if (content.includes(originalImport)) {
    content = content.replace(
      originalImport,
      'const { headers } = await import("next/headers.js");'
    );
    content = content.replace(
      '(0,t.headers)()',
      'headers()'
    );
    wasFixed = true;
  }

  // Alternative ES import patterns
  if (content.includes('import*as t from"next/headers"')) {
    content = content.replace(
      'import*as t from"next/headers"',
      'const { headers } = await import("next/headers.js");'
    );
    content = content.replace(
      '(0,t.headers)()',
      'headers()'
    );
    wasFixed = true;
  }

  if (wasFixed) {
    fs.writeFileSync(nextjsPackagePath, content, 'utf8');
    console.log('✅ Fixed @c15t/nextjs Next.js 15 compatibility');
  } else {
    console.log('ℹ️  @c15t/nextjs package already patched or different version');
    console.log('Current content preview:', content.substring(0, 300) + '...');
  }
} else {
  console.log('ℹ️  @c15t/nextjs package not found, skipping fix');
}

// Fix @c15t/react CSS import issues for all files
const cssImportFiles = [
  'components/consent-manager-dialog/consent-manager-dialog.module.js',
  'components/cookie-banner/cookie-banner.module.js',
  'components/shared/ui/accordion/accordion.module.js',
  'components/shared/ui/button/button.module.js',
  'components/shared/ui/switch/switch.module.js',
  'components/consent-manager-widget/consent-manager-widget.module.js'
];

console.log('🔧 Fixing @c15t/react CSS import compatibility...');
let cssFixCount = 0;

for (const filePath of cssImportFiles) {
  const fullPath = path.join(process.cwd(), 'node_modules', '@c15t', 'react', 'dist', filePath);

  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Use regex to find and replace any CSS import that isn't already commented
    const cssImportRegex = /(?<!\/\/ )import"[^"]*\.css";/g;
    const matches = content.match(cssImportRegex);

    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Replace CSS import with an empty object export to maintain default export structure
        const replacement = `const styles = {}; // ${match} // Commented out for Next.js 15 compatibility`;
        content = content.replace(match, replacement);
      }

      // Ensure there's a default export if one doesn't exist
      if (!content.includes('export default') && !content.includes('export{')) {
        content += '\nexport default styles;';
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      cssFixCount++;
      console.log(`  ✅ Fixed CSS imports in ${filePath}`);
    }
  }
}

if (cssFixCount > 0) {
  console.log(`✅ Fixed CSS imports in ${cssFixCount} @c15t/react files`);
} else {
  console.log('ℹ️  @c15t/react CSS imports already patched or different version');
}
