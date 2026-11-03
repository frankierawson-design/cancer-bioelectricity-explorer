# Cancer Bioelectricity Explorer

An exploratory research preview for cancer bioelectricity literature and a passive trans-plasma-membrane electron transfer (TPMET) circuit model.

- GitHub Pages website: https://frankierawson-design.github.io/cancer-bioelectricity-explorer
- Separately hosted research preview: https://cancer-bioelectric-response.frankie-rawson.chatgpt.site/
- Synchronisation status (3 November 2026): the separately hosted preview may contain newer literature-search and TPMET functionality. Source-level equivalence has not been verified; GitHub Pages should not be described as a fully synchronised copy until the current source and assets are imported and tests rerun.
- Reviewer walkthrough: https://frankierawson-design.github.io/cancer-bioelectricity-explorer/review
- Model: `passive-tpmet-circuit-1.0`

## Scientific status

Default parameters are illustrative and have not been calibrated against matched cancer-cell experiments. Cancer growth, death and treatment-response hypotheses are unvalidated. The literature collection contains search candidates awaiting relevance screening; it is not exhaustive or a systematic review. The model does not provide clinical guidance.

## Contents

`dist/` contains the static website, model documentation, search log, literature metadata and retrieval scripts. `tests/` contains numerical implementation checks. `launch/` contains release and outreach documentation.

## Free website hosting

GitHub Pages publishes the `dist/` directory through `.github/workflows/pages.yml` whenever website files change on `main`. The published address is free under GitHub's public-repository Pages offering. A separate custom domain would require control of a domain and may have a registration cost. The original Sites address remains an alternate mirror.\n\n## Reproduce

Run `python -m http.server 8000 --directory dist` and open http://localhost:8000/. Run `node tests/circuit.test.cjs` to check charge balance, capacitance scaling, current direction, charge compensation and analytical limits. These checks do not validate biological predictions.

## Licence and attribution

No software licence is granted yet. Source visibility does not imply permission to reuse, modify or redistribute code. Bibliographic metadata may carry separate source terms. The user will select a licence later.

## Contributions

Please report a DOI or PMID for missing literature, a reproducible physics or unit issue, or a compatible calibration dataset via GitHub Issues. Include cell type, protocol, measurement units, replicate structure and uncertainty. Do not upload private patient or unpublished experimental data without permission.

## Development: cancer-specific exploratory scenario laboratory

The proposed `dist/cancer-scenarios.html` research tool compares a generic reference membrane with hypothetical glioblastoma, breast and colorectal cancer scenarios. **No cancer-type defaults are measurements.** Users may edit conductances, capacitance, TPMET electron flux, a generic time-dependent potassium gate and provenance. The RK4 solver lives in `dist/cancer-scenario-core.js`; `tests/cancer-scenarios.test.cjs` checks numerical invariants and input validation. This is not a disease classification, clinical prediction or mechanistic demonstration of tumour biology.

To run the additional numerical checks: `node tests/cancer-scenarios.test.cjs`. Real cancer-specific calibration requires matched voltage, conductance, capacitance and redox measurements, independently curated sources and separate test data. The separate ChatGPT-hosted research preview remains unsynchronised until its source is available.

## Electrochemical homeostasis extension (v2.0 research preview)

The new [ion homeostasis laboratory](dist/homeostasis.html) is an **uncalibrated** two-compartment electrophysiology model. It tracks intracellular and extracellular Na+, K+ and Cl- inventories, Nernst reversal potentials, membrane voltage, Na/K-ATPase activity, a simplified electrogenic proton pump, electroneutral Na/H exchange, and buffered pH proxies. A prescribed trans-plasma-membrane electron-transfer current is retained.

Users can test pump suppression, prolonged current injection, smaller extracellular volumes, bath exchange, and approximate charge-compensation perturbations. The model reports Na/K/Cl inventory conservation and membrane-capacitor electrical balance. Time integration uses an explicit fourth-order Runge-Kutta method. It is not a calibrated model of glioblastoma or any other cancer, and does not predict tumour treatment response.

**Scientific limitations:** conductances and transporter kinetics are simplified, proton buffering is linear, electron donor/acceptor species and proton/electron stoichiometries are not tracked, the lumped leak current has no explicit chemical carrier, no local diffusion or space charge is resolved, and the chemical inventories are not a complete accounting of all charge species. A formal electrodiffusive, thermodynamically constrained formulation would be needed for stronger mechanistic claims.

Run `node tests/homeostasis.test.cjs` for numerical regression checks. These are not experimental verification. The independently hosted site has not yet been source-synchronised.
