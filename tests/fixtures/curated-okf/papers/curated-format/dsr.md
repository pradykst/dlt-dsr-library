---
type: PaperDSRProfile
paper_id: CURATED_2026
title: Curated Fixture DSR
review_status: reviewed
---

# Design Requirements

## dr_001_prevent_manipulation

**Type:** DesignRequirement  
**Title:** Prevent manipulation  
**DSR layer:** Requirement  
**Extraction type:** explicit  
**Confidence:** medium-high  
**Tags:** manipulation, integrity

The system should prevent opportunistic manipulation of shared information.

## Concept: dp_001_auditability

```yaml
concept_id: CURATED_2026:dp_001_auditability
type: DesignPrinciple
dsr_layer: Design Principle
title: "Use auditability"
description: "Make changes attributable and reviewable."
tags: [auditability, accountability]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
```

### Explanation

Use this when parties need evidence-backed accountability.

## df_001_hash_anchor

**Type:** DesignFeature  
**Title:** Hash anchor  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Tags:** hash, anchoring

Anchor hashes of shared records.
