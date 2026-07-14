# Esxcrowise Launch Status

Last updated: 2026-07-14

## Ready

- Public domain: `https://esxcrowise.com`
- `www` domain: `https://www.esxcrowise.com`
- Domain status: active
- SSL status: active
- Site access: public
- Production base URL: `https://esxcrowise.com`
- Production admin key: configured as a secret environment variable
- Current local build: passing
- Current tests: passing
- Retired branding: removed from source and local demo artifacts

## Current Deploy Blocker

The latest Esxcrowise source is committed locally, but the Sites source push is blocked because this environment cannot resolve the hosting Git endpoint:

```text
git.chatgpt-team.site
```

The production archive has been prepared locally at:

```text
/private/tmp/esxcrowise-sites-build.tar.gz
```

The archive contains the built server, client assets, `.openai/hosting.json`, and D1 migrations.

GitHub repository created:

```text
https://github.com/beinspiredfh/esxcrowise
```

GitHub deploy key added with read/write access, but SSH pushes from this environment are blocked by network restrictions. HTTPS push also needs a GitHub credential. A fine-grained token attempt was configured for repository contents write only, but GitHub rejected token creation from the current browser session with:

```text
You can't perform that action at this time.
```

## Next Publish Step

Preferred route for Vercel:

1. Complete GitHub token creation in the signed-in browser session, or connect Vercel directly to `beinspiredfh/esxcrowise`.
2. Push or import the current local source into the GitHub repository.
3. Import the repository into Vercel.
4. Set production environment variables in Vercel.
5. Point `esxcrowise.com` and `www.esxcrowise.com` to the Vercel deployment.

Alternative route for Sites when the hosting Git endpoint resolves from this environment:

1. Push the current `main` branch to the Sites source repository.
2. Save a new Sites version from the pushed commit and prepared archive.
3. Deploy the saved version to production.
4. Confirm `https://esxcrowise.com` shows the Esxcrowise build.

## External Go-Live Items

- Add Paystack live secret when the Paystack account is approved.
- Add WhatsApp Business credentials when the WhatsApp setup is approved.
- Run pilot transactions with selected sellers before public marketing.
- Keep settlement, dispute, refund, prohibited goods, and seller verification policies reviewed before full rollout.
