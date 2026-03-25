**Project Codename:** HN-Simple

**Target Audience:** Junior Software Engineers & Tech Enthusiasts

**Date:** March 25, 2026

---

## 1. Problem Statement

Hacker News (HN) is the primary source of truth for the tech industry, yet it remains inaccessible to many due to:

- **High Cognitive Barrier:** Posts are often written by experts using dense jargon, making it difficult for early-career engineers to extract value.
- **Outdated UX:** The minimalist, text-only interface lacks visual hierarchy and accessibility features.
- **Information Decay:** Finding historical context or simplified explanations of past trends (Time Travel) is technically difficult with current keyword-based search.


## 2. Goals and Motivation (The "WHY")

- **Accessibility:** Translate "Senior-level" concepts into "Junior-friendly" language.
- **Visual Learning:** Use AI-generated imagery to create mental anchors for abstract technical concepts.
- **Historical Context:** Provide a "Semantic Archive" where users can search by *concept* (e.g., "early cloud scaling") rather than just keywords.
- **Productivity:** Reduce the time required to understand the daily "Top Stories" from 30 minutes to 5 minutes.


## 3. Solution

**HN-Simple** is an AI-powered middleware and frontend that "re-skins" the **Hacker News** experience. It uses an autonomous agentic workflow to fetch, summarize, and visualize the daily tech zeitgeist.



### **Key Features**

- **ELI5 Summaries:** Every post is summarized into three sections: "The Gist," "Why it Matters," and "Key Takeaway."
- **Visual Context:** An AI-generated abstract image representing the technical concept (e.g., a "distributed system" visualized as a glowing web of nodes).
- **Semantic Time Travel:** A search bar that understands intent (e.g., "Show me posts about early LLM development from 2023").
- **Jargon Tooltips:** Hovering over complex terms in the summary provides instant, simple definitions.

### Architectural Components

```
[ HN Firebase API ] <--- (Hourly Polling) --- [ Ingestion Worker (Node.js) ]
                                                        |
                                            [ LangGraph.js Agent Orchestrator ]
                                            /           |           \
                    (Tool 1: Scraper)  (Tool 2: LLM Summarizer)  (Tool 3: Image Gen)
                            |                   |                   |
                    [ Raw Content ] --> [ Simple ELI5 Text ] --> [ DALL-E/Flux Image ]
                                            \           |           /
                                             [ Database: Supabase ]
                                             (Metadata + Vector Store)
                                                        |
                                             [ Frontend: Next.js App ]
                                             (Grid View + Time Travel Search)
```

1. **Ingestion Engine:** A cron-triggered service that pulls IDs from the [HN Firebase API.](https://github.com/HackerNews/API?tab=readme-ov-file)
2. **Agent Orchestrator (LangGraph.js):** A state machine that coordinates scraping, summarization, and image generation.
3. **Vector Archive (Supabase):** A PostgreSQL database using `pgvector` to store content and embeddings for semantic search.
4. **The "Simpler" UI:** A Next.js frontend featuring a card-based layout and a natural language "Time Travel" search bar.


## 4. Implementation Specification

### A. Component Utilities

| **Component** | **Utility** |
| --- | --- |
| **LangChain/LangGraph.js** | Manages the sequence of AI tasks (Scrape -> Summarize -> Image). |
| **Gemini 2.0 Flash** | LLM used for high-speed, cost-effective ELI5 summarization. |
| **fal.ai / Puter.js** | Serverless image generation for blogpost thumbnails. |
| **Cheerio** | Lightweight scraper to extract body text from external links. |


### B. API Specification

### **1. Fetch Simplified Feed**

- **Endpoint:** `GET /api/v1/posts`
- **Description**: Returns a paginated list of processed stories with summaries and image URLs.
- **Request Params:** `page` (default: 1), `category` (optional)
- **Response (200 OK):**


```json
{
  "posts": [
    {
      "id": "hn_4100",
      "original_url": "https://example.com/rust-tips",
      "summary": {
        "gist": "A simpler way to manage memory in Rust.",
        "relevance": "Helps you avoid common 'borrow checker' errors.",
        "action": "Try using the 'Arc' pointer for shared state."
      },
      "image_url": "https://cdn.hnsimple.com/img_4100.webp",
      "tags": ["Rust", "Systems Programming"]
    }
  ]
}
```

### **2. Semantic Search (Time Travel)**

- **Endpoint:** `POST /api/v1/search`
- Description: Accepts a natural language query and performs a vector similarity search via LangChain.
- **Body:** `{ "query": "string", "date_range": "optional_string" }`
- **Response (200 OK):** Returns top 5 posts ranked by vector similarity.

### **3. Error Handling**

- **Format:** `{ "error": "UI_FRIENDLY_MSG", "status": 4xx/5xx }`

## 5. Hosting Strategy (Cost-Effective / Free Tier)

To maintain a $0/mo overhead for the MVP, the following providers are used:

- **Frontend & Logic:** **Vercel (Hobby Tier)**. Utilizes Edge Functions for the API and Vercel Cron (1/day) for syncing.
- **Database:** **Supabase (Free Tier)**. Includes 500MB storage and `pgvector` for search.
- **AI Inference:** **Google AI Studio (Gemini API)**. Free tier offers high RPM (Requests Per Minute) for text.
- **Images:** **fal.ai** (Free trial/credits) or **Puter.js** for community-driven free inference.

## 6. Limitations & Future Scope

### Limitations

- **Scraper Blocks:** Some sites (NYT, Medium) block automated scrapers.
- **Processing Latency:** AI generation takes ~15 seconds per post; requires background processing.

### Future Scope

- **Audio Briefing:** Text-to-speech daily digests.
- **Chrome Extension:** View the "Simple" summary directly on news.ycombinator.com.
- **Community Mentors:** Allowing senior users to "correct" or "improve" AI summaries.