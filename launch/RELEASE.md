# Research preview release preparation

Model identifier: passive-tpmet-circuit-1.0
Prepared 2 November 2026.

## Reproduce locally

With Python 3, run `python -m http.server 8000 --directory dist` from the project root. Open http://localhost:8000/ in a browser.
With Node.js, run `node tests/circuit.test.cjs` for numerical consistency checks.

## Demonstration

Open circuit.html. Leave defaults and note resting voltage of approximately -71.241 mV. Change the uncompensated fraction eta from 0.5 to 0. The TPMET net current becomes zero and resting voltage becomes approximately -74.815 mV. This demonstrates the assumed charge-compensation relationship, not a measured cancer-cell response.

## Scope and provenance

The simulator uses a fixed-conductance, single-compartment model with prescribed direct electron flux. It does not predict cancer growth or treatment efficacy. The literature search results are awaiting screening and are not exhaustive. See dist/model-documentation.json and dist/literature/search-log.json.

## Publication status

The live website is public. This source package is prepared for review. No GitHub release or Zenodo DOI has been assigned by this preparation step. Do not claim archival publication until the repository and deposit are confirmed.

Before archival release, confirm the author list, the software licence and rights for redistributed literature metadata. Source visibility alone does not grant an open-source licence. Keep third-party data terms separate from the software licence.

Suggested release description: Cancer Bioelectricity Explorer is an exploratory platform for literature exploration and passive membrane-circuit modelling with TPMET. Default parameters are illustrative. Biological predictions are not validated.
