# Rule-source registry

| Source | Status | Intended use |
|---|---|---|
| mock-v1 independently checked fixture | MOCK | 12/8/3% golden only; not official marketplace rates |
| user-uploaded supplier bill / manual input | MERCHANT_CONFIRMED | cost version after review; unit normalization recorded |
| imported posted fee lines | MOCK adapter currently | actual ledger amounts activate only after merchant completeness confirmation |
| reference/research Thai platform fee research | UNVERIFIED / conflicts retained | evidence candidates only; no automatic rate activation |

Production fee evidence needs URL/hash, market, seller tier/category, payment tenure, fetched/published/effective dates, sourceRef, VAT mode, base, min/max, scope, program eligibility, verification owner and conflictReason. Current API requires https sourceUrl and known VAT for VERIFIED_FOR_ESTIMATE; merchant attestation is not an automated verification of a platform website. UNVERIFIED/CONFLICTING/unknown VAT causes incomplete estimate; settled actual lines still usable.

Latest active rule version per logical id replaces old version; explicit replacesType supports installment replacing transaction fee. Scope/sku must be reviewed; do not silently map other platform schemas. Tax/WHT is outside item settlement reconciliation unless a verified adapter declares mapping.
