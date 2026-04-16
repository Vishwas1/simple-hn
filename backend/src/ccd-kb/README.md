# Concordium Knowledge Base  

Concordium has developed a rich and highly specialized body of knowledge spanning multiple domains, including cryptographic research, protocol design, developer tooling, product documentation, and ecosystem-level information. This knowledge is distributed across several sources such as whitepapers, technical documentation, internal Confluence pages, official websites, and code repositories.

Historically, this knowledge has been operationalized through domain experts—individuals from science, product, developer relations, and engineering teams—who could interpret and respond to queries across these domains. However, with recent organizational changes and workforce reduction, access to this expertise has become limited, resulting in slower knowledge access, fragmented understanding, and reduced efficiency across teams.

To address this gap, we propose building a Concordium Knowledge Base Agent—an AI-powered system that consolidates institutional knowledge and enables accurate, source-grounded, and cross-domain question answering. The system will leverage Retrieval-Augmented Generation (RAG) to provide reliable answers backed by Concordium’s own documents, with precise citations to original sources such as page numbers, URLs, and code references.

# Problem Statement
Concordium currently faces a knowledge accessibility and continuity challenge driven by the following factors:
- **Fragmented Knowledge Sources:** Critical knowledge is distributed across multiple systems: Whitepaper and Bluepaper (PDFs), Developer documentation (docs.concordium.com), Official website (concordium.com), Internal Confluence pages, GitHub repositories (e.g., concordium-base)
- **Loss of Domain Expertise:** Previously, domain experts served as the bridge between these knowledge sources and users.With reduced team size: Queries remain unanswered or delayed, Cross-domain understanding is weakened, Institutional knowledge becomes harder to access
- **Inefficient Knowledge Retrieval**: Current methods rely on: manual search across multiple platforms, tribal knowledge, context-dependent interpretation. This results in: increased time to resolution, inconsistent answers, duplication of effort. 

# Solution 
We propose building a domain-aware, source-grounded AI knowledge agent powered by a Retrieval-Augmented Generation (RAG) architecture.

The **Concordium Knowledge Base Agent** will:
- ingest and index all relevant knowledge sources
- retrieve context intelligently based on query intent
- generate answers grounded strictly in Concordium content
- provide precise citations (documents, page numbers, URLs, code references)
- adapt responses across domains (science, developer, product, code)

> The Concordium Knowledge Base Agent acts as a **scalable**, **always-available domain expert**, capable of answering scientific, technical, product, and implementation queries with precise, source-backed accuracy.

## Core Capabilities
- Unified Knowledge Access
- Domain-Aware Question Understanding: scientific/protocol, developer/how-to, code/implementation, product/business
- Precise Source Attribution
- Continuous Knowledge Updates

## Impact
- Faster Decision Making: Reduces time to find accurate, cross-domain information by providing a unified, queryable knowledge layer.
- Increased Developer Productivity: Enables developers to quickly access commands, implementation details, and documentation without manual search across multiple systems.
- Foundation for Specialized AI Agents (MCP-Compatible Knowledge Layer): The knowledge base can be exposed as a Model Context Protocol (MCP) server, allowing it to act as a centralized context provider for future specialized agents

## Ingestion  

### Sources

- Whitepaper & Bluepaper 
- Official website  - concordium.com 
- Official document - docs.concordium.com
- Code Repo [Out of scope]

#### Strategy for PDF - Whitepaper, Bluepaper etc. 

You are converting the PDF into a structured knowledge object:

```
Document
 ├── Sections (H1)
 │    ├── Subsections (H2)
 │    │     ├── Paragraph groups
 │    │     │     ├── Chunks (final embedding unit)
```

Each chunk must retain:

- page numbers
- section path
- semantic boundaries

Final Chunk Object:
```
{
  "chunk_id": "wp_sec4_2_chunk3",
  "source_type": "whitepaper",
  "document_title": "Concordium White Paper",
  "section_title": "Revocation",
  "heading_path": ["4", "Identity Layer", "4.2", "Revocation"],
  "page_start": 37,
  "page_end": 37,
  "chunk_text": "Revocation allows identities to be revoked by...",
  "augmented_text": "Document: Concordium White Paper\nSection: 4.2 Revocation\nContent: Revocation allows...",
  "authority_score": 1.0,
  "embedding": [ ... ]
}
```

Tool: pdfjs-dist

#### Strategy for concordium.com website 

Each website page becomes:

```
Page (URL)
 ├── Metadata
 ├── Sections (H1/H2/H3)
 │     ├── Content blocks
 │     │     ├── Chunks (embedding units)
```

Tool: playwright


Final Chunk Object:
```
{
  "chunk_id": "web_identity_benefits_1",
  "source_type": "website",
  "url": "https://concordium.com/identity",
  "page_title": "Identity - Concordium",
  "section_title": "Benefits",
  "heading_path": ["Identity", "Benefits"],
  "chunk_text": "Concordium’s identity layer enables...",
  "augmented_text": "Page: Identity - Concordium\nSection: Benefits\nURL: https://concordium.com/identity\nContent: Concordium’s identity layer enables...",
  "authority_score": 0.6
}
```

#### Strategy for docs.concordium.com 

Each doc page becomes:

```
Doc Page
 ├── Metadata (version, product area)
 ├── Sections (H1/H2/H3)
 │     ├── Content blocks
 │     │     ├── Code blocks
 │     │     ├── Steps
 │     │     ├── Notes/Warnings
 │     │     ├── Chunks (final units)
```

Final Chunk Object:

```
{
  "chunk_id": "docs_tx_submit_1",
  "source_type": "docs",
  "doc_version": "mainnet",
  "url": "https://docs.concordium.com/en/mainnet/docs/transactions/submit.html",
  "page_title": "Submit transactions",
  "section_title": "Submitting a transaction",
  "heading_path": ["Transactions", "Submitting"],
  "content_type": "procedure",
  "contains_code": true,
  "chunk_text": "To submit a transaction, use the following command...",
  "augmented_text": "Page: Submit transactions\nSection: Submitting a transaction\nContent: To submit a transaction...",
  "authority_score": 0.9
}

```

#### Stragey for Code base [Out of Scope for this version] 

```
Repo
 ├── Files
 │     ├── Symbols (functions, structs, modules, etc.)
 │     │     ├── Code chunk
 │     │     ├── Summary
 │     │     ├── Metadata
```

Tool: Tree-sitter


```
{
  "chunk_id": "gh_cb_verify_credential",
  "source_type": "github",
  "repo_name": "concordium-base",
  "file_path": "rust-src/.../identity.rs",
  "symbol_name": "verify_credential",
  "symbol_type": "function",
  "line_start": 210,
  "line_end": 278,
  "summary": "Verifies a credential by validating signatures and revocation status",
  "chunk_text": "fn verify_credential(...) { ... }",
  "augmented_text": "Function: verify_credential\nFile: identity.rs\nSummary: Verifies a credential...",
  "authority_score": 0.95
}
```

## Retrieval and Answering 

**Pipeline 1 → “Find the truth”**

> 👉 Retrieval

**Pipeline 2 → “Explain the truth safely”**

> 👉 Generation

### Retrieval Strategy

> Retrieval is not “search top-k vectors” — it is a multi-stage decision system.

You must answer:

- What kind of question is this?
- Which sources should I trust?
- How should I search them?
- How do I combine results?
- How do I ensure evidence quality before answering?

Retrieval Architecture

```
User Query
   ↓
Query Understanding (intent + domain classification)
   ↓
Query Expansion (multi-query generation)
   ↓
Source Routing (based on domain + authority)
   ↓
Hybrid Retrieval (Vector + BM25)
   ↓
Candidate Merging & Deduplication   ← (important, implicit in your flow)
   ↓
Reranking (relevance + authority)
   ↓
Context Assembly (final evidence selection)
   ↓
Answer Generation (with citations)
```

### Answer generation strategy

> The LLM is not an answer generator — it is a reasoning engine over retrieved evidence.

```
Retrieved Chunks
   ↓
Context Builder (structured evidence formatting)
   ↓
Prompt Construction (rules + tone + citation constraints)
   ↓
LLM Generation
   ↓
Post-processing
   ├── Citation validation
   ├── Hallucination checks
   └── Formatting
   ↓
Final Answer
```

#### Context Formatting

Do NOT pass raw chunks.

Format them into structured evidence blocks.

```
[Source 1]
Type: Whitepaper
Title: Concordium White Paper
Section: Identity Layer → Revocation
Page: 37

Content:
Revocation allows identities to be revoked by...

---

[Source 2]
Type: Docs
URL: https://docs.concordium.com/identity
Section: Identity framework

Content:
The identity framework enables...

```

#### Strict Prompt Design


```
You are a Concordium knowledge assistant.

You MUST follow these rules:

1. Answer ONLY using the provided sources.
2. Do NOT use prior knowledge.
3. Every important claim MUST include a citation.
4. If information is missing, say:
   "This is not found in the provided sources."
5. Do NOT guess or infer beyond evidence.
6. Prefer higher-authority sources (whitepaper > docs > website).
7. Keep answers precise and structured.

```

#### Citation Enforcement

Force citation at generation time.

```
For every statement, include citation in this format:

- [Whitepaper p.37]
- [Docs: Submit Transactions]
- [GitHub: identity.rs lines 210–278]
```
#### Domain-Aware Tone Control

Use classification result to adjust tone.


| Domain | Tone |  |
|---|---|---|
| Science / Technical (deep, precise) | - use formal language - include mechanisms - avoid simplification |  |
| Developer (actionable) | - step-by-step - include commands - explain flags |  |
| Code (engineering tone) | - reference functions/modules - explain logic - include file + line references |  |
| Product / Marketing (high-level) | - simple explanation - focus on benefits - avoid deep protocol detail |  |


Implementation

Inject tone instruction dynamically:
```
const toneInstruction = {
  science: "Provide a technical explanation with precise terminology.",
  developer: "Provide step-by-step instructions with commands if available.",
  code: "Explain using code references and implementation details.",
  product: "Provide a high-level explanation focusing on benefits.",
}
```

#### Answer Structure (Standardize Output)

Force a consistent structure.

Template
```
Answer:
<direct answer>

Details:
<expanded explanation>

Sources:
- <citation 1>
- <citation 2>

(Optional) Notes:
<any caveats>
```

#### Post-Processing Layer

Do NOT trust raw LLM output blindly.

Validate:
- every claim has citation
- citations exist in retrieved metadata
- no hallucinated sources
- no empty sections


# Future Vision / Roadmap

## Incremental Ingestion & Continuous Sync

> RAG is not a one-time indexing job — it is a continuous data pipeline.

Implement a real-time knowledge synchronization pipeline to keep the system up-to-date:

Docs & Website:
- checksum-based change detection
- partial re-indexing of updated pages

GitHub Repositories:
- webhook-triggered ingestion on commits/merges
- file-level updates instead of full reindex

Confluence:
- timestamp-based sync for modified pages

Versioning Layer:
- maintain active vs deprecated content
- ensure retrieval always uses latest authoritative data

Stratgey: 
```
Source
   ↓
Change Detection Layer
   ↓
Ingestion Jobs (queue)
   ↓
Chunking + Embedding
   ↓
Index Update (vector + metadata)
   ↓
Old Data Handling (versioning / invalidation)

```

| Source     | Strategy            |
| ---------- | ------------------- |
| Whitepaper | manual trigger (based on version)     |
| Docs       | every 6–12 hours (crawl)   |
| Website    | daily               |
| GitHub     | real-time (webhook - PR event) |


## Expanded Source Coverage (Code Intelligence Layer)

Extend the system to deeply integrate Concordium’s codebases (e.g., concordium-base, node, SDKs):

- Parse repositories at the symbol level (functions, modules, types)
- Generate semantic summaries of code for retrieval
- Enable mapping from:
    - concept → implementation
    - documentation → code
- Support queries such as:
    - “Where is credential verification implemented?”
-    “How does this module work internally?”

Impact:

- Bridges gap between documentation and implementation
- Enables engineering-level understanding through the agent
- Transforms the system into a developer-grade knowledge assistant

## MCP Server Integration (Shared Knowledge Layer)

Expose the knowledge base as a Model Context Protocol (MCP) server, enabling it to serve as a centralized context provider for other AI agents.

This allows future specialized agents such as:

- Developer agents
- Writer / documentation agents
- Product / design agents
- Support / DevRel agents

to query a single, unified knowledge system instead of integrating with multiple sources independently.

Impact:

- Establishes a single source of truth across all AI systems
- Enables rapid development of new internal AI tools
- Creates a modular, composable AI architecture

## Feedback & Learning Loop

Introduce a controlled feedback system to continuously improve performance:

- track unanswered or low-confidence queries
- identify documentation gaps
- curate high-quality FAQ entries
- refine query expansion and routing

Impact:

- System improves over time based on real usage
- Helps identify missing or unclear documentation

## Internal & External Integrations

- Slack for internal teams
- Discord for external teams

