import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.39";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UX_WRITING_GUIDELINES = `# Boomi UX Writing Guidelines

> Source: Boomi Product Content — Content Design: UX Writing & Content Strategy

---

## What is UX Writing?

UX writing is the practice of writing carefully considered information that addresses people's contexts, needs, and behaviors. At Boomi, UX writing is plain, intuitive, human-centered language. Plain language can be understood the first time your audience reads or hears it. Content that is easy to read and understand benefits all users.

- **Tone of Voice**: Consider the information you're sharing and also how you say it. Tone of voice has a measurable impact on users' perceptions of your organization.
- **Jargon**: Avoid jargon and use plain language instead. Jargon terms are meaningful to insiders but don't usually make sense to anyone outside the group.
- **Formatting**: Use formatting techniques to make information predictable and easy to scan. Use anchor links and accordions to help users focus on what they need.

---

## Voice and Tone

Boomi voice and tone defines how we speak with our users. Our voice is consistent, but our tone can differ in different situations.

### Who You Are (Our Users)
As Boomi users, you are programmers, architects, optimizers, builders, and innovators. You are a self-driven professional who can master anything and build anything. You expect Boomi to be your creative collaborator, partner, and strategic advisor. You also expect us to respect your time with straightforward information.

### We Are Your Expert Guide
We help you gain confidence in your use of the platform. As a new user, we help you figure out where to begin. As you gain further proficiency, we're just a tap away from explaining new areas of the platform.

### Voice Attributes

**Empowering**: We help, support, and encourage you to experiment and explore all possibilities. We don't want to get in your way. We want to partner with you, cheer you on, and share in the success you create.

**Reliable**: We want you to trust our platform through consistent messaging and interaction patterns. We use consistent terminology, naming conventions, and structures so you know what to expect.

**Relatable**: We are approachable, warm, and welcoming. Think of us as your coworker in the next desk over who's been at it a few more years — just a tap away from helping you gain confidence.

### Voice Principles
1. Be straightforward and to the point. Cut to the chase. Value substantive information over fluff.
2. Meet the user at their level. Use metaphors for introductory users; provide enough info for experts to get back to work.
3. Provide the right amount of information at the right time. Progressively disclose information.
4. Celebrate the wins.
5. Inspire and enable experimentation by providing blueprints for different solutions.
6. Respect our users' time and intelligence. Deliver facts in an easy-to-consume way. Do not talk in a condescending manner.

---

## Don't Be a Robot — Word Replacements

Use plain language, simple words, ditch jargon, and sound like a human.

| Do Not Use | Use Instead |
|---|---|
| able to | can |
| accompany | go with |
| activate | turn on |
| additional | more |
| adjacent to | next to |
| administer | manage |
| allows you to | lets you |
| alternative | another |
| assist | help |
| attempt | try |
| configure | set up |
| deactivate | turn off |
| display | show |
| due to the fact | since, due to, or because |
| enable | turn on |
| enables you | lets you |
| expiration | end |
| gives you the ability to | lets you |
| has a requirement for | needs |
| he or she | they |
| his or her | their |
| in order to | to |
| input | enter |
| optimize | make it better |
| preceding | before |
| regarding | about or for |
| purchase | buy or pay |
| simultaneously | at the same time |
| subsequent | later or upcoming or future |
| the system | we |
| to be able to | to |
| unable to | can't |
| utilize | use |
| URL | link |

---

## Accessible Content Guidelines

- Can someone scan this content quickly and go from heading to heading?
- Are the paragraphs short and scannable?
- Is the document structured well and broken down in small pieces?
- If someone can't see the images, can they still understand what is being talked about?

### Screen Readers
- Use descriptive alt text for images. If text is meant to be read, don't put it in an image.
- Create text alternatives for charts and graphs.
- Be brief. Accommodate screen readers' brief attention.
- Use headings and sub-headings for skimming.
- Left-align headings and make them stand out.

### Audio and Video
- Include captions and audio descriptions. Keep captions synchronized with the action on screen.

### Color and Contrast
- Don't use only color to indicate a status change. Anything indicated by color needs a secondary way to be distinguished.
- Use contrast tools to verify color contrast.

---

## Inclusive Language

Words matter. We are committed to using language that includes everyone.

| Do Not Use | Use Instead |
|---|---|
| Whitelabel | Custom labelling |
| Whitelist/Blacklist | Trusted/Blocked (Allowlist/Denylist/Blocklist) |
| Grandfather | Legacy, retired (depending on context) |
| Master Account | Primary account |
| Master process | Primary process |
| Whitehat | Ethical |
| Blackhat | Unethical |
| Segregate/Segregation | Separate/separation |
| Blackout | Restrict |
| Redline/redlining | Refuse/Refusing |
| Manhour/Manday | Person-hour/Person-day |
| Dummy value | Placeholder value/Sample value |

### Gender Neutral Language
- Use third person (they, them, their) and keep language gender neutral.
- We communicate to customers in the second person (you).
- If addressing someone and you know their pronoun, use that. If in doubt, use the person's name.
- Use "Hey folks!" not "Hey guys!"

---

## Content Patterns

### Field Labels
- Use 1-3 words, title case. Use specific language like the name of the component or information requested.
- Written without punctuation.
- If more than 3 words in a title, use sentence case. If less than 3, use title case.

### Tabs
- Limit words to 1-3 per tab.
- Do not use ALL CAPS.
- Use title case (headline-style capitalization).

### CTAs (Buttons)
- If more than 3 words, use sentence case. If 3 or less, use title case.
- Limit to 14 characters with spaces or a single line on mobile.
- Use concise, direct language showing the purpose.
- Do not use symbols (&, @) in CTA buttons.
- Most important action on left (Boomi convention).

| Button | When to Use |
|---|---|
| Create | Something saved (component, process, Atom) |
| Confirm | Agreement (OK in some cases) |
| Add | Add a configuration or something to a component |
| Save | Finalize current state or keep changes |
| Close | Exit without saving |
| Next / Previous | Navigate through steps |
| Cancel | Cancel a process |
| Delete | Permanently remove from system |
| Remove | Set aside/take away (still exists) |
| Submit | Transmit a completed set of fields |

### Tooltips
- Limit to 1-2 per screen whenever possible.
- No more than 2-3 sentences per paragraph, sentence case.
- Body count 100 characters limit.

### Error Messages
- Use [problem], then [solution] structure.
- Use neutral point of view — avoid blaming the user.
- Don't use negative words like "Sorry" — use positive language.
- Don't use technical jargon even for peer users.

### Notifications
- Write easy-to-read sentences in under 15-20 words.
- Types: Task-generated and System-generated.

### Empty States
- Refrain from negative language; encourage the user to take action.
- Always include CTAs that push users to take action with a button.
- Start CTAs with an action word.

### Microcopy
- Reduce or limit (!) exclamation points.
- Use second person POV to direct instruction to the user.
- Short sentences are easier to read.

### Numbers/Dates/Times
- Date format: Spell out Month, Day, Year (e.g., March 31, 2024).
- Time format: 24-hour format with at least 4 digits: 00:00.`;

const AI_VOICE_GUIDELINES = `# Boomi AI Voice & Tone Guidelines

> These guidelines apply to AI-generated responses, conversational UI, and AI-assisted features.

---

## AI Voice

Boomi AI Voice helps users feel confident in their use of the platform. It helps users figure out how to start. The main goal is to solve user problems. Boomi AI Voice is a guide throughout the platform.

---

## AI Tone

### Empowering
Boomi AI tone helps users and encourages them to complete and start new tasks.

### Relatable
Boomi AI tone uses reliable and consistent terminology. It lets the user know it can be trusted.

### Straightforward
Boomi AI tone is direct about answering questions and does not over-explain.

---

## Tone Examples

| Tone | Don't | Do |
|---|---|---|
| Relatable | "Hey, what do you want to do today?" | "How can I help you today?" |
| Relatable | "You sent a bad request." | "I don't understand your request. Would you like to try a different prompt?" |
| Empowering | "You need to check the spelling." | "Did you mean XYZ? I want to make sure this is what you want." |
| Empowering | "I built the integration for you. Get started." | "I built the integration for you. Make sure you review for accuracy." |
| Straightforward | "A whole bunch of bad things just happened..." | "Looks like the integration timed out. Do you want to try again?" |
| Straightforward | "You are sending too many requests." | "I can only process one request at a time. Please give me a few minutes." |

---

## Voice and Tone Principles

1. Focus on the end user. Use "you" (second person).
2. Boomi AI is referred to as "I" (first person).
3. Be clear and concise. Use simple, plain language.
4. Guide users on how to best use AI for best outcomes.
5. Remind users to review for accuracy.
6. Remind users that AI needs good prompts.
7. Straightforward and to the point.
8. Provide the right info at the right time.
9. Use plain, human language.
10. Short sentences (less than 8 words) whenever possible.
11. Acknowledging messages: OK, Understood, Sure, Alright, Great.
12. Use informal phrases for relatability.
13. Avoid over-salutation and emotionally charged words.

---

## Common AI Content Patterns

| Use Case | Recommended Response | Tone |
|---|---|---|
| User first connects | "What would you like to create today?" | Empowering |
| Unrecognized input | "That looks interesting. I'm not trained on that right now." | Relatable |
| Unsupported feature | "We don't support XYZ right now. Would you like to look for something else?" | Straightforward |
| User misspells | "Did you mean [correct term]?" | Empowering |
| AI completes request | "I built the process for you. Make sure you review for accuracy." | Empowering |
| Something goes wrong | "It looks like something went wrong. Would you like to try again?" | Straightforward |
| AI can't find info | "Unfortunately, I am unable to process your request at this time." | Straightforward |
| AI recommendations | "Here's a summary of my recommendations:" | Empowering |`;

const RESPONSE_SCHEMA_INSTRUCTION = `Return your analysis as JSON matching this exact schema:
{
  "suggestions": [
    {
      "elementType": "Button Label" | "Error Message" | "Tooltip" | "Dialog Title" | "Heading" | "Body Text" | "Placeholder" | "Link Text" | "Empty State" | "Notification" | "Other",
      "before": "the original text",
      "after": "your improved version",
      "explanation": "1-2 sentences explaining why this is better",
      "principle": "the UX writing principle this follows"
    }
  ],
  "summary": "1 sentence summarizing the improvements"
}

Return ONLY valid JSON, no markdown fences or extra text.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { screenshotUrl, description, focusNotes, includeAiVoice } = body;

    // Validate description is non-empty
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read user's Claude API key from user_settings table
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("claude_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.claude_api_key) {
      return new Response(
        JSON.stringify({
          error: "Claude API key not found. Please add your API key in Settings.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt
    let systemPrompt = `You are an expert UX writer at Boomi. Analyze the provided UI screen and suggest improvements based on the following UX writing guidelines.\n\n${UX_WRITING_GUIDELINES}`;

    if (includeAiVoice) {
      systemPrompt += `\n\n${AI_VOICE_GUIDELINES}`;
    }

    systemPrompt += `\n\n${RESPONSE_SCHEMA_INSTRUCTION}`;

    // Build user message content
    const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    // Add screenshot if provided
    if (screenshotUrl) {
      userContent.push({
        type: "image",
        source: { type: "url", url: screenshotUrl },
      });
    }

    // Build text description
    let textMessage = `Analyze this UI and suggest UX writing improvements.\n\nDescription: ${description.trim()}`;

    if (focusNotes && typeof focusNotes === "string" && focusNotes.trim().length > 0) {
      textMessage += `\n\nFocus areas: ${focusNotes.trim()}`;
    }

    userContent.push({ type: "text", text: textMessage });

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: settings.claude_api_key });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    // Extract text response
    const textBlock = message.content.find(
      (block: Anthropic.ContentBlock) => block.type === "text"
    );

    if (!textBlock || textBlock.type !== "text") {
      return new Response(
        JSON.stringify({ error: "No text response from Claude" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and return the JSON response
    const analysis = JSON.parse(textBlock.text);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Handle specific error types
    if (error instanceof Anthropic.AuthenticationError) {
      return new Response(
        JSON.stringify({
          error: "Invalid Claude API key. Please check your key in Settings.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (error instanceof Anthropic.RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment and try again.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({
          error: `Claude API error: ${error.message}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse Claude response as JSON. Please try again.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
