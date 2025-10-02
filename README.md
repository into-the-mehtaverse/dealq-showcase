# DealQ Monorepo

Welcome to DealQ, the AI workflow platform for commercial real estate investors.

As the sole technical co-founder, I architected this codebase into production, from schema design to web app design to infra, and it was being used by multiple enterprise customers during our private beta. It was built with scale and future feature shipments in mind. The company has since winded down and I am no longer shipping feature updates.

I've stripped out sensitive IP including prompts in this sanitized codebase which exists for the purposes of showcasing my work. Below I'll walk you through the stack, architectural choices I made, and where the issues / areas of improvement are here.

TECH STACK:

Backend:
FastAPI (Python)
LangChain for coordinating LLMs
PyMuPDF for reading docs
Redis for caching
Celery + Redis for bg workers
OpenPyXl for working with excel files
Supabase S3 for storage
Supabase for DB
Stripe for billing


Frontend:
Next.js (TypeScript)
Zustand for state management
Tailwind CSS
AG-grid for table views
Shad-cn / radix for primitives
Supabase auth

Infra:
Docker
Digital Ocean
Caddy
Cloudfare

CI/CD:
Github Actions
