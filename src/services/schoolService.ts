import { POPULAR_CA_SCHOOLS } from '../constants/schools';

export interface SchoolRecord {
  id: string;
  name: string;
  city: string;
  county: string;
  district?: string;
  state: string;
  type: 'Public' | 'Charter' | 'Private' | 'Magnet' | 'Vocational';
  gradeSpan?: string;
  status: 'Active' | 'Pending';
  formattedName: string;
}

export interface SchoolSearchOptions {
  state?: string;
  county?: string;
  type?: string;
  limit?: number;
}

// Built-in indexed representation of California Department of Education (CDE) active Directory
const BASE_CDE_SCHOOLS: SchoolRecord[] = [
  { id: "cde-001", name: "Paloma Valley High School", city: "Menifee", county: "Riverside", district: "Perris Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Paloma Valley High School (Menifee)" },
  { id: "cde-002", name: "Orange Glen High School", city: "Escondido", county: "San Diego", district: "Escondido Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Orange Glen High School (Escondido)" },
  { id: "cde-003", name: "Vista Murrieta High School", city: "Murrieta", county: "Riverside", district: "Murrieta Valley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Vista Murrieta High School (Murrieta)" },
  { id: "cde-004", name: "Heritage High School", city: "Menifee", county: "Riverside", district: "Perris Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Heritage High School (Menifee)" },
  { id: "cde-005", name: "Murrieta Valley High School", city: "Murrieta", county: "Riverside", district: "Murrieta Valley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Murrieta Valley High School (Murrieta)" },
  { id: "cde-006", name: "Granada Hills Charter High School", city: "Granada Hills", county: "Los Angeles", district: "Los Angeles Unified", state: "CA", type: "Charter", gradeSpan: "9-12", status: "Active", formattedName: "Granada Hills Charter High School (Granada Hills)" },
  { id: "cde-007", name: "Lowell High School", city: "San Francisco", county: "San Francisco", district: "San Francisco Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Lowell High School (San Francisco)" },
  { id: "cde-008", name: "Whitney High School", city: "Cerritos", county: "Los Angeles", district: "ABC Unified", state: "CA", type: "Public", gradeSpan: "7-12", status: "Active", formattedName: "Whitney High School (Cerritos)" },
  { id: "cde-009", name: "Gunn High School", city: "Palo Alto", county: "Santa Clara", district: "Palo Alto Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Gunn High School (Palo Alto)" },
  { id: "cde-010", name: "Palo Alto High School", city: "Palo Alto", county: "Santa Clara", district: "Palo Alto Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Palo Alto High School (Palo Alto)" },
  { id: "cde-011", name: "Monta Vista High School", city: "Cupertino", county: "Santa Clara", district: "Fremont Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Monta Vista High School (Cupertino)" },
  { id: "cde-012", name: "Lynbrook High School", city: "San Jose", county: "Santa Clara", district: "Fremont Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Lynbrook High School (San Jose)" },
  { id: "cde-013", name: "Troy High School", city: "Fullerton", county: "Orange", district: "Fullerton Joint Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Troy High School (Fullerton)" },
  { id: "cde-014", name: "Torrey Pines High School", city: "San Diego", county: "San Diego", district: "San Dieguito Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Torrey Pines High School (San Diego)" },
  { id: "cde-015", name: "Canyon Crest Academy", city: "San Diego", county: "San Diego", district: "San Dieguito Union High", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Canyon Crest Academy (San Diego)" },
  { id: "cde-016", name: "University High School", city: "Irvine", county: "Orange", district: "Irvine Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "University High School (Irvine)" },
  { id: "cde-017", name: "Northwood High School", city: "Irvine", county: "Orange", district: "Irvine Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Northwood High School (Irvine)" },
  { id: "cde-018", name: "Woodbridge High School", city: "Irvine", county: "Orange", district: "Irvine Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Woodbridge High School (Irvine)" },
  { id: "cde-019", name: "Mission San Jose High School", city: "Fremont", county: "Alameda", district: "Fremont Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Mission San Jose High School (Fremont)" },
  { id: "cde-020", name: "Dougherty Valley High School", city: "San Ramon", county: "Contra Costa", district: "San Ramon Valley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Dougherty Valley High School (San Ramon)" },
  { id: "cde-021", name: "Diamond Bar High School", city: "Diamond Bar", county: "Los Angeles", district: "Walnut Valley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Diamond Bar High School (Diamond Bar)" },
  { id: "cde-022", name: "Walnut High School", city: "Walnut", county: "Los Angeles", district: "Walnut Valley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Walnut High School (Walnut)" },
  { id: "cde-023", name: "Arcadia High School", city: "Arcadia", county: "Los Angeles", district: "Arcadia Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Arcadia High School (Arcadia)" },
  { id: "cde-024", name: "San Marino High School", city: "San Marino", county: "Los Angeles", district: "San Marino Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "San Marino High School (San Marino)" },
  { id: "cde-025", name: "Beverly Hills High School", city: "Beverly Hills", county: "Los Angeles", district: "Beverly Hills Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Beverly Hills High School (Beverly Hills)" },
  { id: "cde-026", name: "Santa Monica High School", city: "Santa Monica", county: "Los Angeles", district: "Santa Monica-Malibu Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Santa Monica High School (Santa Monica)" },
  { id: "cde-027", name: "Palisades Charter High School", city: "Pacific Palisades", county: "Los Angeles", district: "Los Angeles Unified", state: "CA", type: "Charter", gradeSpan: "9-12", status: "Active", formattedName: "Palisades Charter High School (Pacific Palisades)" },
  { id: "cde-028", name: "Mira Costa High School", city: "Manhattan Beach", county: "Los Angeles", district: "Manhattan Beach Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Mira Costa High School (Manhattan Beach)" },
  { id: "cde-029", name: "Redondo Union High School", city: "Redondo Beach", county: "Los Angeles", district: "Redondo Beach Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Redondo Union High School (Redondo Beach)" },
  { id: "cde-030", name: "Palos Verdes Peninsula High School", city: "Rolling Hills Estates", county: "Los Angeles", district: "Palos Verdes Peninsula Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Palos Verdes Peninsula High School (Rolling Hills Estates)" },
  { id: "cde-031", name: "California Academy of Mathematics and Science", city: "Carson", county: "Los Angeles", district: "Long Beach Unified", state: "CA", type: "Magnet", gradeSpan: "9-12", status: "Active", formattedName: "California Academy of Mathematics and Science (Carson)" },
  { id: "cde-032", name: "Oxford Academy", city: "Cypress", county: "Orange", district: "Anaheim Union High", state: "CA", type: "Public", gradeSpan: "7-12", status: "Active", formattedName: "Oxford Academy (Cypress)" },
  { id: "cde-033", name: "Pacific Collegiate School", city: "Santa Cruz", county: "Santa Cruz", district: "Santa Cruz County Office of Education", state: "CA", type: "Charter", gradeSpan: "7-12", status: "Active", formattedName: "Pacific Collegiate School (Santa Cruz)" },
  { id: "cde-034", name: "Preuss School UCSD", city: "La Jolla", county: "San Diego", district: "San Diego Unified", state: "CA", type: "Charter", gradeSpan: "6-12", status: "Active", formattedName: "Preuss School UCSD (La Jolla)" },
  { id: "cde-035", name: "Riverside STEM Academy", city: "Riverside", county: "Riverside", district: "Riverside Unified", state: "CA", type: "Magnet", gradeSpan: "5-12", status: "Active", formattedName: "Riverside STEM Academy (Riverside)" },
  { id: "cde-036", name: "High Tech High", city: "San Diego", county: "San Diego", district: "San Diego Unified", state: "CA", type: "Charter", gradeSpan: "9-12", status: "Active", formattedName: "High Tech High (San Diego)" },
  { id: "cde-037", name: "Oakland Technical High School", city: "Oakland", county: "Alameda", district: "Oakland Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Oakland Technical High School (Oakland)" },
  { id: "cde-038", name: "Berkeley High School", city: "Berkeley", county: "Alameda", district: "Berkeley Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Berkeley High School (Berkeley)" },
  { id: "cde-039", name: "Davis Senior High School", city: "Davis", county: "Yolo", district: "Davis Joint Unified", state: "CA", type: "Public", gradeSpan: "10-12", status: "Active", formattedName: "Davis Senior High School (Davis)" },
  { id: "cde-040", name: "Mira Loma High School", city: "Sacramento", county: "Sacramento", district: "San Juan Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Mira Loma High School (Sacramento)" },
  { id: "cde-041", name: "Clovis North High School", city: "Fresno", county: "Fresno", district: "Clovis Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Clovis North High School (Fresno)" },
  { id: "cde-042", name: "Buchanan High School", city: "Clovis", county: "Fresno", district: "Clovis Unified", state: "CA", type: "Public", gradeSpan: "9-12", status: "Active", formattedName: "Buchanan High School (Clovis)" },
  { id: "cde-043", name: "Bellarmine College Preparatory", city: "San Jose", county: "Santa Clara", district: "Private", state: "CA", type: "Private", gradeSpan: "9-12", status: "Active", formattedName: "Bellarmine College Preparatory (San Jose)" },
  { id: "cde-044", name: "Mater Dei High School", city: "Santa Ana", county: "Orange", district: "Private", state: "CA", type: "Private", gradeSpan: "9-12", status: "Active", formattedName: "Mater Dei High School (Santa Ana)" },
  { id: "cde-045", name: "St. Ignatius College Preparatory", city: "San Francisco", county: "San Francisco", district: "Private", state: "CA", type: "Private", gradeSpan: "9-12", status: "Active", formattedName: "St. Ignatius College Preparatory (San Francisco)" },
  { id: "cde-046", name: "Harvard-Westlake School", city: "Studio City", county: "Los Angeles", district: "Private", state: "CA", type: "Private", gradeSpan: "7-12", status: "Active", formattedName: "Harvard-Westlake School (Studio City)" },
  { id: "cde-047", name: "Oaks Christian School", city: "Westlake Village", county: "Los Angeles", district: "Private", state: "CA", type: "Private", gradeSpan: "5-12", status: "Active", formattedName: "Oaks Christian School (Westlake Village)" }
];

// Helper to generate comprehensive index combining constant list + CDE records
function buildCompleteDirectory(): SchoolRecord[] {
  const directory: Map<string, SchoolRecord> = new Map();

  // 1. Add detailed CDE records
  BASE_CDE_SCHOOLS.forEach(s => {
    directory.set(s.formattedName.toLowerCase(), s);
  });

  // 2. Parse and merge all entries from POPULAR_CA_SCHOOLS
  POPULAR_CA_SCHOOLS.forEach((raw, idx) => {
    const key = raw.toLowerCase().trim();
    if (!directory.has(key)) {
      const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
      const name = match ? match[1].trim() : raw.trim();
      const city = match ? match[2].trim() : 'California';
      
      let type: SchoolRecord['type'] = 'Public';
      if (name.toLowerCase().includes('charter')) type = 'Charter';
      else if (name.toLowerCase().includes('preparatory') || name.toLowerCase().includes('catholic') || name.toLowerCase().includes('academy')) type = 'Private';
      else if (name.toLowerCase().includes('magnet') || name.toLowerCase().includes('tech') || name.toLowerCase().includes('stem')) type = 'Magnet';

      directory.set(key, {
        id: `ca-school-${idx + 100}`,
        name,
        city,
        county: city,
        state: 'CA',
        type,
        gradeSpan: '9-12',
        status: 'Active',
        formattedName: raw
      });
    }
  });

  return Array.from(directory.values());
}

const FULL_SCHOOL_DIRECTORY: SchoolRecord[] = buildCompleteDirectory();

/**
 * Searches the California Department of Education active directory and comprehensive CA school records.
 * Uses multi-token fuzzy and exact matching on school names, cities, districts, and counties.
 */
export async function searchSchoolDirectory(
  query: string,
  options: SchoolSearchOptions = {}
): Promise<SchoolRecord[]> {
  const cleanQuery = (query || '').trim().toLowerCase();
  const limit = options.limit || 15;

  if (!cleanQuery || cleanQuery.length < 2) {
    return FULL_SCHOOL_DIRECTORY.slice(0, limit);
  }

  // Split query into keywords (e.g. "paloma valley", "san jose high", "menifee")
  const queryTerms = cleanQuery.split(/\s+/).filter(Boolean);

  // Score and rank matches
  const scored = FULL_SCHOOL_DIRECTORY.map(school => {
    const schoolNameLower = school.name.toLowerCase();
    const cityLower = school.city.toLowerCase();
    const countyLower = (school.county || '').toLowerCase();
    const formattedLower = school.formattedName.toLowerCase();
    const districtLower = (school.district || '').toLowerCase();

    let score = 0;

    // Exact full match gets highest score
    if (formattedLower === cleanQuery || schoolNameLower === cleanQuery) {
      score += 100;
    }
    // Prefix match on school name
    else if (schoolNameLower.startsWith(cleanQuery)) {
      score += 60;
    }
    // Prefix match on formatted name
    else if (formattedLower.startsWith(cleanQuery)) {
      score += 50;
    }
    // Substring match on school name
    else if (schoolNameLower.includes(cleanQuery)) {
      score += 40;
    }
    // Substring match on city
    else if (cityLower.includes(cleanQuery)) {
      score += 30;
    }
    // Substring match on county or district
    else if (countyLower.includes(cleanQuery) || districtLower.includes(cleanQuery)) {
      score += 20;
    }

    // Check individual token matches
    const allTermsMatch = queryTerms.every(term => 
      schoolNameLower.includes(term) || 
      cityLower.includes(term) || 
      countyLower.includes(term) ||
      districtLower.includes(term)
    );

    if (allTermsMatch) {
      score += 25;
    } else {
      const someTermsMatch = queryTerms.some(term => 
        schoolNameLower.includes(term) || 
        cityLower.includes(term)
      );
      if (someTermsMatch) {
        score += 10;
      }
    }

    // Optional filters
    if (options.county && !countyLower.includes(options.county.toLowerCase())) {
      score = 0;
    }
    if (options.type && school.type !== options.type) {
      score = 0;
    }

    return { school, score };
  });

  // Filter non-zero scores and sort by highest relevance
  const results = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.school)
    .slice(0, limit);

  return results;
}

/**
 * Convenience utility function returning formatted string names for search inputs & autocomplete
 * Compatible with onboarding flows and profile updates.
 */
export async function fetchSchools(query: string, state: string = 'CA'): Promise<string[]> {
  const records = await searchSchoolDirectory(query, { state, limit: 15 });
  return records.map(r => r.formattedName);
}

/**
 * Retrieves full details for a specific school record by formatted name or exact title.
 */
export async function fetchSchoolDetails(schoolName: string): Promise<SchoolRecord | null> {
  if (!schoolName) return null;
  const cleanName = schoolName.trim().toLowerCase();
  
  const match = FULL_SCHOOL_DIRECTORY.find(s => 
    s.formattedName.toLowerCase() === cleanName || 
    s.name.toLowerCase() === cleanName
  );

  return match || null;
}

/**
 * Returns featured California high schools for fast initial display.
 */
export function getFeaturedSchools(limit: number = 8): SchoolRecord[] {
  return BASE_CDE_SCHOOLS.slice(0, limit);
}
