**this markdown is a work in progress

# DealQ Monorepo

Welcome to DealQ, the AI workflow platform for commercial real estate investors.

As the sole technical co-founder, I architected this codebase into production, from schema design to web app design to infra, and it was being used by multiple enterprise customers during our private beta. It was built with scale and future feature shipments in mind. The company has since wound down and I am no longer shipping feature updates.

I've stripped out sensitive IP including prompts in this sanitized codebase which exists for the purposes of showcasing my work. Below I'll walk you through the stack, architectural choices I made, and where the issues / areas of improvement are here.

## What is DealQ

The original vision for DealQ was a platform where CRE investors could access AI powered workflows to solve the most mundane and time-intensive due diligence tasks. Particularly, the one we chose to solve first is deal screening / underwriting.

A commercial real estate investor typically receives dozens of deals per week. There are three primary documents per deal, all of which are highly variable and messy:

1. The offering memorandum - a long, messy, unstructured PDF which contains the investment narrative, property details, market info, and more.

2. The rent roll - PDF or excel document that contains all the unit data and rents of the property

3. The trailing twelve statement - a PDF of excel income statement for the last twelve months at the property, which investors manually categorize based on how they underwrite deals at their firm.

The process of extracting and structuring these documents into a firm's proprietary excel model usually takes anywhere from 30 minutes to a couple of hours or more per deal, often just to find out that a deal doesn't fit the criteria for investing. DealQ's underwriting workflow cut this process down to under 10 minutes.

## Technical Challenges / Accomplishments

### 1. **AI-Powered Data Extraction Across Inconsistent Document Formats**
- **Challenge**: Extracting structured data from highly variable PDFs and Excel files with inconsistent formatting, layouts, and naming conventions across different deals
- **Solution**: Built a multi-stage pipeline utilizing a strategic mix of deterministic methods (regex patterns, structured parsing) and AI (LangChain with modular prompts) for intelligent data structuring and validation and concurrent processing for speed
- **Result**: Achieved 99% accurate data extraction across diverse document formats and building sizes, reducing manual data entry from 30+ minutes to under 10 minutes per deal

I breakdown two of the most significant breakthroughs in the pipeline sections.

### 2. **Data Security & User Isolation**
- **Challenge**: Ensuring secure data access and user isolation across enterprise customers in a shared database
- **Solution**: Implemented Supabase RLS policies with user-scoped data access patterns and backend endpoint authorization checks. Modularized database layer that could be transferred onto seperate DB containers for true multi-tenant architecture down the line (to support enterprise)
- **Result**: Secure data isolation supporting multiple enterprise clients with proper access controls

### 3. **Excel Model Integration**
- **Challenge**: Allowing users to upload and integrate their proprietary Excel models with AI-extracted data
- **Solution**: Built custom Excel generation service with dynamic model mapping and validation
- **Result**: Seamless integration between AI-extracted data and existing underwriting workflows

### 4. **Production-Ready Infrastructure**
- **Challenge**: Building a scalable, maintainable, and fault-tolerant system ready for enterprise customers
- **Solution**: Containerized application with Docker, deployed on Digital Ocean with Caddy reverse proxy, CI/CD with GitHub Actions, optimistic uploads, and async processing pipelines
- **Result**: Robust production system that handled enterprise-level loads during private beta with minimal downtime

## Tech Stack

### Backend
- FastAPI (Python)
- LangChain for coordinating LLMs
- PyMuPDF for reading docs
- Redis for caching
- Celery + Redis for bg workers
- OpenPyXl for working with excel files
- Supabase S3 for storage
- Supabase for DB
- Stripe for billing

### Frontend
- Next.js (TypeScript)
- Zustand for state management
- Tailwind CSS
- AG-grid for table views
- Shad-cn / radix for primitives
- Supabase auth

### Infra
- Docker
- Digital Ocean
- Caddy
- Cloudflare
- Github actions for ci/cd

## System Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js App]
    end

    subgraph "API Layer"
        B[FastAPI Routes]
    end

    subgraph "Orchestration Layer"
        C[Upload Orchestrator]
        D[Deal Orchestrator]
        E[Billing Orchestrator]
        F[Pipeline Orchestrator]
    end

    subgraph "Services"
        G[Stripe, Document Processing, Caching, DB, Storage]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F

    C --> G
    D --> G
    E --> G
    F --> G
```

## Architecture

### 1. Backend Architecture

The backend is organized as follows:
- **Routes** → **Orchestrators** → **Services**

The routes are very thin and are just responsible for passing in data from the request into the orchestrator.

Orchestrators are responsible for coordinating between various services.

Each service is pure so it can be independently tested and used in various workflows. There is no overlap between services.

I decided on this modular architecture with orchestrators calling services so that eventually we could run the "AI-enabled" workflows as individual tool calls for an agentic system. The orchestrator-centered architecture lets us have a lot of flexibility in how we use all the functionalities defined in the services.

### 2. Frontend Architecture

The frontend uses feature-based grouping of logic.

All "pre-auth" (ie landing/sign-in/pricing) is located in a root directory called "marketing" and the rest of the features are in their respective directories in "features".

All API actions are defined in `@/lib/api` so we have a central directory of what is possible from the frontend.

App-wide components and all primitives are located in `@/components`. This includes custom viewers for PDF and Excel documents. My favorite component is the OM viewer in `@/features/deals/summary`. It combines the custom PDF viewer with gesture handling and includes the classification tooltip which connects page numbers to the page numbers of relevant information that we derived using an LLM workflow.

For state management, we're using Zustand stores. These are mostly defined at the feature level so that relevant information is retained across the lifespan of a workflow. See `@/features/verification/store` for an example of how I structured the store (actions, selectors, types, and store).

Using tailwind for styling due to simplicity. Using OKLCH values for colors because they're cool.

### 3. Deployment Infrastructure

Originally started by running the backend and frontend as two services on Render. When I had more time, moved over to two containers deployed on a single DO droplet (never needed more because we didn't end up going past the private beta). Using caddy for reverse proxy so the ports aren't exposed and then have cloudflare proxy set up on DNS. Using github actions to deploy.
