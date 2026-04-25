import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in the environment");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  organization: string;
  organizationMission: string;
  description: string;
  url: string;
  location: string;
  hours: string;
  tags: string[];
  date?: string; // ISO format or human readable string
  coords?: { lat: number; lng: number };
}

export async function fetchNearbyOpportunities(location: string, coords?: { lat: number; lng: number }, state?: string | null, radius: number = 50): Promise<VolunteerOpportunity[]> {
  try {
    const ai = getAI();
    let locationContext = coords 
      ? `within ${radius} miles of latitude ${coords.lat.toFixed(4)}, longitude ${coords.lng.toFixed(4)}` 
      : `within ${radius} miles of ${location}`;
    
    if (state && !location.includes(state)) {
      locationContext += ` in ${state}`;
    }

    const prompt = `Search for 12-15 real, active volunteer opportunities or organizations for high school students ${locationContext}. 
    Focus on local food banks, animal shelters, tutoring centers, and community gardens.
    Ensure you find REAL organizations with valid URLs.
    
    Include some opportunities that are specifically close to the center and some up to the ${radius} mile limit.
    Provide the response as a JSON array of objects with the following keys:
    title (event/org name), organization, organizationMission (brief 1-2 sentence mission or description of work), description (short, engaging event description), url (direct link), location (city/address), hours (est per event/week), tags (array of 2-3 categories), date (next available date in YYYY-MM-DD, or "Ongoing"), latitude, longitude.
    
    If you cannot find specific upcoming events, provide information for major local non-profits that regularly accept student volunteers in that area.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized community service locator. Your goal is to connect students with real-world impact. Verify that URLs are real. If search results are sparse, look for regional chapters of major non-profits (Red Cross, Habitat for Humanity, etc.) in the specific area mentioned.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              organization: { type: Type.STRING },
              organizationMission: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              location: { type: Type.STRING },
              hours: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              date: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER }
            },
            required: ["title", "organization", "organizationMission", "description", "url", "location", "hours", "tags", "date", "latitude", "longitude"]
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    if (data.length === 0) {
      console.warn("Gemini search returned empty results. Returning featured fallbacks.");
      return getFeaturedFallbacks(state || "the United States");
    }

    return data.map((item: any, index: number) => ({
      ...item,
      id: `real-opp-${index}-${Date.now()}`,
      coords: { lat: item.latitude, lng: item.longitude }
    }));
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return getFeaturedFallbacks(state || "the United States");
  }
}

function getFeaturedFallbacks(region: string): VolunteerOpportunity[] {
  const fallbacks = [
    {
      id: 'fb-1',
      title: 'American Red Cross Youth Volunteer',
      organization: 'American Red Cross',
      organizationMission: 'Prevents and alleviates human suffering in the face of emergencies.',
      description: 'Join a local youth chapter to help with blood drives, disaster preparedness, and community health.',
      url: 'https://www.redcross.org/volunteer/become-a-volunteer/urgent-need-for-volunteers.html',
      location: `Chapters in ${region}`,
      hours: '5-10 hrs/week',
      tags: ['Health', 'Emergency', 'Community'],
      date: 'Ongoing'
    },
    {
      id: 'fb-2',
      title: 'Habitat for Humanity Youth Program',
      organization: 'Habitat for Humanity',
      organizationMission: 'Building strength, stability and self-reliance through shelter.',
      description: 'Help build or renovate houses. Many locations have "Youth United" programs for students.',
      url: 'https://www.habitat.org/volunteer/near-you/youth-programs',
      location: `Locations in ${region}`,
      hours: 'Full Day (6-8 hrs)',
      tags: ['Construction', 'Housing', 'Teamwork'],
      date: 'Check local site'
    },
    {
      id: 'fb-3',
      title: 'Animal Shelter Support',
      organization: 'Best Friends Animal Society',
      organizationMission: 'Working to save the lives of cats and dogs in America\'s shelters.',
      description: 'Support local animal welfare. Helping with adoption events, cage cleaning, or administrative work.',
      url: 'https://bestfriends.org/volunteer',
      location: `Partner shelters in ${region}`,
      hours: '3-5 hrs/week',
      tags: ['Animals', 'Outdoors', 'Care'],
      date: 'Ongoing'
    }
  ];
  
  return fallbacks;
}

export async function searchSchools(query: string, state: string): Promise<string[]> {
  if (!query || query.length < 3) return [];
  
  try {
    const ai = getAI();
    const prompt = `Provide a JSON array of 5-10 real high school names in the state of ${state} that contain the text "${query}". Only return the array of strings.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a school directory assistant. Only return real, existing high school names.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error searching schools:", error);
    return [];
  }
}
