/**
 * SEO Health Check Script
 * Run: node scripts/seo-check.js
 * 
 * Validates SEO implementation and provides recommendations
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkExists(filePath, name) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${name} exists`, 'green');
    return true;
  } else {
    log(`✗ ${name} missing`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, name) {
  const fullPath = path.join(__dirname, '..', dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath);
    if (files.length > 0) {
      log(`✓ ${name} exists with ${files.length} items`, 'green');
      return true;
    } else {
      log(`⚠ ${name} exists but is empty`, 'yellow');
      return false;
    }
  } else {
    log(`✗ ${name} missing`, 'red');
    return false;
  }
}

function checkEnvVar(varName) {
  // Check .env.local
  const envPath = path.join(__dirname, '..', 'turn-one-client', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes(varName)) {
      log(`✓ ${varName} configured`, 'green');
      return true;
    }
  }
  log(`✗ ${varName} not configured`, 'red');
  return false;
}

async function runChecks() {
  log('\n========================================', 'cyan');
  log('Turn One - SEO Health Check', 'cyan');
  log('========================================\n', 'cyan');

  let score = 0;
  const maxScore = 20;

  // 1. Core SEO Files
  log('1. Core SEO Implementation:', 'blue');
  if (checkExists('turn-one-client/lib/seo.ts', 'SEO Configuration')) score++;
  if (checkExists('turn-one-client/app/sitemap.ts', 'Sitemap Generator')) score++;
  if (checkExists('turn-one-client/app/robots.ts', 'Robots.txt')) score++;
  if (checkExists('turn-one-client/components/seo/json-ld.tsx', 'JSON-LD Component')) score++;

  // 2. SEO Components
  log('\n2. SEO Components:', 'blue');
  if (checkExists('turn-one-client/components/seo/breadcrumb.tsx', 'Breadcrumb Component')) score++;
  if (checkExists('turn-one-client/lib/seo-utils.ts', 'SEO Utilities')) score++;

  // 3. Page Metadata
  log('\n3. Page-Specific SEO:', 'blue');
  if (checkExists('turn-one-client/app/(site)/home/metadata.ts', 'Home Metadata')) score++;
  if (checkExists('turn-one-client/app/(dashboard)/dashboard/metadata.ts', 'Dashboard Metadata')) score++;
  if (checkExists('turn-one-client/app/(dashboard)/live/metadata.ts', 'Live Metadata')) score++;
  if (checkExists('turn-one-client/app/(dashboard)/games/metadata.ts', 'Games Metadata')) score++;

  // 4. Images & Assets
  log('\n4. Images & Assets:', 'blue');
  if (checkDirectory('turn-one-client/public/og-images', 'OG Images Directory')) score++;
  if (checkExists('turn-one-client/public/manifest.json', 'PWA Manifest')) score++;

  // 5. Configuration
  log('\n5. Configuration:', 'blue');
  if (checkExists('turn-one-client/next.config.ts', 'Next.js Config with SEO')) score++;
  if (checkExists('docs/SEO_IMPLEMENTATION_GUIDE.md', 'SEO Documentation')) score++;

  // 6. Environment Variables
  log('\n6. Environment Variables:', 'blue');
  const hasEnv = checkExists('turn-one-client/.env.local', '.env.local file');
  if (hasEnv) {
    if (checkEnvVar('NEXT_PUBLIC_SITE_URL')) score++;
  } else {
    log('✗ Create .env.local file first', 'red');
  }

  // 7. Additional Checks
  log('\n7. Additional Files:', 'blue');
  if (checkExists('SEO_QUICK_START.md', 'Quick Start Guide')) score++;
  
  // Calculate percentage
  const percentage = Math.round((score / maxScore) * 100);
  
  // Final Score
  log('\n========================================', 'cyan');
  log(`SEO Implementation Score: ${score}/${maxScore} (${percentage}%)`, 
    percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  log('========================================\n', 'cyan');

  // Recommendations
  if (percentage < 100) {
    log('📋 Recommendations:', 'yellow');
    
    if (!fs.existsSync(path.join(__dirname, '..', 'turn-one-client', '.env.local'))) {
      log('  • Create .env.local file with required environment variables', 'yellow');
    }
    
    const ogPath = path.join(__dirname, '..', 'turn-one-client', 'public', 'og-images');
    if (!fs.existsSync(ogPath) || fs.readdirSync(ogPath).length < 2) {
      log('  • Create Open Graph images (1200x630px) for social sharing', 'yellow');
    }
    
    const iconsPath = path.join(__dirname, '..', 'turn-one-client', 'public', 'icons');
    if (!fs.existsSync(iconsPath)) {
      log('  • Create PWA icons in various sizes', 'yellow');
    }
    
    log('  • Review SEO_QUICK_START.md for immediate actions', 'yellow');
    log('  • Review docs/SEO_IMPLEMENTATION_GUIDE.md for complete guide\n', 'yellow');
  } else {
    log('🎉 SEO implementation is complete!', 'green');
    log('📚 Next steps:', 'cyan');
    log('  • Create OG images and PWA icons', 'cyan');
    log('  • Deploy to production', 'cyan');
    log('  • Submit to Google Search Console', 'cyan');
    log('  • Start creating content\n', 'cyan');
  }
}

// Run checks
runChecks().catch(console.error);
