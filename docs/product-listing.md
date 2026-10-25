# Product listing price and quantity — 25 October 2026

Current listing metadata is independent of orders, fees, cost versions and the domain engine. It is not a stock movement system or a statement of net profit.

- POST /stores/{store}/products still accepts sku, name, unit. Optional sellingPriceSatang (integer 0–1e12) and quantity (integer 0–1e6) are now persisted. Zero is known; omitted fields remain unknown. The server assigns listingVersion=1 and tenant provenance.
- GET /stores/{store}/products returns the stored fields and effective cost; the browser never manufactures a selling price, stock count or profit from a fixture/order.
- POST /stores/{store}/products/{sku}/listing accepts either/both optional fields plus required expectedListingVersion. Legacy products without this version use 0. A successful update increments the version, records the server-derived editor/time and uses a conditional row write. Stale/concurrent saves fail PRODUCT_CHANGED_REFRESH (409). Refresh and review before retrying.
- Every route requires membership; VIEWER cannot write. Normal JWT and origin-bound MOCK guest routes retain their existing checks. No merchant-selected ownership/provenance/profit fields are accepted.
- Manual add sends price/quantity at product creation. A separate cost failure retains the confirmed product; retry saves only missing cost unless the user changes listing fields.
- Product-page CSV import saves entered price/quantity, including zero; duplicate-update updates supplied listing fields and adds a cost version when supplied. Blank quantity remains unknown for new items and preserves existing stock on update. Checkpoints include price and quantity and preserve successful writes across a cost retry.
- Existing canonical background ledger import schemas are unchanged. Listing quantities do not automatically decrement with orders. Historical revenue, cost, settlement and profit remain unchanged.
- Existing products whose old form discarded price/quantity have no recoverable stored values. Open product details → แก้ไขราคาขายและจำนวน to re-enter them. No price inference, bulk REAL-store migration or MOCK reseeding is performed.

Local verification: Frontend 56 tests and static export/package; Backend 67 tests, bundled handlers, unchanged generated financial contract and infrastructure checks; Python operator 6 tests. Browser MOCK flow created 249.99 THB / 42 units, refreshed successfully, and saved zero price/quantity. Deployment verification is recorded separately in docs/verification.md.

