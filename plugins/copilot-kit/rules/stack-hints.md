# Stack hints (suggestions only; confirm with the developer, never guess)

Used by `setup-project` and `playwright-tester`. These are starting points, not verified for every project. If a hint does not match what you see in the repo, ask.

## Detection signals (read-only)
| Platform | Look for |
|---|---|
| Drupal | `composer.json` requiring `drupal/core*`, `web/core/`, `drush`, `.ddev/`, `.lando.yml` |
| Magento / Adobe Commerce | `bin/magento`, `app/etc/env.php`, `composer.json` requiring `magento/product-community-edition`, `warden` env |
| Shopify theme | `layout/theme.liquid`, `sections/`, `shopify.theme.toml`, `.shopifyignore`, Shopify CLI in `package.json` |
| BigCommerce (Stencil) | `config.stencil.json`, `.stencil`, `templates/`, `stencil-cli` in `package.json` |
| Static export of a theme | `site/` or `public/` HTML with `assets/`, no build tooling (serve with a static server) |

## Typical commands (propose, then confirm)
| Platform | Start | baseUrl | Validation candidates |
|---|---|---|---|
| Drupal | `ddev start` (or `lando start`) | `https://<project>.ddev.site` | `ddev exec vendor/bin/phpcs`, `phpstan`, `phpunit` |
| Magento | `warden env up` or the project's Docker compose | the local store URL | `vendor/bin/phpcs`, `phpstan`, `phpunit`; `bin/magento` commands run inside the container |
| Shopify theme | `shopify theme dev` | `http://127.0.0.1:9292` | `shopify theme check`, `npx eslint` if present |
| BigCommerce | `stencil start` | `http://localhost:3000` | `npm run lint`, `npm test` if present |
| Static export | `python3 -m http.server <port> -d <dir>` | `http://localhost:<port>` | none usually |

## e2e safety rules for storefronts
1. **Never run e2e against a production store.** Use local, staging or a development store. If `baseUrl` looks like the live domain, stop and ask.
2. Logins, storefront passwords and API tokens come from **environment variables** (for example `E2E_STOREFRONT_PASSWORD`, `E2E_USER`, `E2E_PASS`). Never type or store real credentials; never put them in `.copilot-kit.json` or specs.
3. Use synthetic products, customers and test payment modes only. No real orders, no real inventory changes.
4. Slow stacks (Magento, Drupal): wait for the site to answer (`e2e.readyTimeoutSec`, default 120) before testing; do not run specs against a half-started server.
5. Platform-native suites (Magento MFTF, Drupal Nightwatch/Behat) are not driven by this plugin. Mention them to the developer; do not replace them.
