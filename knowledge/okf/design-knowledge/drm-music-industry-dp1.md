---
type: design-principle
title: "DP1 - Public-ledger metadata storage"
description: "The system should store music rights metadata on a distributed ledger using a public blockchain to make licensing structures transparently visible to everyone, so that rights owners can claim royalties."
resource: "https://doi.org/10.1007/s12525-023-00628-5"
source_paper: "Blockchain-based digital rights management systems: Design principles for the music industry"
label: "DP1"
tags:
  - drm-music-industry
  - design-principle
  - drm-music
  - intellectual-property
  - royalties
  - marketplace
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design principle DP1: Public-ledger metadata storage

The system should store music rights metadata on a distributed ledger using a public blockchain to make licensing structures transparently visible to everyone, so that rights owners can claim royalties.

## Source paper

This design principle is proposed by [Blockchain-based digital rights management systems: Design principles for the music industry](../papers/drm-music-industry.md) (Raffaele Fabio Ciriello, Alexandra Cecilie Gjol Torbensen, Magnus Rotvit Perlt Hansen, Christoph Mueller-Bloch, 2023).

## Addresses

* [Design requirement DR1: Transparent music licensing structures](./drm-music-industry-dr1.md)
* [Design requirement DR3: Efficient and transparent royalty payout](./drm-music-industry-dr3.md)

## Implemented by

* [Design feature DF1: Public-permissioned blockchain](./drm-music-industry-df1.md)
* [Design feature DF2: pBFT consensus](./drm-music-industry-df2.md)

# Citations
[1] Raffaele Fabio Ciriello, Alexandra Cecilie Gjol Torbensen, Magnus Rotvit Perlt Hansen, Christoph Mueller-Bloch. Blockchain-based digital rights management systems: Design principles for the music industry. Electronic Markets 33:5 (2023). https://doi.org/10.1007/s12525-023-00628-5
[2] Source document: Blockchain-based digital rights management systems.pdf
[3] Source evidence: Figure 4, "Design features of blockchain-based DRM systems", article p. 16 (PDF p. 16), explicitly connects DR1 and DR3 to DP1 and connects DP1 to DF1 and DF2.
