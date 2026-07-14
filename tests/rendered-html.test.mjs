import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const retiredBrandPattern = new RegExp("safe" + "trade", "i");

async function readProjectFile(filePath) {
  return readFile(new URL(filePath, root), "utf8");
}

async function listFiles(dir, found = []) {
  const entries = await readdir(new URL(dir, root), { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.posix.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (["dist", "node_modules", ".git", ".next"].includes(entry.name)) {
          return;
        }

        await listFiles(entryPath, found);
        return;
      }

      found.push(entryPath);
    }),
  );

  return found;
}

test("uses Esxcrowise branding across the public app", async () => {
  const [layout, home, policies, onboarding, packageJson] = await Promise.all([
    readProjectFile("app/layout.tsx"),
    readProjectFile("app/page.tsx"),
    readProjectFile("app/policies/page.tsx"),
    readProjectFile("app/seller-onboarding/page.tsx"),
    readProjectFile("package.json"),
  ]);

  assert.match(layout, /title:\s*"Esxcrowise MVP"/);
  assert.match(home, /Esxcrowise/);
  assert.match(policies, /Esxcrowise/);
  assert.match(onboarding, /Esxcrowise/);
  assert.match(packageJson, /"name":\s*"esxcrowise-mvp"/);
});

test("keeps commission and settlement backend routes in place", async () => {
  const [schema, store, dashboard, settingsRoute, paymentRoute, adminAuth] = await Promise.all([
    readProjectFile("db/schema.ts"),
    readProjectFile("app/api/_store.ts"),
    readProjectFile("app/api/dashboard/route.ts"),
    readProjectFile("app/api/admin/settings/route.ts"),
    readProjectFile("app/api/payments/initialize/route.ts"),
    readProjectFile("app/api/_adminAuth.ts"),
  ]);

  assert.match(schema, /platform_settings/);
  assert.match(schema, /settlement_entries/);
  assert.match(schema, /fee_percent/);
  assert.match(store, /earnedCommissionKobo/);
  assert.match(store, /pendingCommissionKobo/);
  assert.match(dashboard, /getDashboard/);
  assert.match(dashboard, /requireAdminAccess/);
  assert.match(settingsRoute, /updatePlatformSettings/);
  assert.match(paymentRoute, /initializePayment/);
  assert.match(adminAuth, /ADMIN_ACCESS_KEY/);
  assert.match(adminAuth, /x-admin-key/);
});

test("does not ship the old project name in source files", async () => {
  const files = await listFiles(".");
  const textFiles = files.filter((file) =>
    /\.(css|html|js|json|md|mjs|sql|svg|ts|tsx|yaml|yml)$/.test(file),
  );

  const matches = [];
  await Promise.all(
    textFiles.map(async (file) => {
      const contents = await readProjectFile(file);

      if (retiredBrandPattern.test(contents) || retiredBrandPattern.test(file)) {
        matches.push(file);
      }
    }),
  );

  assert.deepEqual(matches.sort(), []);
});
