import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { scanRepo } from "./scan.js";

async function scanFixture(name: string) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ time: { created: "2020-01-01T00:00:00.000Z" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  try {
    return await scanRepo(path.resolve("src/repo/fixtures", name));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("flags dependencies with unrecognized install scripts as medium severity", async () => {
  const report = await scanFixture("install-script");
  const finding = report.findings.find((f) => f.title.includes("run code at install time"));
  assert.ok(finding);
  assert.equal(finding.severity, "medium");
  assert.match(finding.detail, /fixture-package@1\.0\.0/);
});

test("flags dependencies resolved from non-registry URLs as medium severity", async () => {
  const report = await scanFixture("foreign-url");
  const finding = report.findings.find((f) => f.title.includes("resolve outside the public npm registry"));
  assert.ok(finding);
  assert.equal(finding.severity, "medium");
  assert.match(finding.detail, /https:\/\/example\.com\/foreign-package\.tgz/);
});

test("flags curl-to-shell lifecycle scripts as high severity", async () => {
  const report = await scanFixture("curl-bash");
  const finding = report.findings.find((f) => f.title.includes('"postinstall"'));
  assert.ok(finding);
  assert.equal(finding.severity, "high");
  assert.match(finding.detail, /curl.*\|\s*sh/);
});

test("flags setup.py that invokes os.system as high severity", async () => {
  const report = await scanFixture("os-system");
  const finding = report.findings.find((f) => f.title.includes("setup.py executes code"));
  assert.ok(finding);
  assert.equal(finding.severity, "high");
});

test("returns no findings for a clean fixture", async () => {
  const report = await scanFixture("clean");
  assert.deepEqual(report.findings, []);
});
