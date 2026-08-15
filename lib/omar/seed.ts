/**
 * Seed dataset for OMAR v1.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND CONNECTION POINT
 * This file is the ONLY source of fake data in the app. Everything else reads
 * through `lib/omar/data.ts`. To go live, replace the exports here with real
 * queries — the shapes in `lib/omar/types.ts` are the contract.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Note that criterion signals are DERIVED from the underlying facts below
 * rather than hand-authored, so re-weighting the buy box on /thesis produces
 * genuinely different rankings.
 */

import {
  INDUSTRIES,
  MARKETING_MATURITY_LABELS,
  NOW,
  WEAK_DIGITAL_QUALITIES,
  WEBSITE_QUALITY_LABELS,
  daysAgo,
  daysFromNow,
  hoursAgo,
} from './config'
import type {
  ActivityEvent,
  AlertItem,
  Contact,
  CountyId,
  CriterionSignals,
  IndustryId,
  MarketStatus,
  MarketingMaturity,
  Note,
  OutreachTemplate,
  PipelineStatus,
  ProvenanceRow,
  ProviderId,
  Range,
  SavedSearch,
  ScoringRuleVersion,
  SourceStatus,
  SourcedValue,
  Target,
  Watchlist,
  WebsiteQuality,
} from './types'

/* ------------------------------------------------------------------ */
/* Ownership + demand taxonomies                                       */
/* ------------------------------------------------------------------ */

type OwnershipClass =
  | 'sole-proprietor'
  | 'family'
  | 'partnership'
  | 'esop'
  | 'holding-co'
  | 'pe-backed'
  | 'strategic'
  | 'unknown'

const OWNERSHIP: Record<
  OwnershipClass,
  { label: string; normalized: number; rationale: string }
> = {
  'sole-proprietor': {
    label: 'Single named owner-operator',
    normalized: 0.8,
    rationale:
      'Public filings list a single natural person as owner and agent, with no parent entity on record. This is strong but not the rarest ownership profile, so it no longer carries the full 1.0 premium.',
  },
  family: {
    label: 'Family-held',
    normalized: 0.78,
    rationale:
      'Registered agents and officers share a surname across filings; no institutional parent appears in the chain. Family control is attractive but still short of the rarest owner-only profile.',
  },
  partnership: {
    label: 'Two-partner ownership',
    normalized: 0.82,
    rationale:
      'Two individual partners on record. No fund, holdco, or corporate parent detected.',
  },
  esop: {
    label: 'Employee stock ownership plan',
    normalized: 0.45,
    rationale:
      'ESOP structure detected, which complicates a clean transfer even though no outside institution is involved.',
  },
  'holding-co': {
    label: 'Rolled into a holding company',
    normalized: 0.2,
    rationale:
      'Entity chain terminates in a multi-brand holding company, suggesting a prior consolidation.',
  },
  'pe-backed': {
    label: 'Private-equity backed',
    normalized: 0,
    rationale:
      'A sponsor-affiliated entity appears in the ownership chain. Institutional owner — outside thesis.',
  },
  strategic: {
    label: 'Owned by a strategic acquirer',
    normalized: 0.05,
    rationale:
      'Parent is an operating competitor in the same vertical. Effectively already consolidated.',
  },
  unknown: {
    label: 'Ownership not yet resolved',
    normalized: 0.5,
    rationale:
      'Ownership chain unresolved in available records. Scored neutrally rather than assumed favourable.',
  },
}

type DemandClass =
  | 'compliance'
  | 'contract'
  | 'recurring'
  | 'seasonal'
  | 'project'

const DEMAND: Record<
  DemandClass,
  { normalized: number; rationale: string }
> = {
  compliance: {
    normalized: 1,
    rationale:
      'Revenue is driven by mandated periodic inspection and certification, which is non-discretionary for the customer.',
  },
  contract: {
    normalized: 0.9,
    rationale:
      'Recurring service agreements with scheduled routes produce contracted, repeatable revenue.',
  },
  recurring: {
    normalized: 0.78,
    rationale:
      'Repeat maintenance and consumable replacement generate steady, if uncontracted, demand.',
  },
  seasonal: {
    normalized: 0.5,
    rationale:
      'Meaningful seasonality in demand. Cash flow is repeatable annually but uneven quarter to quarter.',
  },
  project: {
    normalized: 0.32,
    rationale:
      'Predominantly project and new-construction work, which is cyclical and lumpy.',
  },
}

const INDUSTRY_FIT_BY_PRIORITY: Record<number, number> = {
  1: 0.85,
  2: 0.75,
  3: 0.65,
  4: 0.56,
  5: 0.46,
  6: 0.32,
}

/* ------------------------------------------------------------------ */
/* Seed specification                                                  */
/* ------------------------------------------------------------------ */

interface Spec {
  name: string
  industry: IndustryId
  city: string
  county: CountyId
  address: string
  founded: number | null
  entity: string | null
  employees: Range | null
  locations: number | null
  licenses: string[] | null
  revenue: Range | null
  ebitda: Range | null
  cashflow: boolean | null
  ownership: OwnershipClass
  ownershipChange: boolean | null
  ownerTenure: number | null
  reviews: number | null
  rating: number | null
  website: string | null
  websiteQuality: WebsiteQuality | null
  localVisibility: number | null
  marketing: MarketingMaturity | null
  demand: DemandClass
  marketStatus: MarketStatus
  franchise: boolean
  status: PipelineStatus
  saved: boolean
  tags: string[]
  sources: ProviderId[]
  discovered: number
  touched: number | null
  contacts?: [string, string, string, string][]
  notes?: [string, number][]
}

const M = 1_000_000
const K = 1_000

const SPECS: Spec[] = [
  {
    name: 'Sentinel Fire & Backflow Services',
    industry: 'fire-protection',
    city: 'Ventura',
    county: 'ventura',
    address: '2140 Knoll Dr, Ventura, CA 93003',
    founded: 1984,
    entity: 'California S-Corporation',
    employees: { min: 22, max: 30 },
    locations: 1,
    licenses: ['C-16 Fire Protection', 'AWWA Backflow Tester', 'CSLB #4412...'],
    revenue: { min: 4.2 * M, max: 5.1 * M },
    ebitda: { min: 900 * K, max: 1.25 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 41,
    reviews: 214,
    rating: 4.8,
    website: 'sentinelfireventura.com',
    websiteQuality: 'dated',
    localVisibility: 88,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['anchor candidate', 'municipal contracts', 'high margin'],
    sources: ['google-places', 'public-records', 'web', 'apollo'],
    discovered: 34,
    touched: 3,
    contacts: [
      ['R. Delacroix', 'Owner / President', 'r•••••@sentinelfireventura.com', '(805) •••-4412'],
      ['M. Ibarra', 'Operations Manager', 'm•••••@sentinelfireventura.com', '(805) •••-4419'],
    ],
    notes: [
      [
        'Called the main line to confirm ownership. Receptionist volunteered that the owner "still comes in every morning" and has been there since the beginning. Strong succession read.',
        3,
      ],
      [
        'Holds recurring annual inspection contracts with two school districts. Contract revenue looks genuinely sticky — worth confirming term lengths in diligence.',
        11,
      ],
    ],
  },
  {
    name: 'Harbor Point Backflow Testing',
    industry: 'fire-protection',
    city: 'Oxnard',
    county: 'ventura',
    address: '731 S Rose Ave, Oxnard, CA 93030',
    founded: 1991,
    entity: 'California Corporation',
    employees: { min: 9, max: 14 },
    locations: 1,
    licenses: ['AWWA Backflow Tester', 'C-36 Plumbing'],
    revenue: { min: 1.6 * M, max: 2.1 * M },
    ebitda: { min: 380 * K, max: 520 * K },
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 34,
    reviews: 63,
    rating: 4.6,
    website: null,
    websiteQuality: 'none',
    localVisibility: 54,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['no website', 'succession likely'],
    sources: ['google-places', 'public-records'],
    discovered: 12,
    touched: 6,
    notes: [
      [
        'No web presence at all — found only through Places and the county backflow tester registry. Exactly the profile the radar is meant to surface.',
        6,
      ],
    ],
  },
  {
    name: 'Meridian Fire Systems Inc.',
    industry: 'fire-protection',
    city: 'Anaheim',
    county: 'orange',
    address: '1455 N Raymond Ave, Anaheim, CA 92801',
    founded: 1978,
    entity: 'California S-Corporation',
    employees: { min: 38, max: 52 },
    locations: 2,
    licenses: ['C-16 Fire Protection', 'NICET Level III', 'CSLB #3187...'],
    revenue: { min: 7.5 * M, max: 9.2 * M },
    ebitda: { min: 1.7 * M, max: 2.3 * M },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: false,
    ownerTenure: 29,
    reviews: 148,
    rating: 4.5,
    website: 'meridianfiresystems.com',
    websiteQuality: 'basic',
    localVisibility: 76,
    marketing: 'low',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'contacted',
    saved: true,
    tags: ['anchor candidate', 'two locations'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 58,
    touched: 1,
    contacts: [
      ['D. Whitfield', 'Co-Owner', 'd•••••@meridianfiresystems.com', '(714) •••-3187'],
    ],
    notes: [
      [
        'Both partners are past 60 per public filing history. EBITDA sits in anchor range — this is a platform, not a tuck-in.',
        1,
      ],
    ],
  },
  {
    name: 'Coastline Sprinkler & Alarm',
    industry: 'fire-protection',
    city: 'Carlsbad',
    county: 'san-diego',
    address: '2210 Faraday Ave, Carlsbad, CA 92008',
    founded: 2011,
    entity: 'California LLC',
    employees: { min: 12, max: 18 },
    locations: 1,
    licenses: ['C-16 Fire Protection'],
    revenue: { min: 2.2 * M, max: 2.8 * M },
    ebitda: { min: 260 * K, max: 400 * K },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: true,
    ownerTenure: 4,
    reviews: 97,
    rating: 4.7,
    website: 'coastlinesprinkler.com',
    websiteQuality: 'modern',
    localVisibility: 81,
    marketing: 'high',
    demand: 'compliance',
    marketStatus: 'on-market',
    franchise: false,
    status: 'passed',
    saved: false,
    tags: ['recent recap', 'brokered'],
    sources: ['google-places', 'web', 'apollo'],
    discovered: 21,
    touched: 14,
    notes: [
      [
        'Recapitalised in 2022 and now listed with a broker. Young ownership, sophisticated marketing — no succession angle and no information edge. Passing.',
        14,
      ],
    ],
  },
  {
    name: 'Pacific Standard Fire Protection',
    industry: 'fire-protection',
    city: 'Santa Maria',
    county: 'santa-barbara',
    address: '410 E Betteravia Rd, Santa Maria, CA 93454',
    founded: 1996,
    entity: null,
    employees: { min: 15, max: 24 },
    locations: 1,
    licenses: ['C-16 Fire Protection', 'AWWA Backflow Tester'],
    revenue: { min: 2.6 * M, max: 3.4 * M },
    ebitda: null,
    cashflow: null,
    ownership: 'unknown',
    ownershipChange: null,
    ownerTenure: null,
    reviews: 41,
    rating: 4.4,
    website: 'pacstandardfire.com',
    websiteQuality: 'dated',
    localVisibility: 62,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['needs enrichment'],
    sources: ['google-places'],
    discovered: 4,
    touched: null,
  },
  {
    name: 'Valley Air Mechanical',
    industry: 'hvac',
    city: 'Van Nuys',
    county: 'los-angeles',
    address: '7440 Woodley Ave, Van Nuys, CA 91406',
    founded: 1981,
    entity: 'California S-Corporation',
    employees: { min: 34, max: 46 },
    locations: 1,
    licenses: ['C-20 HVAC', 'EPA 608 Universal', 'CSLB #3902...'],
    revenue: { min: 6.8 * M, max: 8.4 * M },
    ebitda: { min: 1.1 * M, max: 1.6 * M },
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 38,
    reviews: 302,
    rating: 4.6,
    website: 'valleyairmech.com',
    websiteQuality: 'dated',
    localVisibility: 84,
    marketing: 'low',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'in-conversation',
    saved: true,
    tags: ['commercial maintenance', 'succession likely', 'high review volume'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 76,
    touched: 2,
    contacts: [
      ['G. Marchetti', 'President', 'g•••••@valleyairmech.com', '(818) •••-3902'],
      ['A. Marchetti', 'VP Service', 'a•••••@valleyairmech.com', '(818) •••-3915'],
    ],
    notes: [
      [
        'Second-generation family business. Son runs service but has told me directly he does not want to own the company. That is the single most valuable sentence in this database right now.',
        2,
      ],
      [
        'Roughly 60% of revenue is commercial PM agreements. Residential replacement is the rest. Mix is better than the industry average.',
        19,
      ],
      ['Sent a follow-up note proposing a coffee in August. Awaiting reply.', 9],
    ],
  },
  {
    name: 'Trade Winds Heating & Air',
    industry: 'hvac',
    city: 'Escondido',
    county: 'san-diego',
    address: '1520 W Mission Ave, Escondido, CA 92029',
    founded: 1989,
    entity: 'California Corporation',
    employees: { min: 18, max: 26 },
    locations: 1,
    licenses: ['C-20 HVAC', 'EPA 608 Universal'],
    revenue: { min: 3.4 * M, max: 4.3 * M },
    ebitda: { min: 520 * K, max: 740 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 36,
    reviews: 176,
    rating: 4.5,
    website: 'tradewindsairsd.com',
    websiteQuality: 'dated',
    localVisibility: 71,
    marketing: 'none',
    demand: 'seasonal',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['succession likely', 'weak digital'],
    sources: ['google-places', 'public-records', 'web'],
    discovered: 28,
    touched: 8,
    notes: [
      [
        'Heavy residential mix means real seasonality. Still attractive on price, but this is a tuck-in rather than a platform.',
        8,
      ],
    ],
  },
  {
    name: 'Summit Climate Control',
    industry: 'hvac',
    city: 'Irvine',
    county: 'orange',
    address: '17671 Cowan, Irvine, CA 92614',
    founded: 2016,
    entity: 'California LLC',
    employees: { min: 24, max: 34 },
    locations: 1,
    licenses: ['C-20 HVAC'],
    revenue: { min: 5.1 * M, max: 6.4 * M },
    ebitda: { min: 640 * K, max: 900 * K },
    cashflow: true,
    ownership: 'pe-backed',
    ownershipChange: true,
    ownerTenure: 3,
    reviews: 411,
    rating: 4.9,
    website: 'summitclimate.io',
    websiteQuality: 'modern',
    localVisibility: 94,
    marketing: 'high',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'dead',
    saved: false,
    tags: ['sponsor owned', 'exclude'],
    sources: ['google-places', 'apollo', 'public-records', 'web'],
    discovered: 45,
    touched: 40,
    notes: [
      [
        'Ownership chain runs to a Newport Beach fund. Institutional owner, so it fails the thesis regardless of how good the operation looks.',
        40,
      ],
    ],
  },
  {
    name: 'Buenaventura Refrigeration & HVAC',
    industry: 'hvac',
    city: 'Camarillo',
    county: 'ventura',
    address: '355 Camarillo Springs Rd, Camarillo, CA 93012',
    founded: 1974,
    entity: 'California S-Corporation',
    employees: { min: 28, max: 38 },
    locations: 1,
    licenses: ['C-20 HVAC', 'C-38 Refrigeration', 'EPA 608 Universal'],
    revenue: { min: 5.4 * M, max: 6.6 * M },
    ebitda: { min: 1.05 * M, max: 1.4 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 45,
    reviews: 88,
    rating: 4.7,
    website: 'buenaventurarefrig.com',
    websiteQuality: 'dated',
    localVisibility: 67,
    marketing: 'none',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['anchor candidate', 'commercial refrigeration', 'succession likely'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 9,
    touched: 5,
    notes: [
      [
        'Commercial refrigeration attached to an HVAC book is a better business than either alone — grocery and food-service clients cannot defer repairs.',
        5,
      ],
    ],
  },
  {
    name: 'Goleta Mechanical Services',
    industry: 'hvac',
    city: 'Goleta',
    county: 'santa-barbara',
    address: '5385 Hollister Ave, Goleta, CA 93111',
    founded: 2003,
    entity: 'California LLC',
    employees: { min: 8, max: 12 },
    locations: 1,
    licenses: ['C-20 HVAC'],
    revenue: { min: 1.2 * M, max: 1.7 * M },
    ebitda: { min: 140 * K, max: 240 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 22,
    reviews: 52,
    rating: 4.3,
    website: 'goletamechanical.com',
    websiteQuality: 'basic',
    localVisibility: 58,
    marketing: 'low',
    demand: 'seasonal',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['small', 'tuck-in'],
    sources: ['google-places', 'web'],
    discovered: 6,
    touched: null,
  },
  {
    name: 'Long Beach Air Systems',
    industry: 'hvac',
    city: 'Long Beach',
    county: 'los-angeles',
    address: '3401 E Willow St, Long Beach, CA 90806',
    founded: 1998,
    entity: null,
    employees: null,
    locations: null,
    licenses: ['C-20 HVAC'],
    revenue: null,
    ebitda: null,
    cashflow: null,
    ownership: 'unknown',
    ownershipChange: null,
    ownerTenure: null,
    reviews: 29,
    rating: 4.1,
    website: null,
    websiteQuality: 'none',
    localVisibility: 34,
    marketing: null,
    demand: 'seasonal',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['needs enrichment', 'thin record'],
    sources: ['google-places'],
    discovered: 2,
    touched: null,
  },
  {
    name: 'AireServ of the South Bay',
    industry: 'hvac',
    city: 'Torrance',
    county: 'los-angeles',
    address: '2377 Crenshaw Blvd, Torrance, CA 90501',
    founded: 2009,
    entity: 'California LLC',
    employees: { min: 14, max: 20 },
    locations: 1,
    licenses: ['C-20 HVAC'],
    revenue: { min: 2.4 * M, max: 3.1 * M },
    ebitda: { min: 280 * K, max: 410 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 16,
    reviews: 133,
    rating: 4.4,
    website: 'aireserv-southbay.com',
    websiteQuality: 'basic',
    localVisibility: 69,
    marketing: 'moderate',
    demand: 'seasonal',
    marketStatus: 'off-market',
    franchise: true,
    status: 'dead',
    saved: false,
    tags: ['franchise', 'exclude'],
    sources: ['google-places', 'web', 'public-records'],
    discovered: 31,
    touched: 30,
    notes: [
      [
        'Franchise agreement in place. Hard filter failure — kept in the record only so the exclusion is auditable.',
        30,
      ],
    ],
  },
  {
    name: 'Redline Secure Shredding',
    industry: 'data-destruction',
    city: 'Santa Fe Springs',
    county: 'los-angeles',
    address: '13031 Marquardt Ave, Santa Fe Springs, CA 90670',
    founded: 1997,
    entity: 'California S-Corporation',
    employees: { min: 26, max: 34 },
    locations: 1,
    licenses: ['NAID AAA Certified', 'CA DTSC e-Waste Handler'],
    revenue: { min: 4.6 * M, max: 5.8 * M },
    ebitda: { min: 1.1 * M, max: 1.5 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 28,
    reviews: 74,
    rating: 4.8,
    website: 'redlineshredding.com',
    websiteQuality: 'dated',
    localVisibility: 72,
    marketing: 'none',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['anchor candidate', 'NAID certified', 'route density'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 41,
    touched: 4,
    contacts: [
      ['P. Okonkwo', 'Founder / CEO', 'p•••••@redlineshredding.com', '(562) •••-7741'],
    ],
    notes: [
      [
        'Scheduled route shredding is the closest thing to a subscription in this whole thesis. Recurring contracts plus NAID AAA is a real moat for a company this size.',
        4,
      ],
      [
        'Fleet is aging. Factor a capex catch-up into any model — likely six trucks needing replacement inside three years.',
        16,
      ],
    ],
  },
  {
    name: 'Vault ITAD & Media Destruction',
    industry: 'data-destruction',
    city: 'San Diego',
    county: 'san-diego',
    address: '7910 Dunbrook Rd, San Diego, CA 92126',
    founded: 2006,
    entity: 'California Corporation',
    employees: { min: 16, max: 24 },
    locations: 1,
    licenses: ['NAID AAA Certified', 'R2 Recycling', 'CA DTSC e-Waste Handler'],
    revenue: { min: 3.1 * M, max: 3.9 * M },
    ebitda: { min: 560 * K, max: 800 * K },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: false,
    ownerTenure: 19,
    reviews: 48,
    rating: 4.6,
    website: 'vaultitad.com',
    websiteQuality: 'basic',
    localVisibility: 64,
    marketing: 'low',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['ITAD', 'defense adjacent'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 17,
    touched: 7,
    notes: [
      [
        'Serves several defense subcontractors, which implies clearance-adjacent handling requirements. Raises switching costs meaningfully.',
        7,
      ],
    ],
  },
  {
    name: 'Orange County Document Destruction',
    industry: 'data-destruction',
    city: 'Santa Ana',
    county: 'orange',
    address: '2100 E Howell Ave, Santa Ana, CA 92705',
    founded: 1993,
    entity: 'California S-Corporation',
    employees: { min: 11, max: 16 },
    locations: 1,
    licenses: ['NAID AAA Certified'],
    revenue: { min: 1.8 * M, max: 2.3 * M },
    ebitda: { min: 400 * K, max: 580 * K },
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 32,
    reviews: 31,
    rating: 4.9,
    website: 'ocdocdestruction.com',
    websiteQuality: 'dated',
    localVisibility: 49,
    marketing: 'none',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: true,
    tags: ['succession likely', 'weak digital', 'clean books rumored'],
    sources: ['google-places', 'public-records', 'web'],
    discovered: 1,
    touched: null,
  },
  {
    name: 'Central Coast Shred',
    industry: 'data-destruction',
    city: 'Santa Barbara',
    county: 'santa-barbara',
    address: '1236 Coast Village Rd, Santa Barbara, CA 93108',
    founded: 2014,
    entity: 'California LLC',
    employees: { min: 5, max: 9 },
    locations: 1,
    licenses: null,
    revenue: { min: 700 * K, max: 1.1 * M },
    ebitda: { min: 90 * K, max: 160 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 11,
    reviews: 22,
    rating: 4.5,
    website: 'centralcoastshred.com',
    websiteQuality: 'basic',
    localVisibility: 41,
    marketing: 'low',
    demand: 'recurring',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['sub-scale'],
    sources: ['google-places', 'web'],
    discovered: 8,
    touched: null,
  },
  {
    name: 'Iron Ledger Records Management',
    industry: 'data-destruction',
    city: 'Chatsworth',
    county: 'los-angeles',
    address: '20730 Prairie St, Chatsworth, CA 91311',
    founded: 1988,
    entity: 'California Corporation',
    employees: { min: 30, max: 42 },
    locations: 2,
    licenses: ['NAID AAA Certified', 'PRISM Privacy+'],
    revenue: { min: 6.2 * M, max: 7.6 * M },
    ebitda: { min: 1.6 * M, max: 2.2 * M },
    cashflow: true,
    ownership: 'holding-co',
    ownershipChange: true,
    ownerTenure: 6,
    reviews: 57,
    rating: 4.2,
    website: 'ironledgerrm.com',
    websiteQuality: 'basic',
    localVisibility: 66,
    marketing: 'moderate',
    demand: 'contract',
    marketStatus: 'on-market',
    franchise: false,
    status: 'passed',
    saved: false,
    tags: ['brokered', 'already consolidated'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 52,
    touched: 22,
    notes: [
      [
        'Already inside a records-management holdco and now on the market. Storage revenue is attractive but the price will reflect a competitive process.',
        22,
      ],
    ],
  },
  {
    name: 'PureFlow Medical Water Systems',
    industry: 'medical-water',
    city: 'Fullerton',
    county: 'orange',
    address: '1401 N Acacia Ave, Fullerton, CA 92831',
    founded: 1986,
    entity: 'California S-Corporation',
    employees: { min: 19, max: 27 },
    locations: 1,
    licenses: ['CA Water Treatment Operator T3', 'AAMI Dialysis Water Compliance'],
    revenue: { min: 3.8 * M, max: 4.7 * M },
    ebitda: { min: 940 * K, max: 1.3 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 39,
    reviews: 18,
    rating: 4.9,
    website: 'pureflowmedwater.com',
    websiteQuality: 'dated',
    localVisibility: 38,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'in-conversation',
    saved: true,
    tags: ['anchor candidate', 'dialysis clinics', 'succession likely', 'high margin'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 63,
    touched: 1,
    contacts: [
      ['H. Vasquez', 'Owner', 'h•••••@pureflowmedwater.com', '(714) •••-2288'],
      ['S. Lin', 'Compliance Director', 's•••••@pureflowmedwater.com', '(714) •••-2291'],
    ],
    notes: [
      [
        'AAMI water compliance for dialysis is mandated and audited. A clinic cannot skip it and cannot switch vendors casually. Best demand profile in the database.',
        1,
      ],
      [
        'Very low review count because customers are institutional, not consumer. Low visibility here is a feature, not a weakness — it is why nobody else has found this.',
        14,
      ],
      [
        'Owner is receptive to a conversation but explicitly not running a process. Keep this warm and unbrokered.',
        5,
      ],
    ],
  },
  {
    name: 'Clearwater Clinical Water Services',
    industry: 'medical-water',
    city: 'San Marcos',
    county: 'san-diego',
    address: '840 Rancheros Dr, San Marcos, CA 92069',
    founded: 2001,
    entity: 'California LLC',
    employees: { min: 10, max: 15 },
    locations: 1,
    licenses: ['CA Water Treatment Operator T2'],
    revenue: { min: 1.7 * M, max: 2.2 * M },
    ebitda: { min: 300 * K, max: 450 * K },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: false,
    ownerTenure: 24,
    reviews: 9,
    rating: 4.7,
    website: 'clearwaterclinical.net',
    websiteQuality: 'dated',
    localVisibility: 27,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['weak digital', 'surgical centers'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 24,
    touched: 10,
  },
  {
    name: 'Sierra Vista Water Treatment',
    industry: 'medical-water',
    city: 'Pasadena',
    county: 'los-angeles',
    address: '2531 E Foothill Blvd, Pasadena, CA 91107',
    founded: 1992,
    entity: null,
    employees: { min: 13, max: 19 },
    locations: 1,
    licenses: ['CA Water Treatment Operator T3'],
    revenue: { min: 2.3 * M, max: 3.0 * M },
    ebitda: null,
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 30,
    reviews: 14,
    rating: 4.4,
    website: 'sierravistawater.com',
    websiteQuality: 'dated',
    localVisibility: 33,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: false,
    tags: ['needs financials'],
    sources: ['google-places', 'public-records'],
    discovered: 15,
    touched: 11,
    notes: [
      [
        'No EBITDA estimate yet — revenue proxy only. Confidence should stay capped until we get something resembling financials.',
        11,
      ],
    ],
  },
  {
    name: 'Channel Islands Hydro Purification',
    industry: 'medical-water',
    city: 'Thousand Oaks',
    county: 'ventura',
    address: '1240 Rancho Conejo Blvd, Thousand Oaks, CA 91320',
    founded: 2009,
    entity: 'California LLC',
    employees: { min: 6, max: 10 },
    locations: 1,
    licenses: ['CA Water Treatment Operator T2'],
    revenue: { min: 900 * K, max: 1.3 * M },
    ebitda: { min: 120 * K, max: 210 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 16,
    reviews: 7,
    rating: 5,
    website: null,
    websiteQuality: 'none',
    localVisibility: 19,
    marketing: 'none',
    demand: 'recurring',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['sub-scale', 'no website'],
    sources: ['google-places'],
    discovered: 5,
    touched: null,
  },
  {
    name: 'BioClear Waste Solutions',
    industry: 'biohazard',
    city: 'Vernon',
    county: 'los-angeles',
    address: '4501 Fruitland Ave, Vernon, CA 90058',
    founded: 1990,
    entity: 'California S-Corporation',
    employees: { min: 32, max: 44 },
    locations: 2,
    licenses: [
      'CA Medical Waste Hauler',
      'DOT HazMat Registration',
      'CalRecycle Permit',
    ],
    revenue: { min: 5.9 * M, max: 7.2 * M },
    ebitda: { min: 1.4 * M, max: 1.9 * M },
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 35,
    reviews: 39,
    rating: 4.5,
    website: 'bioclearwaste.com',
    websiteQuality: 'dated',
    localVisibility: 61,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'diligence',
    saved: true,
    tags: ['anchor candidate', 'permitted hauler', 'route density', 'succession likely'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 91,
    touched: 1,
    contacts: [
      ['E. Broussard', 'President', 'e•••••@bioclearwaste.com', '(323) •••-5510'],
      ['J. Broussard', 'CFO', 'j•••••@bioclearwaste.com', '(323) •••-5514'],
    ],
    notes: [
      [
        'Hauler permits in California are slow and expensive to obtain, which is the real asset here. Buying the permit and the routes, not the trucks.',
        1,
      ],
      [
        'Received three years of reviewed statements. Adjusted EBITDA lands near the top of the estimated range — the model was conservative.',
        6,
      ],
      [
        'Both principals are in their sixties with no family successor identified. This is the cleanest succession story in the pipeline.',
        13,
      ],
    ],
  },
  {
    name: 'Sharps Coast Medical Waste',
    industry: 'biohazard',
    city: 'Chula Vista',
    county: 'san-diego',
    address: '865 Energy Way, Chula Vista, CA 91911',
    founded: 2004,
    entity: 'California Corporation',
    employees: { min: 14, max: 21 },
    locations: 1,
    licenses: ['CA Medical Waste Hauler', 'DOT HazMat Registration'],
    revenue: { min: 2.5 * M, max: 3.2 * M },
    ebitda: { min: 470 * K, max: 680 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 21,
    reviews: 26,
    rating: 4.3,
    website: 'sharpscoast.com',
    websiteQuality: 'basic',
    localVisibility: 52,
    marketing: 'low',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'contacted',
    saved: true,
    tags: ['permitted hauler', 'border-adjacent routes'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 37,
    touched: 3,
  },
  {
    name: 'Inland Biohazard Response',
    industry: 'biohazard',
    city: 'Fountain Valley',
    county: 'orange',
    address: '11121 Talbert Ave, Fountain Valley, CA 92708',
    founded: 1999,
    entity: 'California S-Corporation',
    employees: { min: 9, max: 15 },
    locations: 1,
    licenses: ['CA Trauma Scene Practitioner', 'DOT HazMat Registration'],
    revenue: { min: 1.4 * M, max: 1.9 * M },
    ebitda: { min: 310 * K, max: 470 * K },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: false,
    ownerTenure: 26,
    reviews: 44,
    rating: 4.8,
    website: 'inlandbiohazard.com',
    websiteQuality: 'dated',
    localVisibility: 47,
    marketing: 'none',
    demand: 'recurring',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['trauma remediation', 'insurance funded'],
    sources: ['google-places', 'public-records', 'web'],
    discovered: 19,
    touched: 9,
    notes: [
      [
        'Trauma scene work is insurance-funded and non-deferrable, but volume is genuinely unpredictable month to month. Scored as recurring rather than contracted.',
        9,
      ],
    ],
  },
  {
    name: 'Gaviota Environmental Services',
    industry: 'biohazard',
    city: 'Lompoc',
    county: 'santa-barbara',
    address: '1520 N H St, Lompoc, CA 93436',
    founded: 1995,
    entity: null,
    employees: { min: 7, max: 12 },
    locations: 1,
    licenses: ['CA Medical Waste Hauler'],
    revenue: null,
    ebitda: null,
    cashflow: null,
    ownership: 'unknown',
    ownershipChange: null,
    ownerTenure: null,
    reviews: 6,
    rating: 4.2,
    website: null,
    websiteQuality: 'none',
    localVisibility: 15,
    marketing: null,
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['needs enrichment', 'thin record', 'no website'],
    sources: ['google-places', 'public-records'],
    discovered: 3,
    touched: null,
    notes: [
      [
        'Almost nothing on this one beyond a hauler permit and a Places entry. Interesting precisely because it is invisible — needs manual research.',
        3,
      ],
    ],
  },
  {
    name: 'MedWaste Logistics of California',
    industry: 'biohazard',
    city: 'Rancho Dominguez',
    county: 'los-angeles',
    address: '18800 S Alameda St, Rancho Dominguez, CA 90220',
    founded: 1983,
    entity: 'California Corporation',
    employees: { min: 55, max: 75 },
    locations: 3,
    licenses: [
      'CA Medical Waste Hauler',
      'DOT HazMat Registration',
      'CalRecycle Permit',
      'EPA ID',
    ],
    revenue: { min: 11 * M, max: 14 * M },
    ebitda: { min: 3.1 * M, max: 4.4 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 42,
    reviews: 71,
    rating: 4.4,
    website: 'medwastelogisticsca.com',
    websiteQuality: 'dated',
    localVisibility: 74,
    marketing: 'low',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['above ceiling', 'anchor candidate', 'three facilities'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 26,
    touched: 12,
    notes: [
      [
        'Top of the estimated EBITDA range breaches the $4M anchor ceiling. Flagged rather than excluded — if the true number lands near $3.5M this is the single best platform available.',
        12,
      ],
    ],
  },
  {
    name: 'Anchor Industrial Water & Filtration',
    industry: 'adjacent',
    city: 'Brea',
    county: 'orange',
    address: '1155 W Central Ave, Brea, CA 92821',
    founded: 1987,
    entity: 'California S-Corporation',
    employees: { min: 21, max: 29 },
    locations: 1,
    licenses: ['CA Water Treatment Operator T3', 'C-61 Limited Specialty'],
    revenue: { min: 4.0 * M, max: 4.9 * M },
    ebitda: { min: 780 * K, max: 1.1 * M },
    cashflow: true,
    ownership: 'family',
    ownershipChange: false,
    ownerTenure: 33,
    reviews: 35,
    rating: 4.6,
    website: 'anchorindwater.com',
    websiteQuality: 'dated',
    localVisibility: 55,
    marketing: 'none',
    demand: 'contract',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['adjacent vertical', 'consumables revenue'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 22,
    touched: 6,
    notes: [
      [
        'Not a core vertical, but the consumables and filter-change revenue behaves exactly like the medical water book. Genuine adjacency for a roll-up.',
        6,
      ],
    ],
  },
  {
    name: 'Westlake Elevator Inspection Co.',
    industry: 'adjacent',
    city: 'Westlake Village',
    county: 'ventura',
    address: '30700 Russell Ranch Rd, Westlake Village, CA 91362',
    founded: 1994,
    entity: 'California Corporation',
    employees: { min: 12, max: 17 },
    locations: 1,
    licenses: ['QEI Certified Inspector', 'CA Cal/OSHA Elevator Unit'],
    revenue: { min: 2.1 * M, max: 2.7 * M },
    ebitda: { min: 540 * K, max: 760 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 31,
    reviews: 11,
    rating: 4.9,
    website: 'westlakeelevatorinspect.com',
    websiteQuality: 'dated',
    localVisibility: 29,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'reviewing',
    saved: true,
    tags: ['adjacent vertical', 'mandated inspection', 'high margin'],
    sources: ['google-places', 'public-records', 'apollo'],
    discovered: 13,
    touched: 7,
    notes: [
      [
        'Mandated annual elevator inspection is structurally identical to backflow testing: legally required, low ticket, high renewal. Strong adjacency.',
        7,
      ],
    ],
  },
  {
    name: 'Del Mar Grease & Hood Compliance',
    industry: 'adjacent',
    city: 'San Diego',
    county: 'san-diego',
    address: '9265 Activity Rd, San Diego, CA 92126',
    founded: 2007,
    entity: 'California LLC',
    employees: { min: 17, max: 25 },
    locations: 1,
    licenses: ['IKECA Certified', 'CA Waste Hauler'],
    revenue: { min: 2.8 * M, max: 3.5 * M },
    ebitda: { min: 420 * K, max: 620 * K },
    cashflow: true,
    ownership: 'partnership',
    ownershipChange: false,
    ownerTenure: 18,
    reviews: 68,
    rating: 4.4,
    website: 'delmargrease.com',
    websiteQuality: 'basic',
    localVisibility: 60,
    marketing: 'moderate',
    demand: 'compliance',
    marketStatus: 'on-market',
    franchise: false,
    status: 'reviewing',
    saved: false,
    tags: ['adjacent vertical', 'brokered', 'restaurant exposure'],
    sources: ['google-places', 'web', 'apollo'],
    discovered: 11,
    touched: 11,
    notes: [
      [
        'Listed on a marketplace, so no information edge. Kitchen hood cleaning is code-mandated but restaurant customers churn hard in a downturn.',
        11,
      ],
    ],
  },
  {
    name: 'Foothill Backflow & Cross-Connection',
    industry: 'fire-protection',
    city: 'Glendora',
    county: 'los-angeles',
    address: '1301 S Grand Ave, Glendora, CA 91740',
    founded: 1979,
    entity: 'California S-Corporation',
    employees: { min: 16, max: 23 },
    locations: 1,
    licenses: ['AWWA Backflow Tester', 'C-36 Plumbing', 'C-16 Fire Protection'],
    revenue: { min: 3.0 * M, max: 3.8 * M },
    ebitda: { min: 820 * K, max: 1.15 * M },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 46,
    reviews: 96,
    rating: 4.7,
    website: 'foothillbackflow.com',
    websiteQuality: 'dated',
    localVisibility: 70,
    marketing: 'none',
    demand: 'compliance',
    marketStatus: 'off-market',
    franchise: false,
    status: 'qualified',
    saved: true,
    tags: ['anchor candidate', 'water district contracts', 'succession likely', 'high margin'],
    sources: ['google-places', 'public-records', 'apollo', 'web'],
    discovered: 7,
    touched: 2,
    contacts: [
      ['W. Tanaka', 'Owner', 'w•••••@foothillbackflow.com', '(626) •••-1979'],
    ],
    notes: [
      [
        'Forty-six years under one owner, mandated testing revenue, three water-district relationships, and a website that has not been touched since roughly 2011. Textbook profile.',
        2,
      ],
    ],
  },
  {
    name: 'Poway Secure Data Disposal',
    industry: 'data-destruction',
    city: 'Poway',
    county: 'san-diego',
    address: '12625 Danielson Ct, Poway, CA 92064',
    founded: 2018,
    entity: 'California LLC',
    employees: { min: 4, max: 8 },
    locations: 1,
    licenses: null,
    revenue: { min: 450 * K, max: 800 * K },
    ebitda: { min: 40 * K, max: 110 * K },
    cashflow: true,
    ownership: 'sole-proprietor',
    ownershipChange: false,
    ownerTenure: 7,
    reviews: 15,
    rating: 4.6,
    website: 'powayseculardata.com',
    websiteQuality: 'modern',
    localVisibility: 36,
    marketing: 'moderate',
    demand: 'project',
    marketStatus: 'off-market',
    franchise: false,
    status: 'new',
    saved: false,
    tags: ['sub-scale', 'too young'],
    sources: ['google-places', 'web'],
    discovered: 10,
    touched: null,
  },
]

/* ------------------------------------------------------------------ */
/* Signal derivation                                                   */
/* ------------------------------------------------------------------ */

function industryFitSignal(spec: Spec) {
  const industry = INDUSTRIES.find((i) => i.id === spec.industry)!
  const normalized = INDUSTRY_FIT_BY_PRIORITY[industry.priority] ?? 0.5
  return {
    normalized,
    rationale: `${industry.label} is priority ${industry.priority} of ${INDUSTRIES.length} in the buy box.${
      industry.id === 'adjacent'
        ? ' Scored as an adjacency rather than a core vertical.'
        : ''
    }`,
  }
}

function operatingHistorySignal(spec: Spec) {
  if (spec.founded === null) {
    return {
      normalized: 0.3,
      rationale:
        'Founding year not established. Scored conservatively rather than credited.',
    }
  }
  const years = NOW.getUTCFullYear() - spec.founded
  const normalized =
    years >= 40 ? 1 : years >= 30 ? 0.92 : years >= 20 ? 0.8 : years >= 10 ? 0.58 : years >= 5 ? 0.3 : 0.1
  return {
    normalized,
    rationale: `Operating continuously since ${spec.founded} — ${years} years under the same brand.${
      years < 10 ? ' Below the preferred maturity threshold.' : ''
    }`,
  }
}

function successionSignal(spec: Spec) {
  if (spec.ownerTenure === null) {
    return {
      normalized: 0.35,
      rationale:
        'Leadership tenure unresolved. No succession inference can be justified from the current record.',
    }
  }

  let normalized =
    spec.ownerTenure >= 35
      ? 1
      : spec.ownerTenure >= 25
        ? 0.88
        : spec.ownerTenure >= 18
          ? 0.7
          : spec.ownerTenure >= 12
            ? 0.5
            : spec.ownerTenure >= 7
              ? 0.28
              : 0.12

  const reasons = [
    `Same leadership on record for ${spec.ownerTenure} years, with no successor named in filings.`,
  ]

  if (spec.websiteQuality && WEAK_DIGITAL_QUALITIES.includes(spec.websiteQuality)) {
    normalized = Math.min(1, normalized + 0.08)
    reasons.push(
      `Digital presence is ${WEBSITE_QUALITY_LABELS[spec.websiteQuality].toLowerCase()}, a common correlate of a long-tenured owner winding down reinvestment.`,
    )
  }
  if (spec.marketing === 'none') {
    normalized = Math.min(1, normalized + 0.05)
    reasons.push('No active marketing programme detected.')
  }
  if (spec.ownershipChange) {
    normalized = Math.max(0, normalized - 0.45)
    reasons.push(
      'A recent ownership or control change is on record, which materially reduces near-term succession likelihood.',
    )
  }

  return { normalized, rationale: reasons.join(' ') }
}

function institutionalSignal(spec: Spec) {
  const ownership = OWNERSHIP[spec.ownership]
  return { normalized: ownership.normalized, rationale: ownership.rationale }
}

function demandSignal(spec: Spec) {
  const demand = DEMAND[spec.demand]
  return { normalized: demand.normalized, rationale: demand.rationale }
}

function deriveSignals(spec: Spec): CriterionSignals {
  return {
    industryFit: industryFitSignal(spec),
    successionOpportunity: successionSignal(spec),
    institutionalOwnership: institutionalSignal(spec),
    operatingHistory: operatingHistorySignal(spec),
    stableDemand: demandSignal(spec),
  }
}

/* ------------------------------------------------------------------ */
/* Target assembly                                                     */
/* ------------------------------------------------------------------ */

function sourced<T>(
  value: T | null,
  options: {
    provider: ProviderId
    days: number
    confidence: number
    estimated?: boolean
    note?: string
  },
): SourcedValue<T> {
  if (value === null || value === undefined) {
    return {
      value: null,
      estimated: false,
      provider: null,
      fetchedAt: null,
      confidence: 0,
    }
  }
  return {
    value,
    estimated: options.estimated ?? false,
    provider: options.provider,
    fetchedAt: daysAgo(options.days),
    confidence: options.confidence,
    note: options.note,
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildContacts(spec: Spec, id: string): Contact[] {
  return (spec.contacts ?? []).map((entry, index) => ({
    id: `${id}-contact-${index + 1}`,
    name: entry[0],
    role: entry[1],
    emailMasked: entry[2],
    phoneMasked: entry[3],
    provider: 'apollo',
    creditCost: index === 0 ? 1 : 2,
  }))
}

function buildNotes(spec: Spec, id: string): Note[] {
  return (spec.notes ?? []).map((entry, index) => ({
    id: `${id}-note-${index + 1}`,
    body: entry[0],
    author: 'You',
    createdAt: daysAgo(entry[1]),
  }))
}

function buildProvenance(target: Target): ProvenanceRow[] {
  const fields: [string, SourcedValue<unknown>, (v: unknown) => string][] = [
    ['Founded year', target.foundedYear, (v) => String(v)],
    ['Entity type', target.entityType, (v) => String(v)],
    ['Employees', target.employees, (v) => rangeLabel(v as Range)],
    ['Locations', target.locationCount, (v) => String(v)],
    ['Licenses & permits', target.licenses, (v) => (v as string[]).join(', ')],
    ['Estimated revenue', target.estRevenue, (v) => usdRangeLabel(v as Range)],
    ['Estimated EBITDA', target.estEbitda, (v) => usdRangeLabel(v as Range)],
    ['Cashflow positive', target.cashflowPositive, (v) => (v ? 'Yes' : 'No')],
    ['Ownership signal', target.ownershipSignal, (v) => String(v)],
    [
      'Recent ownership change',
      target.recentOwnershipChange,
      (v) => (v ? 'Yes' : 'None on record'),
    ],
    ['Leadership tenure', target.ownerTenureYears, (v) => `${v} years`],
    ['Website', target.website, (v) => String(v)],
    [
      'Website quality',
      target.websiteQuality,
      (v) => WEBSITE_QUALITY_LABELS[v as WebsiteQuality],
    ],
    ['Review count', target.reviewCount, (v) => String(v)],
    ['Rating', target.rating, (v) => `${v} / 5`],
    [
      'Local search visibility',
      target.localSearchVisibility,
      (v) => `${v} / 100`,
    ],
    [
      'Marketing maturity',
      target.marketingMaturity,
      (v) => MARKETING_MATURITY_LABELS[v as MarketingMaturity],
    ],
  ]

  return fields
    .filter(([, sv]) => sv.value !== null)
    .map(([field, sv, format]) => ({
      field,
      value: format(sv.value),
      provider: sv.provider ?? 'manual',
      fetchedAt: sv.fetchedAt ?? '',
      confidence: sv.confidence,
      estimated: sv.estimated,
    }))
}

function rangeLabel(range: Range) {
  return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`
}

function usdRangeLabel(range: Range) {
  const fmt = (n: number) =>
    n >= M
      ? `$${(n / M) % 1 === 0 ? (n / M).toFixed(0) : (n / M).toFixed(1)}M`
      : `$${Math.round(n / K)}K`
  return `${fmt(range.min)}–${fmt(range.max)}`
}

function buildTarget(spec: Spec, index: number): Target {
  const id = `tgt-${String(index + 1).padStart(3, '0')}`
  const hasRecords = spec.sources.includes('public-records')
  const hasApollo = spec.sources.includes('apollo')

  const target: Target = {
    id,
    slug: slugify(spec.name),
    name: spec.name,
    industry: spec.industry,
    address: spec.address,
    city: spec.city,
    county: spec.county,
    marketStatus: spec.marketStatus,
    isFranchise: spec.franchise,
    discoveredAt: daysAgo(spec.discovered),
    lastTouchedAt: spec.touched === null ? null : daysAgo(spec.touched),
    status: spec.status,
    saved: spec.saved,
    tags: spec.tags,
    sources: spec.sources,

    website: sourced(spec.website, {
      provider: 'google-places',
      days: Math.min(spec.discovered, 20),
      confidence: 95,
    }),
    foundedYear: sourced(spec.founded, {
      provider: hasRecords ? 'public-records' : 'web',
      days: spec.discovered,
      confidence: hasRecords ? 92 : 64,
      estimated: !hasRecords,
      note: hasRecords
        ? 'Taken from the Secretary of State entity registration date.'
        : 'Inferred from the earliest archived copy of the company website.',
    }),
    entityType: sourced(spec.entity, {
      provider: 'public-records',
      days: spec.discovered,
      confidence: 94,
    }),
    employees: sourced(spec.employees, {
      provider: hasApollo ? 'apollo' : 'web',
      days: Math.min(spec.discovered, 30),
      confidence: hasApollo ? 74 : 52,
      estimated: true,
      note: hasApollo
        ? 'Modeled headcount band from the enrichment provider, not a payroll figure.'
        : 'Rough band inferred from fleet size, service-area footprint, and job postings.',
    }),
    locationCount: sourced(spec.locations, {
      provider: 'google-places',
      days: Math.min(spec.discovered, 20),
      confidence: 88,
    }),
    licenses: sourced(spec.licenses, {
      provider: 'public-records',
      days: spec.discovered + 5,
      confidence: 96,
    }),
    estRevenue: sourced(spec.revenue, {
      provider: hasApollo ? 'apollo' : 'web',
      days: Math.min(spec.discovered, 45),
      confidence: hasApollo ? 58 : 42,
      estimated: true,
      note: 'Modeled from headcount, industry revenue-per-employee benchmarks, and route density. Not a reported figure.',
    }),
    estEbitda: sourced(spec.ebitda, {
      provider: 'web',
      days: Math.min(spec.discovered, 45),
      confidence: 46,
      estimated: true,
      note: 'Derived by applying a vertical-specific margin band to estimated revenue. Treat as a screening range only, never a valuation input.',
    }),
    cashflowPositive: sourced(spec.cashflow, {
      provider: 'web',
      days: Math.min(spec.discovered, 45),
      confidence: 44,
      estimated: true,
      note: 'Inferred from sustained headcount, fleet investment, and continuous licensure. Requires seller financials to confirm.',
    }),
    ownershipSignal: sourced(
      spec.ownership === 'unknown' ? null : OWNERSHIP[spec.ownership].label,
      {
        provider: 'public-records',
        days: spec.discovered,
        confidence: 82,
        note: 'Resolved by walking the registered-agent and officer chain in state filings.',
      },
    ),
    recentOwnershipChange: sourced(spec.ownershipChange, {
      provider: 'public-records',
      days: spec.discovered,
      confidence: 86,
    }),
    ownerTenureYears: sourced(spec.ownerTenure, {
      provider: 'public-records',
      days: spec.discovered,
      confidence: 71,
      estimated: true,
      note: 'Length of time the same principal has appeared on filings. A lawful proxy for tenure — OMAR does not infer or store owner age.',
    }),

    reviewCount: sourced(spec.reviews, {
      provider: 'google-places',
      days: Math.min(spec.discovered, 9),
      confidence: 97,
    }),
    rating: sourced(spec.rating, {
      provider: 'google-places',
      days: Math.min(spec.discovered, 9),
      confidence: 97,
    }),
    websiteQuality: sourced(spec.websiteQuality, {
      provider: 'web',
      days: Math.min(spec.discovered, 25),
      confidence: 68,
      estimated: true,
      note: 'Assessed from framework fingerprints, last-modified headers, and archive history.',
    }),
    localSearchVisibility: sourced(spec.localVisibility, {
      provider: 'web',
      days: Math.min(spec.discovered, 25),
      confidence: 61,
      estimated: true,
      note: 'Composite index of category ranking across the service area. Directional only.',
    }),
    marketingMaturity: sourced(spec.marketing, {
      provider: 'web',
      days: Math.min(spec.discovered, 25),
      confidence: 55,
      estimated: true,
      note: 'Based on detected ad pixels, paid-search presence, and content cadence.',
    }),

    signals: deriveSignals(spec),
    contacts: buildContacts(spec, id),
    notes: buildNotes(spec, id),
    activity: [],
    provenance: [],
  }

  target.provenance = buildProvenance(target)
  target.activity = buildActivity(target, spec)
  return target
}

function buildActivity(target: Target, spec: Spec): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `${target.id}-act-1`,
      targetId: target.id,
      targetName: target.name,
      kind: 'discovered' as const,
      summary: `Discovered via ${spec.sources
        .slice(0, 2)
        .map((s) => (s === 'google-places' ? 'Google Places' : s === 'public-records' ? 'public records' : s))
        .join(' + ')} sweep`,
      createdAt: target.discoveredAt,
    },
    {
      id: `${target.id}-act-2`,
      targetId: target.id,
      targetName: target.name,
      kind: 'data-refresh' as const,
      summary: `Enriched ${spec.sources.length} source${spec.sources.length === 1 ? '' : 's'}; ${target.provenance.length} fields resolved`,
      createdAt: daysAgo(Math.max(0, spec.discovered - 1)),
    },
  ]

  if (spec.status !== 'new') {
    events.push({
      id: `${target.id}-act-3`,
      targetId: target.id,
      targetName: target.name,
      kind: 'status-change' as const,
      summary: `Status moved to ${spec.status.replace(/-/g, ' ')}`,
      createdAt: daysAgo(spec.touched ?? Math.max(0, spec.discovered - 2)),
    })
  }

  return events
}

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

export const SEED_TARGETS: Target[] = SPECS.map(buildTarget)

export const SEED_TAGS: string[] = Array.from(
  new Set(SEED_TARGETS.flatMap((t) => t.tags)),
).sort()

export const SEED_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'ss-1',
    name: 'Compliance-driven, 30+ years, owner-operated',
    filters: {
      industries: ['fire-protection', 'medical-water', 'biohazard'],
      minYearsInBusiness: 30,
      buckets: ['high', 'medium'],
      marketStatus: 'off-market',
      excludeFranchises: true,
    },
    resultCount: 7,
    createdAt: daysAgo(64),
    lastRunAt: hoursAgo(9),
    alertsEnabled: true,
  },
  {
    id: 'ss-2',
    name: 'Anchor platforms — $2M to $4M EBITDA',
    filters: {
      ebitdaRange: { min: 2_000_000, max: 4_000_000 },
      buckets: ['high', 'medium', 'low'],
      excludeFranchises: true,
    },
    resultCount: 3,
    createdAt: daysAgo(48),
    lastRunAt: hoursAgo(9),
    alertsEnabled: true,
  },
  {
    id: 'ss-3',
    name: 'Invisible operators — no site, strong reviews',
    filters: {
      weakDigitalOnly: true,
      minRating: 4.4,
      marketStatus: 'off-market',
    },
    resultCount: 9,
    createdAt: daysAgo(30),
    lastRunAt: hoursAgo(33),
    alertsEnabled: false,
  },
  {
    id: 'ss-4',
    name: 'Ventura + Santa Barbara sweep',
    filters: {
      counties: ['ventura', 'santa-barbara'],
      excludeFranchises: true,
    },
    resultCount: 8,
    createdAt: daysAgo(19),
    lastRunAt: hoursAgo(57),
    alertsEnabled: false,
  },
]

export const SEED_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-1',
    name: 'Platform shortlist',
    description:
      'Anchor-scale candidates capable of carrying acquired tuck-ins on their back office.',
    targetIds: ['tgt-001', 'tgt-003', 'tgt-013', 'tgt-018', 'tgt-023', 'tgt-030'],
  },
  {
    id: 'wl-2',
    name: 'Succession-first',
    description:
      'Long-tenured single-principal operators where the transition story is the whole thesis.',
    targetIds: ['tgt-002', 'tgt-006', 'tgt-007', 'tgt-009', 'tgt-016', 'tgt-030'],
  },
  {
    id: 'wl-3',
    name: 'Needs manual research',
    description:
      'Thin records that look interesting precisely because almost nothing is published about them.',
    targetIds: ['tgt-005', 'tgt-011', 'tgt-026'],
  },
]

export const SEED_ALERTS: AlertItem[] = [
  {
    id: 'al-1',
    kind: 'top-tier-discovery',
    title: 'Top-tier target discovered',
    body: 'Foothill Backflow & Cross-Connection — 46 years under one owner, mandated testing revenue, no institutional ownership signals.',
    createdAt: hoursAgo(6),
    read: false,
    targetId: 'tgt-030',
  },
  {
    id: 'al-2',
    kind: 'top-tier-discovery',
    title: 'Top-tier target discovered',
    body: 'Orange County Document Destruction — family-held since 1993, NAID AAA certified, no website refresh on record.',
    createdAt: hoursAgo(20),
    read: false,
    targetId: 'tgt-016',
  },
  {
    id: 'al-3',
    kind: 'ingestion-error',
    title: 'Apollo enrichment partially failed',
    body: 'Rate limit reached during the nightly run. 14 of 41 organisation lookups were deferred to the next window.',
    createdAt: hoursAgo(11),
    read: false,
  },
  {
    id: 'al-4',
    kind: 'outreach-reply',
    title: 'Reply logged — Valley Air Mechanical',
    body: 'Principal responded to the August coffee request. Requires your response; outreach automation remains disabled.',
    createdAt: hoursAgo(2),
    read: false,
    targetId: 'tgt-006',
  },
  {
    id: 'al-5',
    kind: 'ingestion-error',
    title: 'Google Places quota at 78%',
    body: 'Discovery sweep throttled to stay inside the monthly budget cap. Next sweep will prioritise Ventura and Santa Barbara.',
    createdAt: daysAgo(2),
    read: true,
  },
]

export const SEED_SOURCES: SourceStatus[] = [
  {
    id: 'google-places',
    name: 'Google Places',
    purpose:
      'Business discovery, category and location data, review volume, and verification of continued operation.',
    connected: true,
    lastRunAt: hoursAgo(9),
    nextRunAt: daysFromNow(1),
    recordsIngested: 1_284,
    errorCount: 2,
    usage: 7_820,
    usageQuota: 10_000,
    usageUnit: 'requests',
    spendUsd: 41.2,
    budgetUsd: 60,
    notes:
      'Billing account required; results are treated as a discovery and verification layer rather than a permanent store, and attribution is preserved on the detail view.',
  },
  {
    id: 'apollo',
    name: 'Apollo',
    purpose:
      'Tightly scoped organisation enrichment and contact resolution. Called only after a target clears the hard filters.',
    connected: true,
    lastRunAt: hoursAgo(11),
    nextRunAt: daysFromNow(1),
    recordsIngested: 312,
    errorCount: 14,
    usage: 486,
    usageQuota: 600,
    usageUnit: 'credits',
    spendUsd: 49,
    budgetUsd: 60,
    notes:
      'Organisation search and enrichment consume credits and are plan-gated. Contact reveals are manual and per-record to avoid burning credits on unqualified targets.',
  },
  {
    id: 'public-records',
    name: 'Public Records',
    purpose:
      'Secretary of State entity filings, contractor and hauler licensure, permits, and officer history.',
    connected: true,
    lastRunAt: hoursAgo(30),
    nextRunAt: daysFromNow(6),
    recordsIngested: 903,
    errorCount: 0,
    usage: 0,
    usageQuota: 0,
    usageUnit: 'requests',
    spendUsd: 0,
    budgetUsd: 0,
    notes:
      'No metered cost. Highest-confidence source in the stack and the backbone of the institutional-ownership and tenure signals.',
  },
  {
    id: 'web',
    name: 'Permitted Web Sources',
    purpose:
      'Website age and quality fingerprinting, archive history, job postings, and marketplace listings.',
    connected: true,
    lastRunAt: hoursAgo(33),
    nextRunAt: daysFromNow(3),
    recordsIngested: 741,
    errorCount: 5,
    usage: 0,
    usageQuota: 0,
    usageUnit: 'requests',
    spendUsd: 0,
    budgetUsd: 0,
    notes:
      'Restricted to sources whose terms permit collection. Every derived field is flagged as an estimate rather than a fact.',
  },
]

export const SEED_RULE_VERSIONS: ScoringRuleVersion[] = [
  {
    id: 'rv-3',
    version: 'v1.3',
    createdAt: daysAgo(6),
    author: 'You',
    weights: {
      industryFit: 25,
      successionOpportunity: 25,
      institutionalOwnership: 25,
      operatingHistory: 15,
      stableDemand: 10,
    },
    summary:
      'Raised succession and institutional-ownership to 25 each. Reflects that a clean, unconsolidated cap table is as valuable as the vertical itself.',
    active: true,
  },
  {
    id: 'rv-2',
    version: 'v1.2',
    createdAt: daysAgo(27),
    author: 'You',
    weights: {
      industryFit: 30,
      successionOpportunity: 20,
      institutionalOwnership: 10,
      operatingHistory: 20,
      stableDemand: 20,
    },
    summary:
      'Initial published weighting. Over-indexed on industry and under-weighted ownership structure.',
    active: false,
  },
  {
    id: 'rv-1',
    version: 'v1.0',
    createdAt: daysAgo(52),
    author: 'You',
    weights: {
      industryFit: 40,
      successionOpportunity: 20,
      institutionalOwnership: 10,
      operatingHistory: 20,
      stableDemand: 10,
    },
    summary: 'First draft during thesis definition. Never used for ranking.',
    active: false,
  },
]

export const SEED_OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'ot-1',
    name: 'Direct owner introduction',
    subject: 'Quick question about {{company}}',
    body: `{{owner_first_name}},

I'm a local buyer focused on {{industry}} businesses across {{county}}. I came across {{company}} while researching operators who have been serving the area since {{founded_year}}, and the longevity stood out.

I'm not a broker and I'm not shopping a listing. I buy one business at a time and operate it myself. If you've ever thought about what a transition might look like — even years out — I'd value a short, entirely confidential conversation.

If the timing isn't right, I understand completely and won't follow up again.

Best,
{{sender_name}}
{{sender_phone}}`,
    variables: [
      'owner_first_name',
      'company',
      'industry',
      'county',
      'founded_year',
      'sender_name',
      'sender_phone',
    ],
  },
  {
    id: 'ot-2',
    name: 'Succession-focused follow-up',
    subject: 'Following up — {{company}}',
    body: `{{owner_first_name}},

Following up on my note from {{last_contact_date}}. No pressure at all.

The reason I reached out specifically is that {{company}} has the characteristics I look for: a {{years_in_business}}-year operating history, recurring compliance-driven work, and an owner who built it rather than bought it.

I'd be glad to share how I structure transitions, including seller financing, so you can judge whether it's worth a conversation.

Best,
{{sender_name}}`,
    variables: [
      'owner_first_name',
      'company',
      'last_contact_date',
      'years_in_business',
      'sender_name',
    ],
  },
]
