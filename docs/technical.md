# Database
## `documents` Table

```SQL
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    source_type TEXT NOT NULL,  -- 'pdf', 'docs', 'website', 'github', 'confluence'

    canonical_url TEXT,         -- for website/docs
    source_identifier TEXT,     -- e.g. repo name, file path, or unique key

    version TEXT,               -- e.g. 'mainnet', 'v1.8'
    authority_score FLOAT DEFAULT 0.5,

    checksum TEXT,              -- used for change detection
    is_active BOOLEAN DEFAULT TRUE,

    metadata JSONB,             -- flexible extra info (language, tags, etc.)

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```


## `chunks` Table

```SQL
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,

    chunk_text TEXT NOT NULL,
    augmented_text TEXT NOT NULL,

    -- Section / structure
    section_title TEXT,
    heading_path JSONB,   -- ["4", "Identity", "4.2", "Revocation"]

    -- Source classification
    source_type TEXT NOT NULL,
    content_type TEXT,    -- 'explanation', 'procedure', 'code', 'faq'

    -- PDF-specific
    page_start INT,
    page_end INT,

    -- Web/docs
    url TEXT,

    -- Code-specific
    file_path TEXT,
    symbol_name TEXT,
    symbol_type TEXT,
    line_start INT,
    line_end INT,

    -- Ranking / filtering
    authority_score FLOAT DEFAULT 0.5,
    is_active BOOLEAN DEFAULT TRUE,

    checksum TEXT,

    -- Embedding
    embedding VECTOR(1536),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Indexes

### Vector Index

```SQL
CREATE INDEX idx_chunks_embedding
ON chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```


### Metadata Index
```SQL
CREATE INDEX idx_chunks_source_type ON chunks(source_type);
CREATE INDEX idx_chunks_active ON chunks(is_active);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_url ON chunks(url);
```

# Tech Stack



## Backend

- Node.js (TypeScript) 
- Framework:
    - Express
- LLM 
    - OpenAI (GPT-4o / GPT-4o-mini)
- Embeddings
    - Open AI embedding (`text-embeddding-3-large`)
- Database
    - Supabase Postgres
        - pgvector (embeddings)
        - relational metadata


## Crawling / Parsing

| Source  | Tool        |
| ------- | ----------- |
| PDF     | pdfjs-dist  |
| Website | Playwright  |
| Docs    | Playwright  |
| Code    | Tree-sitter |



