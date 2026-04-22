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

export async function fetchNearbyOpportunities(location: string, coords?: { lat: number; lng: number }, state?: string | null): Promise<VolunteerOpportunity[]> {
  try {
    const ai = getAI();
    let locationContext = coords 
      ? `near coordinates (${coords.lat}, ${coords.lng})` 
      : `in or near ${location}`;
    
    if (state && !coords) {
      locationContext += ` in the state of ${state}`;
    }

    const prompt = `Find 7-10 real, current community service websites or organizations for high school students ${locationContext}.
    Provide the response as a JSON array of objects with the following keys:
    title (event/org name), organization, organizationMission (brief 1-2 sentence mission or description of work), description (short, engaging event description), url (direct link), location, hours (est per event), tags (array of 2-3 categories), date (approximate next date in YYYY-MM-DD format if applicable, otherwise today's date), latitude, longitude.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant for high school students looking for community service. Only provide real, active websites and organizations. Ensure every item has a realistic latitude and longitude based on its location.",
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
    return data.map((item: any, index: number) => ({
      ...item,
      id: `real-opp-${index}`,
      coords: { lat: item.latitude, lng: item.longitude }
    }));
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return [];
  }
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
