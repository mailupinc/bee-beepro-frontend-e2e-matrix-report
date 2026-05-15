/* eslint-disable @typescript-eslint/no-var-requires */
// Bridge: invoke the repo-root generateSuiteOwners.ts script and place the
// resulting suite-owners.json inside the Next.js src/data folder so it ships
// with the Vercel build. Falls back gracefully if git history is unavailable.

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const HERE = __dirname
const APP_ROOT = path.resolve(HERE, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const TARGET_DIR = path.join(APP_ROOT, 'src', 'data')
const TARGET_FILE = path.join(TARGET_DIR, 'suite-owners.generated.json')

const ensureTargetDir = () => {
  fs.mkdirSync(TARGET_DIR, { recursive: true })
}

const tryGenerate = () => {
  const script = path.join(REPO_ROOT, 'scripts', 'generateSuiteOwners.ts')
  if (!fs.existsSync(script)) return false
  try {
    execSync(`npx ts-node ${JSON.stringify(script)} ${JSON.stringify(TARGET_DIR)}`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    })
    const produced = path.join(TARGET_DIR, 'suite-owners.json')
    if (fs.existsSync(produced)) {
      fs.renameSync(produced, TARGET_FILE)
      return true
    }
  } catch (err) {
    console.warn('[suite-owners] generation failed, falling back to committed copy:', err.message)
  }
  return false
}

const fallbackCopy = () => {
  const committed = path.join(REPO_ROOT, 'suite-owners.json')
  if (fs.existsSync(committed)) {
    fs.copyFileSync(committed, TARGET_FILE)
    return true
  }
  return false
}

ensureTargetDir()
if (!tryGenerate() && !fallbackCopy()) {
  console.warn('[suite-owners] no source available; writing empty map')
  fs.writeFileSync(TARGET_FILE, '{}\n')
}
console.log(`[suite-owners] wrote ${TARGET_FILE}`)
