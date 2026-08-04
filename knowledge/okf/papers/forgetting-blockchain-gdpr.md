---
type: paper
title: "Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility"
description: "The paper uses design science research to build and evaluate a proof-of-concept Ethereum-based blockchain that deletes old data (state pruning plus a custom multi-database deletion function) while retaining tamper-resistance, decentralization, and smart-contract functionality, and discusses the resulting implications and limitations for GDPR-compliant blockchain design."
resource: "https://hdl.handle.net/10125/60145"
authors: "Simon Farshid, Andreas Reitz, Peter Roßbach"
year: 2019
venue: "HICSS 52 (2019)"
methodology: "Design science research (Peffers et al. 2007): problem identification, definition of objectives, design and development of a pruning-based prototype, demonstration, and expert evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (proof-of-concept prototype); the paper's guidance for future designers is presented as narrative discussion, not as a formally itemized set of design principles."
tags:
  - forgetting-blockchain-gdpr
  - gdpr-privacy
  - blockchain-architecture
  - data-deletion
  - right-to-erasure
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility

**Authors:** Simon Farshid, Andreas Reitz, Peter Roßbach
**Venue:** HICSS 52 (2019)
**Link:** https://hdl.handle.net/10125/60145

## Summary

The paper uses design science research to build and evaluate a proof-of-concept Ethereum-based blockchain that deletes old data (state pruning plus a custom multi-database deletion function) while retaining tamper-resistance, decentralization, and smart-contract functionality, and discusses the resulting implications and limitations for GDPR-compliant blockchain design.

## Research problem and question

Blockchain's append-only immutability conflicts with the GDPR right to erasure: even when personal data is not put directly on-chain, historical transaction data can later be de-anonymized (e.g., linked Bitcoin addresses), so unnecessary data needs to be deletable as a preventive measure. Existing chain-editing approaches (e.g., Accenture's) require a trusted party with arbitrary edit rights, which the authors regard as unsuitable for a general, trust-free blockchain. The paper's research question: "How can we design a decentralized blockchain that forgets, and what implications arise from it?"

## Theoretical grounding

Design science research (Peffers et al. 2007); the "exaptation" DSR contribution category (Gregor and Hevner 2013), since the prototype extends an already-known technique (Ethereum/Parity state pruning) to a new problem; "weak subjectivity" (Buterin 2014) as the trust model needed once a network no longer retains its genesis block.

## Artifact and forgetting mechanism

A working proof-of-concept prototype, built on the Ethereum blockchain using the Parity client, that deletes predefined data after a predefined amount of time while remaining tamper-resistant, decentralized, and capable of running smart contracts. Development proceeded in two stages:

1. **Pruning algorithm design.** The authors first identified which client-held information each blockchain action actually depends on (first sync, staying in sync, sending transactions, mining, transaction history), summarized as a dependency table, to determine what could be safely deleted without breaking functionality. Smart contracts and mining only require the current block/state; only staying in sync and transaction history require recent or all blocks. State data is deleted using Parity's existing "state pruning" feature (originally built for scalability); a custom function was added that deletes all other data about a block across nine separate Parity databases (transaction data, receipt data, etc.), with source code published on GitHub.
2. **Building a network that forgets.** Every participant must run the pruning software for deletion to take effect network-wide. The authors deployed the modified Parity client across five hosts plus a connected block explorer (Etherchain Light), with the block-deletion duration set to 10 blocks (about 30 seconds) for testing.

The prototype had to satisfy six defined requirements: (1) tamper-resistance; (2) information distributed to all nodes; (3) new nodes able to join the network; (4) all nodes able to add transactions; (5) full decentralization with no reliance on trustees; and (6) deletion of every transaction after a predefined amount of time.

## Evaluation

The prototype was demonstrated individually to three financial-services experts (one blockchain engineer, two senior consultants), using financial-transaction use cases since all experts had a finance background. Each expert transferred Ether between accounts and watched, via the block explorer, the transactions disappear from the recent-activity view about 30 seconds later while the account balance was retained. Experts then deployed a sample smart contract, observed that its creation transaction was deleted while the contract code remained live in the state, updated a variable through the contract (again seeing the update transaction deleted while only the latest value persisted), and finally called the contract's self-destruct function, after which no trace of the contract — including its code — remained on the chain 30 seconds later. As a final test, two nodes were deactivated: one restarted before the 30-second deletion window elapsed and resynchronized without issue; the other, restarted after a minute, failed to resynchronize and remained detached. The blockchain otherwise continued mining and deleting blocks normally regardless of which nodes were active.

The authors also compared block deletion against anonymization and chain-editing approaches on two criteria — decentralization and immunity to retroactive attacks (Table 2) — finding block deletion to be the only approach satisfying both, since anonymization keeps information indefinitely (vulnerable if today's cryptography is broken later) and chain editing is not decentralized.

## Findings

All three experts, interviewed individually, agreed that a GDPR-compliant financial transaction is possible with the prototype. The demonstration showed mining, ordinary transactions, and smart contracts continuing to work despite the deletion changes, and — since the transaction-verification protocol itself was not altered — the system remained tamper-proof (only account owners can spend their tokens; smart-contract code cannot be altered or deactivated by third parties) and fully decentralized (no node has special status; any host can be turned off). Experts raised follow-up questions the authors addressed directly, including: how the system remains secure without a re-verifiable history (verification happens once, at insertion, and is trusted afterward); that deletion cannot technically prevent a participant from keeping their own backups; that data intended to persist longer than the deletion window should be stored in smart-contract state via explicit logging rather than in transactions; and that a new or resynchronizing node, lacking the genesis block, must ask multiple other nodes for a recent block and cross-check that they agree on it before trusting it as a starting point. The one requirement (of six) not fully met was requirement 3: adding new nodes to the network is no longer straightforward.

## Limitations

The authors identify four limitations. First, the approach cannot enforce network-wide deletion — it cannot stop a participant from keeping backups — so it is currently only practical inside restricted/permissioned environments where financial and legal incentives (e.g., auditing) discourage archiving; the authors note a need for future research on public-setting variants. Second, the built-in history of smart-contract actions is lost once old blocks are deleted; contract code remains unalterable, but any history a contract needs must be explicitly logged to persistent state, since this is no longer automatic. Third, adding new nodes is technical and tedious: because the genesis block no longer exists, a new or resynchronizing node must instead trust a recent block obtained from, and cross-checked against, multiple sources — a "weak subjectivity" trust assumption the authors regard as less secure than syncing from a well-known genesis block, though it is only needed once, during initial node setup. Fourth, a node that stays offline longer than the deletion window will fail to resynchronize (the blocks connecting its last known state to the current chain may already be deleted) and must repeat the tedious setup process; the authors recommend setting the deletion time to a reasonably long period (e.g., seven days) to tolerate ordinary downtime.

## Future research

The authors call for further work on: new smart-contract best practices and monitoring/auditing approaches for blockchains that forget, since historical information is no longer available; extending block-deletion techniques to address scaling issues on public blockchains, where growing data volume is itself becoming infeasible to store indefinitely; and building a stronger body of reference material on smart-contract use cases and capabilities generally.

## Design knowledge

This paper does not present its guidance for future designers as a source-labelled, enumerated, or tabled set of design goals, objectives, requirements, principles, or features. Its "principles for designing data-protection-compliant blockchains" (as stated in the abstract and conclusion) are conveyed only as narrative discussion, scattered across the Evaluation Q&A (Section 4.5), the Limitations (Section 5), and the Discussion and conclusion (Section 6), without any table, figure, or numbered list presenting them as a formal, reusable set. Per the project's canonicalization rule, no formal design-knowledge concept is created for this paper; its contribution is represented above in Artifact and forgetting mechanism, Evaluation, Findings, and Limitations instead. This is a valid zero-node representation: the paper contributes a working artifact and evaluated lessons, not formally itemized reusable design knowledge.

# Citations
[1] Simon Farshid, Andreas Reitz, Peter Roßbach. Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility. HICSS 52 (2019), pp. 7087-7095. https://hdl.handle.net/10125/60145
[2] Source document: Design of a forgetting blockchain.pdf
[3] Source evidence: Artifact and forgetting mechanism — Section 4.3 "Design and development" (pruning-algorithm design, Table 1 action-dependency summary; nine-database custom deletion function), article p. 7090.
[4] Source evidence: Evaluation — Section 4.4 "Demonstration" (three financial-services experts; Figures 3-8) and Table 2 "Solutions to Blockchain privacy problems", article p. 7091-7092.
[5] Source evidence: Findings — Section 4.5 "Evaluation" (objectives assessment against Section 4.2's six requirements; expert consensus that a GDPR-compliant transaction is possible), article p. 7092-7093.
[6] Source evidence: Limitations — Section 5 "Limitations" (four numbered points: restricted-environment applicability, loss of built-in contract history, weak-subjectivity node bootstrapping, downtime-driven deletion-time recommendation), article p. 7093.
