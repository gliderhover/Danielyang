# Ask Daniel — AI proxy setup

The homepage (`index.html`) works without this, in **offline mode**: it matches each
question to the closest section of `knowledge/profile.md`. To get real, styled AI
answers, deploy this small Cloudflare Worker. It holds your Anthropic API key so the
key never appears on the public site.

```
visitor's browser ──► Cloudflare Worker (holds API key) ──► Claude API
        ▲                    │ reads knowledge/profile.md from your site
        └── streamed answer ◄┘
```

## 1. Get an Anthropic API key
1. Sign in at https://console.anthropic.com and create an API key.
2. In the console's limits/billing settings, set a **monthly spend limit** (for example $10).
   This is your real safety net if someone spams the chat.

## 2. Deploy the Worker (no command line needed)
1. Create a free account at https://dash.cloudflare.com.
2. Go to **Workers & Pages → Create → Create Worker**, name it `ask-daniel`, and deploy the starter.
3. Click **Edit code**, replace everything with the contents of `worker/worker.js`, and click **Deploy**.
4. Open the Worker's **Settings → Variables and Secrets** and add:
   - `ANTHROPIC_API_KEY` — type **Secret** — your key from step 1.
   - Optional: `MODEL` (default `claude-haiku-5-5`, fast and cheap).
5. Copy the Worker URL, e.g. `https://ask-daniel.<your-subdomain>.workers.dev`.
   Opening it in a browser should show `{"ok":true,"service":"ask-daniel"}`.

Command-line alternative, from this folder:
```
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
```

## 3. Connect the site
Put the Worker URL in `chat/config.js`:
```js
window.ASK_DANIEL_CONFIG = { endpoint: "https://ask-daniel.<your-subdomain>.workers.dev" };
```
Commit and push. The homepage now answers with AI.

## Editing what the bot knows
Everything the bot can say comes from `knowledge/profile.md`. Edit that file and push;
the Worker picks up changes within about five minutes. No redeploy needed.

## Settings and safeguards
| Setting | Where | Default |
|---|---|---|
| Allowed sites | `ALLOWED_ORIGINS` variable | `https://gliderhover.github.io` (localhost is always allowed for testing) |
| Knowledge file | `KNOWLEDGE_URL` variable | the `profile.md` on your GitHub Pages site |
| Answer length | `LIMITS.maxTokens` in `worker.js` | 700 tokens (answers are meant to be spoken) |
| Question length | `LIMITS.maxUserChars` | 600 characters |
| Conversation memory | `LIMITS.maxTurns` | last 16 messages |

Optional per-visitor rate limit: in the Worker's **Settings → Bindings**, add a
**Rate limiting** binding named `LIMITER` (for example 20 requests per 60 seconds).
The code uses it automatically when it exists.

Answer styles (Disciplined, Humorous, Passionate, Casual) are defined in `STYLES`
inside `worker.js`; edit the wording there to tune each voice.
