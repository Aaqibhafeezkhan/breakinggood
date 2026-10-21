import assert from "node:assert/strict";
import test from "node:test";
import { CHALLENGE_MARKERS, isChallengePage } from "./capture.js";

test("returns the matched challenge marker from the page title", () => {
  for (const marker of CHALLENGE_MARKERS) {
    assert.equal(isChallengePage(marker, "Ordinary body content"), marker);
  }
});

test("detects challenge markers in short body text case-insensitively", () => {
  assert.equal(isChallengePage("Example site", "Please VERIFY YOU ARE HUMAN to continue."), "Verify you are human");
  assert.equal(isChallengePage("Example site", "Enable JavaScript and cookies to proceed."), "Enable JavaScript and cookies");
});

test("does not flag a long ordinary page that mentions challenge phrases", () => {
  const body = `A long article about web security. ${"Access denied and Just a moment are phrases sometimes discussed in documentation. ".repeat(30)}`;
  assert.ok(body.length >= 1500);
  assert.equal(isChallengePage("Example site", body), undefined);
});

test("detects Cloudflare challenge markup", () => {
  assert.equal(isChallengePage("Example site", "Ordinary page", '<form id="challenge-form"></form>'), "Cloudflare challenge markup");
  assert.equal(isChallengePage("Example site", "Ordinary page", '<div class="cf-chl-widget"></div>'), "Cloudflare challenge markup");
});

test("detects 403 and 503 navigation responses", () => {
  assert.equal(isChallengePage("Example site", "Ordinary page", "", 403), "HTTP 403 response");
  assert.equal(isChallengePage("Example site", "Ordinary page", "", 503), "HTTP 503 response");
});

test("does not flag ordinary pages", () => {
  assert.equal(isChallengePage("Example site", "Welcome to our website."), undefined);
  assert.equal(isChallengePage("", ""), undefined);
});
