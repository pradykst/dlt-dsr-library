---
type: design-principle
title: "DP2 - Consensus-validated metadata on a permissioned chain"
description: "The system should validate music metadata with a consensus mechanism on a permissioned blockchain and assign a unique identifier to rights owners, so that labels and publishers can ensure consistency and completeness."
resource: "https://doi.org/10.1007/s12525-023-00628-5"
source_paper: "Blockchain-based digital rights management systems: Design principles for the music industry"
label: "DP2"
tags:
  - drm-music-industry
  - design-principle
  - drm-music
  - intellectual-property
  - royalties
  - marketplace
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design principle DP2: Consensus-validated metadata on a permissioned chain

The system should validate music metadata with a consensus mechanism on a permissioned blockchain and assign a unique identifier to rights owners, so that labels and publishers can ensure consistency and completeness.

## Source paper

This design principle is proposed by [Blockchain-based digital rights management systems: Design principles for the music industry](../papers/drm-music-industry.md) (Raffaele Fabio Ciriello, Alexandra Cecilie Gjol Torbensen, Magnus Rotvit Perlt Hansen, Christoph Mueller-Bloch, 2023).

## Addresses

* [Design requirement DR2: Consistent and complete rights metadata](./drm-music-industry-dr2.md)
* [Design requirement DR1: Transparent music licensing structures](./drm-music-industry-dr1.md)

## Implemented by

* [Design feature DF1: Public-permissioned blockchain](./drm-music-industry-df1.md)
* [Design feature DF2: pBFT consensus](./drm-music-industry-df2.md)
* [Design feature DF3: Fiat-pegged stablecoin payout](./drm-music-industry-df3.md)

# Citations
[1] Raffaele Fabio Ciriello, Alexandra Cecilie Gjol Torbensen, Magnus Rotvit Perlt Hansen, Christoph Mueller-Bloch. Blockchain-based digital rights management systems: Design principles for the music industry. Electronic Markets 33:5 (2023). https://doi.org/10.1007/s12525-023-00628-5
[2] Source document: Blockchain-based digital rights management systems.pdf
[3] Source evidence: Figure 4, "Design features of blockchain-based DRM systems", article p. 16 (PDF p. 16), explicitly connects DP2 to DF1, DF2, and DF3.
