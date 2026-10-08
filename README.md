# Risk-Ume

## 1. Project Overview
Risk-Ume is a career intelligence and job-readiness platform that analyzes a user's resume, skills, ATS compatibility, GitHub developer activity, and related career evidence. It helps users understand their career and job readiness using multiple evidence sources rather than relying only on a resume.

## 2. Core Features
- Profile
- Resume upload & profile extraction
- Career Path
- Dashboard
- Risk Score
- ATS Optimizer
- Portfolio
- Developer Activity
- GitHub analysis
- Job Readiness Score
- Resume Builder
- History

## 3. GitHub Developer Activity
The platform integrates GitHub Developer Activity analysis:
* Users can enter a GitHub profile URL or username.
* The backend uses the GitHub REST API to fetch data.
* A server-side GITHUB_TOKEN can be configured through environment variables.
* The token is NOT exposed to the frontend.
* Authenticated GitHub API requests receive a higher API rate limit.
* Real GitHub accounts are analyzed using real GitHub data.
* API rate-limit and authentication errors are surfaced instead of silently generating fake scores.
* Demo accounts are explicitly limited to the following existing demo usernames: shadcn, acebook, student-demo.
* Demo data is clearly simulated/demo data.

## 4. Developer Activity Scoring
Developer Activity is scored across the following dimensions based on GitHub data:
* Recent Activity
* Commit Consistency
* Project Maintenance
* Contribution Volume
* Repository Quality

These dimensions are combined into an Overall Developer Activity Score.

## 5. Job Readiness Score
The Job Readiness Score combines skill evaluation with developer activity:
`	ext
Overall Job Readiness =
0.70 × Average Skill EWRS
+
0.30 × Developer Activity Score
`
- **Average Skill EWRS (70%)**: Represents the strength of the candidate's core skills based on their resume.
- **Developer Activity Score (30%)**: Represents the actual evidence of coding activity and project contributions.

GitHub analysis can dynamically update the developer activity component and therefore the final Job Readiness Score.

## Evidence-Weighted Relevance Score (EWRS)

Calculation: Our scoring engine uses a weighted polynomial function: 
`EWRS = (α × Claim_Relevance) + (β × Evidence_Confidence) - (γ × Skill_Decay_Penalty)`

Benchmark Scenario: Evaluated against a dataset of 50 paired profiles (Resumes + Simulated Portfolios). We measured the Spearman Rank Correlation between our automated score and a simulated "Human Hiring Manager" baseline. Traditional ATS keyword-matching achieved a 0.42 correlation. Our EWRS algorithm achieved a 0.86 correlation, proving it vastly outperforms legacy text parsers.

## Developer Activity & Evidence Engine (GitHub Auth)

Risk-Ume integrates directly with GitHub via OAuth to analyze a developer's real-world activity, pulling commit frequency, repository quality, and coding habits to supplement resume claims with hard evidence. (This is performed in our Dev Inspect section).

## 6. GitHub API Architecture
`	ext
Frontend
   ↓
Risk-Ume backend
   ↓
GitHub REST API
   ↓
GitHub profile/repository/activity data
   ↓
Developer Activity scoring
   ↓
Database persistence
   ↓
Job Readiness calculation
   ↓
Frontend
`

## 7. Environment Variables
The following environment variables are used in .env.local:

`env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# GitHub API Token (Optional)
GITHUB_TOKEN=your_github_personal_access_token
`

## 8. Installation
Install the project dependencies via npm:
`ash
npm install
`

## 9. Running the Project
Start the development server:
`ash
npm run dev
`

## 10. GitHub PAT Security
* Store GITHUB_TOKEN in .env.local or the appropriate ignored environment file.
* Never hardcode it.
* Never expose it through frontend variables.
* Never commit it to Git.
* .env* files are ignored except .env.example.
* If a token is accidentally exposed, revoke it and generate a new one.

## 11. Tech Stack
* **Frontend**: React, Vite, Tailwind CSS, Lucide React, Framer Motion
* **Backend**: Express (Node.js), TypeScript
* **Database/Auth**: Supabase
* **AI/ML**: Google Gemini
* **Document Parsing**: pdf-parse, mammoth

## 12. Project Structure
`	ext
Risk-Ume/
├── src/
│   ├── components/
│   ├── lib/
│   └── main.tsx
├── server.ts
├── package.json
├── README.md
└── ...
`

## 13. Current Limitations
* GitHub API rate limits affect unauthenticated usage.
* A GitHub PAT is recommended for reliable repeated analysis.
* Demo accounts use simulated data.
* Some analytical values should currently be treated as AI-generated indicators rather than statistically validated predictions.

## 14. Development Notes
* Keep GitHub tokens server-side.
* Maintain the distinction between real and demo GitHub data.
* Avoid unnecessary duplicate GitHub API calls.
* Keep user-specific GitHub analysis isolated.
* Preserve database persistence for historical tracking.

---

# Security

The application includes:

* Password hashing
* JWT authentication
* Protected API routes
* User-specific records
* Environment-based API configuration

For production deployment, additional security hardening would be required:

* Rate limiting
* Secure secret management
* Input validation
* API abuse protection
* Logging
* Monitoring
* Production database security
* Secure deployment configuration

---

# What I Learned

Risk-Ume was built as a practical learning project to understand how an AI idea can become a complete software system.

The project required learning across:

```text
Frontend Development
        |
        v
Backend Development
        |
        v
REST APIs
        |
        v
Database Design
        |
        v
Authentication
        |
        v
AI Integration
        |
        v
Data Modeling
        |
        v
Analytics
        |
        v
Product Design
        |
        v
Deployment
```

The biggest lesson was that building an AI product is not only about connecting an API to a model.

It also requires:

* User experience
* Backend architecture
* Database design
* Authentication
* Data persistence
* Structured AI output
* Analytics
* Visualization
* Error handling
* Evaluation
* Security
* Deployment

---

# Why Risk-Ume?

Most resume tools primarily answer:

> "How good is my resume?"

Risk-Ume attempts to answer:

> "Where is my resume vulnerable, why is it vulnerable, what skills am I missing, and what should I improve?"

The central idea is:

```text
Resume Scoring
      |
      v
Resume Intelligence
      |
      v
Career Risk
      |
      v
Skill Intelligence
      |
      v
Recommendations
      |
      v
Optimization
      |
      v
Continuous Improvement
```

---

# Future Vision

The long-term goal is to evolve Risk-Ume from a resume analyzer into a broader career intelligence system.

```text
                         CAREER INTELLIGENCE
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
          RESUME                SKILLS               ROLES
             |                    |                    |
             v                    v                    v
            ATS                  GAPS                 DEMAND
             |                    |                    |
             +--------------------+--------------------+
                                  |
                                  v
                           CAREER RISK
                                  |
                                  v
                         RECOMMENDATIONS
                                  |
                                  v
                         LEARNING ROADMAP
                                  |
                                  v
                         CAREER PROGRESS
```

The long-term direction is:

```text
RESUME
   |
   v
SKILLS
   |
   v
TARGET ROLES
   |
   v
MARKET REQUIREMENTS
   |
   v
SKILL GAPS
   |
   v
CAREER RISKS
   |
   v
RECOMMENDATIONS
   |
   v
LEARNING
   |
   v
IMPROVED RESUME
   |
   v
NEW ANALYSIS
```

---

# Project Status

## Development Scope

```text
Frontend
[####################] Active

Backend
[####################] Active

Database
[####################] Active

Authentication
[####################] Active

ATS Analysis
[####################] Implemented

Risk Engine
[##################..] Active Development

AI Evaluation
[###########.........] Improving

Production Readiness
[########............] Future Work
```

These indicators represent development scope and are not claims of model accuracy.

---

# Final Architecture

The entire idea of Risk-Ume can be summarized as:

```text
                         +----------------+
                         |     RESUME     |
                         +-------+--------+
                                 |
                                 v
                       +-------------------+
                       |    TARGET ROLE    |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |    RISK-UME APP   |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |    AI ANALYSIS    |
                       +---------+---------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
         +---------+        +---------+        +---------+
         |   ATS   |        |  SKILL  |        |  RISK   |
         +----+----+        +----+----+        +----+----+
              |                  |                  |
              +------------------+------------------+
                                 |
                                 v
                       +-------------------+
                       | RECOMMENDATIONS   |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       | RESUME OPTIMIZE   |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |   RE-ANALYSIS     |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |   BEFORE / AFTER  |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |     DASHBOARD     |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       |  CAREER INSIGHTS  |
                       +---------+---------+
                                 |
                                 +------------------+
                                                    |
                                                    v
                                               NEW RESUME
                                                    |
                                                    +----> REPEAT
```

---

# Risk-Ume

### Resume Intelligence → Career Risk → Skill Intelligence → Optimization → Continuous Improvement

---

# Authors
## Swayam Sreetam Das
## Divyansh Bhardwaj
## CHRIS SANJIV JOSEPH
## ARYA SAHU


First-year engineering student exploring:

* Artificial Intelligence
* Machine Learning
* Generative AI
* Full-Stack Development
* Data Analytics
* Software Engineering

Risk-Ume is one of my major learning projects and an attempt to build an AI product around a practical problem.

The project is still evolving, and the current implementation is a foundation for future improvements.

> Not finished. Not perfect. Still learning. Still building.

