// Run with: deno test supabase/functions/prompt-generator-execute/payload.test.ts
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { buildUserMessage, type PromptRow } from "./payload.ts";

const prompt: PromptRow = {
  id: "p-123",
  name: "Inventory dashboard",
  user_id: "u-1",
};

Deno.test("buildUserMessage: includes project header with name and id", () => {
  const out = buildUserMessage(prompt, {}, null);
  assertStringIncludes(out, "# Project");
  assertStringIncludes(out, "Inventory dashboard (id: p-123)");
});

Deno.test("buildUserMessage: always ends with the Instructions block", () => {
  const out = buildUserMessage(prompt, {}, null);
  assertStringIncludes(out, "# Instructions");
  assertStringIncludes(out, "three-phase progression");
});

Deno.test("buildUserMessage: skips null, undefined, and empty-string fields", () => {
  const out = buildUserMessage(
    prompt,
    {
      kept: "real value",
      nullField: null,
      undef: undefined,
      empty: "",
      whitespace: "   ",
    },
    null,
  );
  assertStringIncludes(out, "# kept");
  assertStringIncludes(out, "real value");
  const forbidden = ["# nullField", "# undef", "# empty", "# whitespace"];
  for (const section of forbidden) {
    assertEquals(
      out.includes(section),
      false,
      `Expected ${section} to be omitted`,
    );
  }
});

Deno.test("buildUserMessage: serializes objects as pretty JSON", () => {
  const out = buildUserMessage(
    prompt,
    { designSystem: { storybook: "https://example.com", npm: "@acme/ui" } },
    null,
  );
  assertStringIncludes(out, "# designSystem");
  assertStringIncludes(out, `"storybook": "https://example.com"`);
  assertStringIncludes(out, `"npm": "@acme/ui"`);
});

Deno.test("buildUserMessage: appends context section when non-empty", () => {
  const out = buildUserMessage(
    prompt,
    { feature: "onboarding" },
    { skills: ["frontend-design"], memories: ["built-in-company-context"] },
  );
  assertStringIncludes(out, "# Selected memories & skills");
  assertStringIncludes(out, "frontend-design");
  assertStringIncludes(out, "built-in-company-context");
});

Deno.test("buildUserMessage: omits context section when empty object", () => {
  const out = buildUserMessage(prompt, { feature: "onboarding" }, {});
  assertEquals(out.includes("# Selected memories & skills"), false);
});

Deno.test("buildUserMessage: omits context section when null", () => {
  const out = buildUserMessage(prompt, { feature: "onboarding" }, null);
  assertEquals(out.includes("# Selected memories & skills"), false);
});

Deno.test("buildUserMessage: preserves section order from wizard snapshot", () => {
  const out = buildUserMessage(
    prompt,
    {
      "Company & Product": "Boomi / Rivery",
      "Feature Definition": "New onboarding",
      "Feature Information": "None — greenfield",
    },
    null,
  );

  const companyIdx = out.indexOf("# Company & Product");
  const featureDefIdx = out.indexOf("# Feature Definition");
  const featureInfoIdx = out.indexOf("# Feature Information");

  assertEquals(companyIdx < featureDefIdx, true);
  assertEquals(featureDefIdx < featureInfoIdx, true);
});

Deno.test("buildUserMessage: handles numeric and boolean values without dropping them", () => {
  const out = buildUserMessage(
    prompt,
    { accessibilityLevel: "wcag-aa", browserCount: 3, includeAiVoice: true },
    null,
  );
  assertStringIncludes(out, "wcag-aa");
  assertStringIncludes(out, "3");
  assertStringIncludes(out, "true");
});
