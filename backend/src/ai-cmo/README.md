Worflow:

- [Human] The CEO/CMO comes and add brand profile (vision, mission, positioning, value props)
- [Human] The CMO then enters objectives / goal
- [Agent] The strategist then creates campaigns (one or more) wrt one objective and decides channel (linkedIn, X, Website etc) to post
- [Agent] The SEO researchs does key word research, suggest topics
- [Agent] The strategist approves the suggested topics by SEO researcher or even suggest new topci
- [Agent] If new topic, the SEO again searches for keywords for newly suggested topcis. and finally it passes the keyword, topcis etc to writer agent
- [Agent] writer Writes the content on each topics
- [Agent] strategist reviwes the content and give go ahead, if issues it asks the writer to rework on suggested points
- [Human] Also review the final list of posts / blog and gives approval
- [Agent] finally post on channel.

# Technical

ai-cmo/
├── state.ts # Defines the "Shared Whiteboard" schema
├── nodes/ # Individual agent functions (Strategist, SEO, Writer)
│ ├── strategist.ts
│ ├── seo.ts
│ └── writer.ts
├── graph.ts # The actual LangGraph definition & routing logic
└── index.ts # Express route handler
