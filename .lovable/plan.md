

## Plan: Add Monetag Integration

### What
Add the Monetag verification meta tag to `index.html` so Monetag can verify your site ownership and serve ads.

### Changes

**File: `index.html`**
- Add `<meta name="monetag" content="59982f1c7a3f24e72a5cfd4e7c058ced">` to the `<head>` section.
- Optionally remove the Google AdSense script if you're fully switching to Monetag.

