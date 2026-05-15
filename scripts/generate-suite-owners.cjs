/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Generate suite-owners.generated.json
 *
 * Analyzes git history to determine the creator of each .cy.ts test file
 * and assigns ownership based on .github/CODEOWNERS.
 *
 * Strategy:
 * 1. Prefers assigning files to their original creators (if listed in CODEOWNERS)
 * 2. Distributes remaining files evenly among all owners
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const TARGET_DIR = path.join(ROOT, 'src', 'data')
const TARGET_FILE = path.join(TARGET_DIR, 'suite-owners.generated.json')

const EMAIL_FALLBACK = {
  'efrem.bonfiglio@beefree.io': 'efrem-bonfiglio',
  'gaia.torti@beefree.io': 'gaiatorti',
  'francesco.meli@beefree.io': 'pinkynrg',
  'davide.gaggero@beefree.io': 'davidesamp',
  'alexandre.madurell@beefree.io': 'amadurell-bee',
  'carla.soloperto@beefree.io': 'carlasoloperto',
  'davide.ponti@beefree.io': 'davide-ponti',
  'ivan.lori@protonmail.com': 'ivanlori',
}

function getCodeowners() {
  const filePath = path.join(ROOT, '.github', 'CODEOWNERS')
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ownerLine = content.split('\n').find(l => l.trim().startsWith('*'))
    if (ownerLine) {
      return ownerLine.trim().split(/\s+/).filter(u => u.startsWith('@')).map(u => u.substring(1))
    }
  } catch { /* ignore */ }
  return []
}

function buildNameToGithubMap() {
  const nameToGithub = {}
  const githubToNames = {}
  try {
    const result = execSync('git log --all --format="%an|%ae"', { encoding: 'utf-8' })
    const lines = result.trim().split('\n')
    const ghRe = /\d+\+([^@]+)@users\.noreply\.github\.com/

    lines.forEach(line => {
      if (!line.includes('|')) return
      const [name, email] = line.split('|', 2)
      const m = ghRe.exec(email)
      if (m) {
        if (!githubToNames[m[1]]) githubToNames[m[1]] = new Set()
        githubToNames[m[1]].add(name)
      }
    })

    lines.forEach(line => {
      if (!line.includes('|')) return
      const [name, email] = line.split('|', 2)
      const m = ghRe.exec(email)
      if (m) {
        nameToGithub[name] = m[1]
      } else if (EMAIL_FALLBACK[email]) {
        nameToGithub[name] = EMAIL_FALLBACK[email]
      } else {
        const found = Object.entries(githubToNames).find(([, names]) => names.has(name))
        if (found) nameToGithub[name] = found[0]
      }
    })
  } catch { /* git unavailable */ }
  return nameToGithub
}

function getCyFiles() {
  try {
    const result = execSync('find cypress/e2e -name "*.cy.ts" -type f', { encoding: 'utf-8' })
    return result.trim().split('\n')
      .sort((a, b) => a.localeCompare(b))
      .filter(f => !f.includes('visualTesting'))
  } catch { return [] }
}

function getPrimaryAuthor(filePath) {
  try {
    const result = execSync(`git log --follow --format=%an --reverse -- "${filePath}"`, { encoding: 'utf-8' })
    const lines = result.trim().split('\n')
    return lines[0] || null
  } catch { return null }
}

function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true })

  const codeowners = getCodeowners()
  if (codeowners.length === 0) {
    console.warn('[suite-owners] no CODEOWNERS found; writing empty map')
    fs.writeFileSync(TARGET_FILE, '{}\n')
    console.log(`[suite-owners] wrote ${TARGET_FILE}`)
    return
  }

  const nameToGithub = buildNameToGithubMap()
  const cyFiles = getCyFiles()

  if (cyFiles.length === 0) {
    console.warn('[suite-owners] no .cy.ts files found; writing empty map')
    fs.writeFileSync(TARGET_FILE, '{}\n')
    console.log(`[suite-owners] wrote ${TARGET_FILE}`)
    return
  }

  const totalFiles = cyFiles.length
  const numOwners = codeowners.length
  const targetPerOwner = Math.floor(totalFiles / numOwners)
  const maxPerOwner = targetPerOwner + (totalFiles % numOwners > 0 ? 1 : 0)

  console.error(`[suite-owners] ${totalFiles} files, ${numOwners} owners (~${targetPerOwner} each)`)

  // Cache authors
  const fileAuthors = {}
  cyFiles.forEach(f => { fileAuthors[f] = getPrimaryAuthor(f) })

  // Pass 1: assign to creators
  const creatorMap = {}
  const creatorFiles = {}
  codeowners.forEach(o => { creatorFiles[o] = [] })

  cyFiles.forEach(f => {
    const author = fileAuthors[f]
    const gh = author ? nameToGithub[author] : null
    if (gh && codeowners.includes(gh)) {
      creatorMap[f] = gh
      creatorFiles[gh].push(f)
    }
  })

  // Pass 2: distribute fairly
  const finalAssignments = {}
  const ownerCount = {}
  codeowners.forEach(o => { ownerCount[o] = 0 })

  cyFiles.forEach(f => {
    const creator = creatorMap[f]
    if (creator && creatorFiles[creator].length <= maxPerOwner) {
      finalAssignments[f] = creator
      ownerCount[creator]++
    }
  })

  const remaining = cyFiles.filter(f => !finalAssignments[f])
  remaining.forEach(f => {
    const minOwner = Object.keys(ownerCount).reduce((min, o) => ownerCount[o] < ownerCount[min] ? o : min)
    finalAssignments[f] = minOwner
    ownerCount[minOwner]++
  })

  // Build output
  const output = {}
  cyFiles.forEach(f => {
    const owner = finalAssignments[f]
    const author = fileAuthors[f]
    const creator = author ? nameToGithub[author] || author : 'unknown'
    const cleanPath = f.replace('cypress/e2e/', '')
    output[cleanPath] = { owner, creator }
  })

  fs.writeFileSync(TARGET_FILE, JSON.stringify(output, null, 2) + '\n')
  console.log(`[suite-owners] wrote ${TARGET_FILE} (${Object.keys(output).length} entries)`)
}

main()
