# FundFoundEasy 🔨

A real-time online auction platform built with Spring Boot, PostgreSQL, and vanilla JavaScript.

**🌐 Live Demo:** [https://fundfoundeasy-production.up.railway.app](https://fundfoundeasy-production.up.railway.app)

> ⏱️ **Note:** The app is hosted on Railway's free tier. If idle, the first request may take 20–30 seconds while the container wakes up.

---

## 📖 About

FundFoundEasy is a full-stack auction engine that combines classic bidding with modern features:
automatic proxy bidding, live WebSocket updates, anti-sniping protection, and a role-based admin dashboard.
Users can browse live auctions, place bids, and track their wins — while admins manage the catalogue.

---

## ✨ Features

### For Users
- 🔐 **JWT authentication** — register, log in, verify via email
- 🔑 **Password reset** — email-based reset flow with 30-minute token expiry
- 🔨 **Real-time bidding** — live price updates over WebSocket (STOMP)
- 🤖 **Proxy bidding engine** — enter your max, the system bids on your behalf
- ⏱️ **Anti-sniping protection** — auctions extend by 3 minutes if a bid lands in the final 2
- 💼 **My Bids page** — track auctions you're winning, outbid on, won, or lost
- 👤 **Profile page** — update email, change password
- 🔎 **Search** — search by title/description
- 🎛️ **Filters** — by status, price range, minimum increment
- 📊 **Sort** — by ending soonest, newest, price, or bidder count

### For Admins
- 🛠️ **Full auction CRUD** — create, edit, delete auctions
- 👥 **User management** — view users, promote/demote roles
- 📈 **Dashboard** — one place to manage everything

---

## 📸 Screenshots

### Live Auctions
![Homepage](docs/screenshots/01-homepage.png)

### Search
![Search](docs/screenshots/02-search.png)

### Admin Dashboard
![Admin](docs/screenshots/03-admin.png)

### Create Auction Modal
![Modal](docs/screenshots/04-modal.png)

### My Bids
![My Bids](docs/screenshots/05-my-bids.png)

### Login
![Login](docs/screenshots/06-login.png)

---

## 🛠️ Tech Stack

**Backend**
- Java 17
- Spring Boot 3.3
- Spring Security + JWT (jjwt 0.12)
- Spring Data JPA / Hibernate
- Spring WebSocket (STOMP + SockJS)
- Spring Retry (for optimistic-lock retries on bids)
- JavaMail (SMTP)
- Maven

**Database**
- PostgreSQL
- Flyway-free — Hibernate `ddl-auto=update` for schema

**Cache**
- Spring Cache abstraction (in-memory by default; Redis-swappable)

**Frontend**
- Vanilla JavaScript (ES modules)
- Single-page app with hash-based routing
- SockJS + STOMP for live bid updates
- No build step, no framework — just clean HTML/CSS/JS

**Deployment**
- Docker (multi-stage build)
- Railway (app + Postgres)

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────┐
│ Browser (SPA) │
│ Vanilla JS • ES modules • hash router • WebSocket │
└────────────────────┬────────────────────────────────────┘
│
│ REST (JSON) + STOMP (WebSocket)
▼
┌─────────────────────────────────────────────────────────┐
│ Spring Boot App │
│ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│ │Controller │→ │ Service │→ │ Repository │ │
│ │ (REST) │ │ (Business) │ │ (JPA) │ │
│ └────────────┘ └────────────┘ └──────┬───────┘ │
│ │ │
│ ┌───────────────┐ ┌─────────────────┐ │ │
│ │ JWT Filter │ │ WebSocket broker│ │ │
│ └───────────────┘ └─────────────────┘ │ │
└──────────────────────────────────────────┼──────────────┘
│
▼
┌─────────────────┐
│ PostgreSQL │
└─────────────────┘


---

## 🚀 Running Locally

### Prerequisites
- Java 17+
- Maven 3.9+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/MichaelLarryOchieng/FundFoundEasy.git
cd FundFoundEasy
2. Set up PostgreSQL
bash
sudo -u postgres psql
CREATE DATABASE fundfoundeasy_db;
ALTER USER postgres WITH PASSWORD 'your-password';
\q
3. Configure local properties
Create src/main/resources/application-local.properties:

properties
spring.datasource.password=your-password
spring.mail.username=your-mailtrap-username
spring.mail.password=your-mailtrap-password
4. Run
bash
./mvnw spring-boot:run
Open http://localhost:8080

🔑 Test Credentials
Role	Username	Password
Admin	admin	ChangeMeInProduction!2026
User	Create your own via /register	—
Note: In the deployed demo, AUTO_VERIFY=true means new registrations are immediately usable. For real deployments, set AUTO_VERIFY=false and configure SMTP to send verification emails.

🔐 Environment Variables
Variable	Purpose	Example
SPRING_DATASOURCE_URL	JDBC URL	jdbc:postgresql://host:5432/db
SPRING_DATASOURCE_USERNAME	DB user	postgres
SPRING_DATASOURCE_PASSWORD	DB password	***
JWT_SECRET	JWT signing key (32+ chars)	***
APP_BASE_URL	Public URL for email links	https://...railway.app
MAIL_HOST	SMTP host	sandbox.smtp.mailtrap.io
MAIL_PORT	SMTP port	2525
MAIL_USERNAME	SMTP user	***
MAIL_PASSWORD	SMTP password	***
AUTO_VERIFY	Skip email verification	true (demo) / false (prod)
ADMIN_USERNAME	Seed admin user	admin
ADMIN_PASSWORD	Seed admin password	***
📁 Project Structure
text
FundFoundEasy/
├── src/main/
│   ├── java/com/MLO/FundFoundEasy/
│   │   ├── config/          # SecurityConfig, WebSocketConfig, DataSeeder, HealthController
│   │   ├── controller/      # REST endpoints
│   │   ├── dto/             # Request/response records
│   │   ├── model/           # JPA entities
│   │   ├── repository/      # Spring Data JPA repos
│   │   ├── security/        # JwtUtils, JwtAuthenticationFilter
│   │   └── service/         # Business logic (AuctionService, EmailService)
│   └── resources/
│       ├── static/          # Frontend SPA (HTML/CSS/JS)
│       │   ├── js/components/   # Login, AuctionList, AdminDashboard, etc.
│       │   └── js/services/     # api.js, ws.js
│       ├── application.properties
│       └── application-prod.properties
├── Dockerfile
├── pom.xml
└── README.md
📝 License
MIT — free to use, learn from, and modify.

📬 Contact
Michael Larry Ochieng

GitHub: @MichaelLarryOchieng

Email: ochiengmichaellarry@gmail.com

⭐ If you found this project useful, consider giving it a star!

text

---

## 🚀 Step 3 — Push to GitHub

```bash
cd /home/michael/Downloads/FundFoundEasy

git add README.md docs/
git commit -m "Add README with screenshots and project documentation"
git push