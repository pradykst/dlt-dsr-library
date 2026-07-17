---
type: reference
title: "About design knowledge"
description: "Defines design knowledge and the five concept types used in this bundle (design principle, design requirement, meta-requirement, design objective, design goal) and how they relate."
tags:
  - reference
  - design-science-research
  - design-knowledge
  - glossary
  - taxonomy
timestamp: '2026-07-16T00:00:00+00:00'
---

# About design knowledge

This bundle is a library of **design knowledge**: prescriptive knowledge about *how to build* an artifact (an information system, architecture, or method) to solve a recurring class of problems. In Design Science Research (DSR), design knowledge is contrasted with descriptive knowledge (theories about how the world *is*): it tells a designer what to do, not merely what is true. It is meant to be reusable - abstracted away from any single implementation so that it can guide the design of a whole class of systems.

Each of the 34 source papers follows a DSR process that moves from a problem to a solution and produces one or more of the concept types below. This library captures each such item as its own atomic concept so it can be retrieved, compared, and reused across papers.

## The five concept types

The types below are ordered as they typically flow in a DSR project, from problem space to solution space. Papers vary in which subset they use and in their exact terminology; this bundle preserves each paper's own vocabulary as the concept `type`.

* **Meta-requirement** (`type: meta-requirement`) - a requirement that applies to a whole *class* of artifacts rather than a single instance. It states, in problem-space terms, a generalized need that any system addressing the problem class must satisfy.
* **Design requirement** (`type: design-requirement`) - a generalized description of the needs and goals a class of systems should attain to address a class of problems. In practice several papers use "design requirement" and "meta-requirement" closely, with requirements often being the more specific, elicited needs derived from the problem analysis.
* **Design objective** (`type: design-objective`) and **design goal** (`type: design-goal`) - solution objectives that the artifact must achieve. They are derived from the problem and its requirements and act as a bridge between what is needed (requirements) and how it is achieved (principles). Objective-centered DSR studies sometimes stop at this level.
* **Design principle** (`type: design-principle`) - the flagship piece of prescriptive design knowledge: a statement of how to attain a solution for a class of problems, reusable across instances. Many papers here formulate principles with the "anatomy of a design principle" schema (aim, implementer and user, context, mechanism, and rationale), so a principle typically says *what* to provide, *for whom*, *in what context*, *through which mechanism*, and *why it works*.

* **Design feature** (`type: design-feature`) - the concrete, technology-specific realization of a design principle in a particular artifact: for example, a smart contract, an off-chain storage component, a non-fungible token, or a specific user-interface element that implements what a principle prescribes. Unlike a principle, a feature is *instantiation-specific* - it describes one way a principle was built in one artifact rather than reusable, transferable knowledge. In this bundle, design features are captured for the papers that enumerate them; each feature links to the design principle(s) it implements, and those principles carry a reciprocal *Implemented by* link.

## How the types relate

A common DSR chain runs: **problem -> meta-requirements / design requirements -> design objectives / goals -> design principles -> design features -> instantiated artifact**. Requirements and meta-requirements sit in the *problem space* (what must be true); principles sit in the *solution space* (what to do); design features sit in the *instantiation space* (how it was actually built). This bundle represents each level as its own concept type, so the chain can be traced by following links from a paper to its principles and on to the features that implement them.

In this bundle these relationships are encoded as markdown links: a design-knowledge concept links back to its [source paper](papers/index.md), and where a paper maps a principle to the requirements it satisfies, the principle carries an *Addresses* link to those requirement concepts. Consumers can compute the reverse ("addressed by") backlinks from these forward links.

## Further reading

The design-knowledge vocabulary used here follows the DSR tradition, including Gregor and Hevner's positioning of prescriptive knowledge (2013), Gregor and Jones on the anatomy of a design theory (2007), and Gregor, Kruse and Seidel on the anatomy of a design principle (2020) - the last of which several papers in this corpus cite directly.
