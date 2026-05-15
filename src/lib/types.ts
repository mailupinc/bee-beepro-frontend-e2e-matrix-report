export type SuiteOwner = {
  owner: string
  creator: string
}

export type SuiteOwnersMap = Record<string, SuiteOwner>

export type ReportKey = {
  date: string // YYYY-MM-DD
  time: string // HH-MM-SS
  s3Key: string
}

export type FilterLevel = {
  all: string[]
  available: string[]
}

export type FiltersResponse = {
  envs: string[]
  branches: FilterLevel
  specs: FilterLevel
  baseUrls: FilterLevel
}

export type ReportsQuery = {
  branch: string
  env: string
  spec: string
  baseUrl: string
  nReports: number
  search: string | null
  owners: string[] | null
}

export type TestCell = {
  failed: boolean
  pending: boolean
  skipped: boolean
}

export type TestRow = {
  testName: string
  filePath: string
  owner: string
  creator: string
  unstableRate: number
  runs: number
  failures: number
  pendings: number
  skips: number
  cells: Array<TestCell | null>
}

export type ReportMeta = {
  filename: string
  date: string
  time: string
  stats: {
    passes: number
    failures: number
    pending: number
    skipped: number
    tests: number
  }
}

export type ReportsResponse = {
  reports: ReportMeta[]
  rows: TestRow[]
  totals: {
    // Aggregated: unique tests classified by behavior across runs
    passingTests: number   // passed in ALL selected runs
    failingTests: number   // failed in at least 1 run
    // Summed: raw mochawesome stats totaled across selected reports
    sumPasses: number
    sumFailures: number
    sumPending: number
    sumSkipped: number
    sumTests: number
    totalReports: number
  }
}

// Minimal mochawesome shapes we care about
export type MochawesomeTest = {
  title: string
  state?: 'failed' | 'passed' | 'pending' | string
}

export type MochawesomeSuite = {
  title?: string
  file?: string
  fullFile?: string
  tests?: MochawesomeTest[]
  suites?: MochawesomeSuite[]
}

export type MochawesomeReport = {
  stats?: {
    tests?: number
    passes?: number
    pending?: number
    failures?: number
    skipped?: number
  }
  results: MochawesomeSuite[]
}
