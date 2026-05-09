import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Company } from '@prisma/client';
import crypto from 'crypto';

const COMPANIES_DIR = process.env.COMPANIES_DIR || '/opt/qrhujjat/companies';

function generateDockerCompose(company: Company): string {
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  return `version: '3.8'
services:
  frontend:
    image: node:20-alpine
    ports:
      - "${company.frontendPort}:3010"
    environment:
      VITE_API_URL: http://localhost:${company.backendPort}/api
    volumes:
      - ./frontend:/app
    command: sh -c "cd /app && npm run dev -- --host"
    restart: unless-stopped

  backend:
    image: node:20-alpine
    ports:
      - "${company.backendPort}:5000"
    environment:
      DATABASE_URL: postgresql://${company.dbUser}:${company.dbPassword}@db:5432/${company.dbName}
      JWT_SECRET: ${jwtSecret}
      PORT: 5000
    volumes:
      - ./backend:/app
    command: sh -c "cd /app && npm run dev"
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    ports:
      - "${company.dbPort}:5432"
    environment:
      POSTGRES_DB: ${company.dbName}
      POSTGRES_USER: ${company.dbUser}
      POSTGRES_PASSWORD: ${company.dbPassword}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
`;
}

function generateBackendEnv(company: Company): string {
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  return `DATABASE_URL=postgresql://${company.dbUser}:${company.dbPassword}@localhost:${company.dbPort}/${company.dbName}
JWT_SECRET=${jwtSecret}
PORT=5000
NODE_ENV=production
`;
}

function generateFrontendEnv(company: Company): string {
  return `VITE_API_URL=http://localhost:${company.backendPort}/api
`;
}

function generateNginxConfig(company: Company): string {
  const domain = company.domain || `${company.slug}.qrhujjat.uz`;
  return `server {
    listen 80;
    server_name ${domain};

    location /api/ {
        proxy_pass http://127.0.0.1:${company.backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:${company.frontendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
}

export async function provisionCompany(company: Company): Promise<void> {
  const companyDir = path.join(COMPANIES_DIR, company.slug);

  try {
    // 1. Create directory
    fs.mkdirSync(companyDir, { recursive: true });
    fs.mkdirSync(path.join(companyDir, 'frontend'), { recursive: true });
    fs.mkdirSync(path.join(companyDir, 'backend'), { recursive: true });

    // 2. Write docker-compose.yml
    const dockerCompose = generateDockerCompose(company);
    fs.writeFileSync(path.join(companyDir, 'docker-compose.yml'), dockerCompose, 'utf8');

    // 3. Write .env files
    fs.writeFileSync(path.join(companyDir, 'backend', '.env'), generateBackendEnv(company), 'utf8');
    fs.writeFileSync(path.join(companyDir, 'frontend', '.env'), generateFrontendEnv(company), 'utf8');

    // 4. Write nginx config
    const nginxConfig = generateNginxConfig(company);
    const nginxPath = `/etc/nginx/sites-available/${company.slug}`;
    const nginxEnabledPath = `/etc/nginx/sites-enabled/${company.slug}`;
    try {
      fs.writeFileSync(nginxPath, nginxConfig, 'utf8');
      // Create symlink if it doesn't exist
      if (!fs.existsSync(nginxEnabledPath)) {
        execSync(`ln -s ${nginxPath} ${nginxEnabledPath}`);
      }
    } catch (nginxError) {
      console.warn(`[Provisioning] Nginx config yozishda xato (root kerak bo'lishi mumkin):`, nginxError);
    }

    // 5. Start containers
    execSync(`docker-compose -f ${path.join(companyDir, 'docker-compose.yml')} up -d`, {
      stdio: 'inherit',
      timeout: 120000,
    });

    // 6. Run prisma migrate deploy inside backend container
    try {
      const containerName = `${company.slug}_backend_1`;
      execSync(`docker exec ${containerName} sh -c "cd /app && npx prisma migrate deploy"`, {
        stdio: 'inherit',
        timeout: 60000,
      });
    } catch (migrateError) {
      console.warn(`[Provisioning] Prisma migration xatosi:`, migrateError);
    }

    // 7. Create initial superadmin in company's DB
    try {
      const containerName = `${company.slug}_backend_1`;
      execSync(
        `docker exec ${containerName} sh -c "cd /app && node -e \\"const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const p=new PrismaClient();bcrypt.hash('admin123',10).then(h=>p.user.create({data:{email:'admin@${company.slug}.uz',password:h,name:'Admin',role:'SUPERADMIN'}})).then(()=>p.\$disconnect()).catch(console.error)\\""`,
        { stdio: 'inherit', timeout: 30000 }
      );
    } catch (adminError) {
      console.warn(`[Provisioning] Superadmin yaratishda xato:`, adminError);
    }

    // 8. Reload nginx
    try {
      execSync('nginx -s reload', { stdio: 'inherit' });
    } catch (nginxReloadError) {
      console.warn(`[Provisioning] Nginx reload xatosi:`, nginxReloadError);
    }

    console.log(`[Provisioning] ${company.slug} muvaffaqiyatli tayyor qilindi`);
  } catch (error) {
    console.error(`[Provisioning] ${company.slug} uchun xato:`, error);
    throw error;
  }
}

export async function stopCompany(slug: string): Promise<void> {
  const composePath = path.join(COMPANIES_DIR, slug, 'docker-compose.yml');
  try {
    execSync(`docker-compose -f ${composePath} stop`, {
      stdio: 'inherit',
      timeout: 60000,
    });
    console.log(`[Provisioning] ${slug} to'xtatildi`);
  } catch (error) {
    console.error(`[Provisioning] ${slug} to'xtatishda xato:`, error);
    throw error;
  }
}

export async function startCompany(slug: string): Promise<void> {
  const composePath = path.join(COMPANIES_DIR, slug, 'docker-compose.yml');
  try {
    execSync(`docker-compose -f ${composePath} start`, {
      stdio: 'inherit',
      timeout: 60000,
    });
    console.log(`[Provisioning] ${slug} ishga tushirildi`);
  } catch (error) {
    console.error(`[Provisioning] ${slug} ishga tushirishda xato:`, error);
    throw error;
  }
}

export async function removeCompany(slug: string): Promise<void> {
  const companyDir = path.join(COMPANIES_DIR, slug);
  const composePath = path.join(companyDir, 'docker-compose.yml');

  try {
    // Bring down containers and remove volumes
    if (fs.existsSync(composePath)) {
      execSync(`docker-compose -f ${composePath} down -v`, {
        stdio: 'inherit',
        timeout: 120000,
      });
    }

    // Remove company directory
    if (fs.existsSync(companyDir)) {
      fs.rmSync(companyDir, { recursive: true, force: true });
    }

    // Remove nginx config
    const nginxPath = `/etc/nginx/sites-available/${slug}`;
    const nginxEnabledPath = `/etc/nginx/sites-enabled/${slug}`;
    try {
      if (fs.existsSync(nginxEnabledPath)) fs.unlinkSync(nginxEnabledPath);
      if (fs.existsSync(nginxPath)) fs.unlinkSync(nginxPath);
      execSync('nginx -s reload', { stdio: 'inherit' });
    } catch (nginxError) {
      console.warn(`[Provisioning] Nginx config o'chirishda xato:`, nginxError);
    }

    console.log(`[Provisioning] ${slug} to'liq o'chirildi`);
  } catch (error) {
    console.error(`[Provisioning] ${slug} o'chirishda xato:`, error);
    throw error;
  }
}
