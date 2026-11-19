# Digital Legacy Manager - Production Deployment Guide

This guide details deployment of the **Digital Legacy Manager** across cloud hosting providers.

---

## 1. Prerequisites
- **Backend Runtime:** Java JDK 21+ & Maven 3.9+
- **Frontend Runtime:** Node.js v18+ & npm 9+
- **Database:** Managed MySQL 8.0 instance (AWS RDS, PlanetScale, Railway, Aiven, or DigitalOcean)
- **Object Storage / Disk:** Persistent block storage volume or AWS S3

---

## 2. Environment Variables Configuration

Set these environment variables in your production environment (e.g. Railway, Render, Docker):

### Backend Configuration
| Variable Name | Description | Example |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `prod` |
| `PORT` | Web server listening port | `8080` |
| `SPRING_DATASOURCE_URL` | JDBC MySQL connection URL | `jdbc:mysql://db.host:3306/digital_legacy_manager?useSSL=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `db_user` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `StrongSecretPassword123!` |
| `APP_JWT_SECRET` | 256-bit+ Base64 or string secret | `c2VjdXJlX2p3dF9zZWNyZXRfa2V5X2Zvcg==` |
| `APP_JWT_EXPIRATION_MS` | JWT expiration in milliseconds | `86400000` (24h) |
| `APP_SECURITY_AES_SECRET_KEY` | 32-character AES-256 encryption key | `0123456789abcdef0123456789abcdef` |
| `APP_STORAGE_UPLOAD_DIR` | Directory for encrypted files | `/data/uploads/documents` |
| `APP_CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `https://your-frontend.vercel.app` |

### Frontend Configuration
| Variable Name | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Production Backend API URL | `https://api.yourdomain.com/api` |

---

## 3. Database Migration with Flyway
When the Spring Boot application boots with profile `prod`, Flyway will automatically execute all versioned migrations (`V1__create_initial_schema.sql`, `V2__seed_master_data.sql`).

Ensure your MySQL user possesses permissions for:
`SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER`

---

## 4. Backend Deployment (Render / Railway / Docker)

### Dockerfile (Backend)
```dockerfile
# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
VOLUME /data/uploads/documents
COPY --from=build /app/target/digital-legacy-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

---

## 5. Frontend Deployment (Vercel / Netlify)

1. Connect your GitHub repository to Vercel or Netlify.
2. Root Directory: `digital-legacy-frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure SPA Fallback rule for React Router:

### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.yourdomain.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### `_redirects` (Netlify)
```
/api/*  https://api.yourdomain.com/api/:splat  200
/*      /index.html                           200
```

---

## 6. Post-Deployment Verification Checklist
- [ ] Connect to Admin Panel: `/admin/login` using seeded administrator credentials.
- [ ] Verify Dashboard metrics display live database aggregations.
- [ ] Register a new test user account at `/register`.
- [ ] Verify JWT token generation and access to User Panel: `/user/dashboard`.
- [ ] Upload an asset and assign a beneficiary.
- [ ] Submit an emergency access request and approve from Admin Panel.
