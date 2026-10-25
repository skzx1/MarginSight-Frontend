# Merchant question bank

100 curated Thai merchant questions in fixtures/merchant-questions-v1.json; the Frontend ships the identical version as a searchable question picker. Questions are suggestions and an intent-regression benchmark, not model training or proof that missing merchant data exists. Selecting a question drafts it for review before sending. Financial answers still require deterministic recorded/catalog data; general answers have separate AI provenance. Required product/campaign selection and missing-data notices remain part of correct behavior.

Canonical fixture SHA-256: `2da873c30f3b1e1c00fc96a4fb1901092126bc4b4ac551e7084a3254c7bd09b6`. Update the Backend fixture then copy the identical reviewed JSON to Frontend web/src/lib/merchant-questions.json. Each repo builds independently; neither reads the sibling checkout at runtime or build time.

Ranking follows explicit ordinal positions among complete single-product recorded orders; equal profit uses stable SKU order. Out-of-range ranks return a notice. Follow-ups retain prior ranking direction/scope without growing the hidden request on each turn. Neither question suggestions nor intent examples calculate money or fine-tune the model.
