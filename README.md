# SatyamVerify — Deepfake-Resistant Digital Provenance & Verification Platform

A national-scale digital provenance and cryptographic verification platform that empowers authorized government publishers to digitally sign and register authentic media (images, audio, video, PDF documents, and official statements) while enabling citizens to verify media authenticity instantly through WhatsApp and the public web portal.

---

## Production Deployments & Live URLs

* **Public Web Portal**: [https://satyamorigin.online](https://satyamorigin.online) · [https://www.satyamorigin.online](https://www.satyamorigin.online)
* **Production API & Webhook**: [https://api.satyamorigin.online](https://api.satyamorigin.online)
* **Meta WhatsApp Provenance Bot**: `+91 9288532901` ([Direct WhatsApp Launch](https://wa.me/919288532901?text=Verify))

---

## Problem & Solution Overview

In an era of generative AI deepfakes, synthetic voice clones, and viral misinformation, visual plausibility is no longer evidence of authenticity. 

**SatyamVerify** introduces an end-to-end cryptographic provenance pipeline:
1. **At Publication (Who & When)**: Government ministries and authorized publishers cryptographically sign original media using asymmetric keys (Ed25519), generate canonical provenance manifests, and anchor immutable blocks to a chronological hash-chain ledger.
2. **At Consumption (Verification for Citizens)**: Citizens send suspicious files or statements directly via WhatsApp or upload them to the web portal. The system computes exact cryptographic digests, perceptual structural hashes, and acoustic waveforms, matching them against the national ledger in milliseconds.

---

## 5-Pillar Cryptographic Verification Engine

```
                   Submitted Media (Video / Audio / PDF / Text)
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
    [ SHA-256 Hashing ]     [ Perceptual Hashing ]    [ Acoustic Fingerprinting ]
    Bit-level exact match   pHash/dHash visual match  13-MFCC + 12-Chroma vector
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                        [ Ed25519 Digital Signature ]
                        Cryptographic non-repudiation
                                       │
                                       ▼
                         [ Provenance Manifest & Ledger ]
                         Immutable hash-chain verification
```

1. **SHA-256 Bit-Level Matching**: FIPS 180-4 compliant streaming digests ensuring byte-for-byte authenticity against registry-anchored originals.
2. **Perceptual Hashing (pHash & dHash)**: Visual structural fingerprinting resilient to format transcoding, dimension scaling, and social media compression algorithms.
3. **Acoustic Fingerprinting (MFCC & Chroma)**: 13-MFCC and 12-chroma acoustic waveform vector extraction for voice clone detection and speech broadcast matching.
4. **Ed25519 Asymmetric Digital Signatures**: High-speed, tamper-proof cryptographic signatures guaranteeing publisher non-repudiation and origin validation.
5. **Immutable Hash-Chain Ledger**: Chronologically anchored append-only block ledger linking each certified publication back to the genesis block.
6. **Revocation & Supersession Engine**: Real-time validation preventing the circulation of retracted, outdated, or revoked official announcements.

### Citizen-Facing Verdicts

| Verdict | Title | Citizen Meaning |
| :--- | :--- | :--- |
| `VERIFIED` | **Official Content Verified** | Exact or authentic perceptual match to an official government publication with valid signature. |
| `SUSPICIOUS` | **Potential Deepfake / Modified Content** | High perceptual similarity to official content, but structural alterations or anomalies detected. |
| `UNSIGNED` | **No Official Provenance Record Found** | No matching cryptographic provenance or publisher signature found in the national registry. |
| `PROVEN_INVALID` | **Invalid / Revoked Official Content** | Content matches an announcement that has been officially retracted, revoked, or superseded. |

---

## User Interfaces & Portals

1. **Public Citizen Portal (`/`)**:
   - Modern glassmorphic verification interface supporting Video, Audio, PDF, and Text verification.
   - Citizen-friendly result presentation via `CitizenVerificationResult` answering **What** was detected, **Why** (plain-language explanation), **Who** published it, and **How confident** the system is.
   - Internal cryptographic details (raw SHA-256 hex strings, PEM keys, Base64 signatures, block IDs) are strictly suppressed for public users.
2. **WhatsApp Provenance Bot**:
   - Seamless citizen onboarding via WhatsApp (`+91 9288532901`).
   - "Verdict First, Proof on Tap" design delivering instant verdicts with clear context.
3. **Publisher Portal (`/dashboard`)**:
   - Content registration & media ingestion.
   - Primary and secondary Ed25519 cryptographic key management.
   - Provenance manifest generation and digital signing.
4. **Admin Oversight Portal (`/admin`)**:
   - System audit logging and user management.
   - Publisher verification and credential lifecycle management.
   - Revocation and ledger integrity monitoring.

---

## AWS Production Architecture

The production environment is hosted entirely on **Amazon Web Services (AWS)** using a secure, highly available architecture in the `ap-south-1` (Mumbai) region:

```
                              [ Citizens & WhatsApp Users ]
                                            │
                               (Meta WhatsApp Cloud API)
                                            │
            ┌───────────────────────────────┴───────────────────────────────┐
            │                                                               │
            ▼                                                               ▼
   [ AWS Amplify CDN ]                                        [ Application Load Balancer ]
  https://satyamorigin.online                                 https://api.satyamorigin.online
  (Next.js Static Frontend)                                                 │ (HTTPS / ACM TLS)
                                                                            ▼
                                                            ┌───────────────────────────────┐
                                                            │    Amazon ECS (AWS Fargate)   │
                                                            │   FastAPI Backend (Docker)    │
                                                            └───────┬───────────────┬───────┘
                                                                    │               │
                                   ┌────────────────────────────────┼───────────────┴────────────────────┐
                                   │                                │                                    │
                                   ▼                                ▼                                    ▼
                        [ Amazon RDS PostgreSQL ]        [ Amazon ElastiCache Redis ]         [ Amazon S3 Official Originals ]
                         (Ledger & Credentials)           (Sliding Window Rate Limit)          (VPC Gateway Endpoint)
                                   │                                │                                    │
                        [ AWS Secrets Manager ]          [ Amazon CloudWatch Logs ]           [ Amazon ECR Container Registry ]
```

### Infrastructure Details

* **Frontend Hosting**: **AWS Amplify** hosting the statically exported Next.js application with automatic CI/CD from `main` branch pushes and global CDN edge caching.
* **Backend Compute**: **Amazon Elastic Container Service (ECS)** running containerized FastAPI / Uvicorn on **AWS Fargate** serverless compute. Container images are stored in **Amazon Elastic Container Registry (ECR)**.
* **Ingress & SSL Termination**: **Application Load Balancer (ALB)** handling public HTTPS traffic with TLS certificates managed through **AWS Certificate Manager (ACM)**.
* **Database**: **Amazon RDS for PostgreSQL** in private database subnets storing publisher profiles, credentials, provenance manifests, and hash-chain blocks.
* **In-Memory Caching**: **Amazon ElastiCache for Redis** in private subnets providing sliding-window rate limiting, session verification, and token management.
* **Object Storage**: **Amazon S3** (`satyam-verify-official-152732246723`) for permanent, immutable storage of official original publisher media, accessed directly via **VPC Gateway Endpoints**.
* **Secrets & Observability**: **AWS Secrets Manager** for secure production secret injection and **Amazon CloudWatch** for container log aggregation and monitoring.
* **VPC Networking**:
  * Multi-AZ custom Virtual Private Cloud (VPC).
  * ALB operates in public subnets on port 443.
  * ECS Fargate tasks run in public subnets with public IP assignment for direct outbound communication with Meta/WhatsApp Cloud APIs (eliminating NAT Gateway overhead).
  * Inbound access to ECS container port 8000 is restricted strictly to the ALB Security Group.
  * RDS PostgreSQL and ElastiCache Redis are isolated in private subnets, accepting traffic exclusively from the ECS Backend Security Group.

---

## Technology Stack

* **Backend**: Python 3.12, FastAPI 0.104, Uvicorn (ASGI), Pydantic v2, SQLAlchemy 2.0, Alembic, Boto3.
* **Computer Vision & Audio**: OpenCV (`opencv-python-headless`), Pillow, ImageHash, Librosa, SoundFile, FFmpeg, PyPDF.
* **Cryptography & Security**: Cryptography (Ed25519), Python-Jose (JWT), Passlib (Bcrypt), PyOTP (MFA).
* **Database & Cache**: PostgreSQL 15, Redis 7 (Redis-py).
* **Frontend**: Next.js 16 (Turbopack, Static Export), React 19, TypeScript, Tailwind CSS, Lucide Icons, Sonner.
* **Cloud & DevOps**: AWS (Amplify, ECS Fargate, ECR, ALB, RDS, ElastiCache, S3, Secrets Manager, CloudWatch, ACM), Docker.
* **Messaging**: Meta WhatsApp Cloud API (Graph API v18.0 Webhook).

---

## Local Development Setup

### 1. Prerequisites
* Docker & Docker Compose
* Python 3.11 or 3.12
* Node.js 18+ or 20+

### 2. Start Local Database & Cache
```bash
# Start PostgreSQL and Redis containers locally
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API will be accessible at: `http://localhost:8000` (Interactive docs: `http://localhost:8000/docs`)

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:3000`

---

## Running Automated Tests

The test suite runs with complete test database isolation:
```bash
cd backend
python -m pytest -v
```

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints (verify, auth, publisher, credentials, webhook)
│   │   ├── core/            # Security, hashing, crypto (Ed25519, pHash, MFCC), timeout
│   │   ├── models/          # SQLAlchemy ORM models (Publisher, Content, Block, Audit)
│   │   ├── schemas/         # Pydantic schemas for request/response contracts
│   │   ├── services/        # Verification service, WhatsApp handler, S3 storage
│   │   ├── config.py        # Environment & AWS configuration
│   │   └── main.py          # FastAPI application initialization & middleware
│   ├── tests/               # Pytest automated test suite
│   ├── Dockerfile           # Production multi-stage Dockerfile
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (Landing page, Login, Dashboards)
│   │   ├── components/      # UI Components (CitizenVerificationResult, EvidenceMatrix, Header)
│   │   ├── services/        # API client and Zustand auth store
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets & logos
│   ├── package.json         # Node.js dependencies
│   └── next.config.mjs      # Next.js configuration (static export)
├── docker-compose.yml       # Local development infrastructure
└── README.md                # Project documentation
```

---

## License

This project is licensed under the Apache 2.0 License.
