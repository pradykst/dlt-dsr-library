# Final correction report: forgetting-blockchain-gdpr

## Source conclusion

The prior zero-concept decision was incorrect. Section 4.2, "Definition of objectives" (article p. 7089; PDF p. 4), explicitly states one primary prototype objective and then says "we define requirements that the prototype needs to fulfill" before enumerating six requirements. Section 4.5 evaluates the prototype against those same requirements and reports that requirement 3 was not fully met.

## Canonical correction

The paper now has seven formal design-knowledge concepts:

- DO1: build a working prototype demonstrating deletion of blockchain transactions while maintaining functionality.
- DR1: tamper resistance.
- DR2: distribute all information to all nodes.
- DR3: allow new nodes to join later.
- DR4: allow all nodes to add transactions.
- DR5: remain decentralized without trustees.
- DR6: delete every transaction after a predefined time.

Each numbered requirement addresses DO1, yielding six source-supported semantic edges. DR3 notes the later negative evaluation result without changing the source-authored requirement.

## Boundary retained

Section 4.3's state-pruning and custom multi-database deletion mechanisms remain artifact/implementation details. The paper does not label or enumerate them as formal reusable design features, so no design-feature concepts were synthesized. The later narrative recommendations likewise remain discussion and limitations, not invented design principles.

## Result

The corrected design map contains 1 design objective, 6 design requirements, and 6 objective-to-requirement relationships. The paper is no longer a zero-concept case.
