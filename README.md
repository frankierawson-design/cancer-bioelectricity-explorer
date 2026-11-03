# Cancer Bioelectricity Explorer

An exploratory research preview for cancer bioelectricity literature and a passive trans-plasma-membrane electron transfer (TPMET) circuit model.

- Website: https://frankierawson-design.github.io/cancer-bioelectricity-explorer
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
