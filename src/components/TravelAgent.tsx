import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Clock, Plane, Users } from "lucide-react";

interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  tips: string[];
}

interface TravelPlan {
  destination: string;
  duration: number;
  overview: string;
  itinerary: ItineraryDay[];
}

interface FlightData {
  departure_token: string;
  price: number;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
}

interface FlightSearchParams {
  departureCity: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  budget: 'budget-friendly' | 'mid-range' | 'luxury';
}

interface HotelData {
  name: string;
  rating: number;
  price: number;
  image: string;
  location: string;
  amenities: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const TravelAgent = () => {
  const [userInput, setUserInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [flightParams, setFlightParams] = useState<FlightSearchParams>({
    departureCity: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    budget: 'mid-range'
  });
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [showFlightSearch, setShowFlightSearch] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Groq API key to use the travel agent.",
        variant: "destructive",
      });
      return;
    }

    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe your travel plans.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a travel expert. Analyze the user's input and determine if it's about visiting a place. If it is, extract the destination and duration, then create a detailed travel itinerary.

Response format should be a JSON object with this structure:
{
  "isTravel": boolean,
  "destination": string,
  "duration": number,
  "overview": string,
  "itinerary": [
    {
      "day": number,
      "title": string,
      "activities": [string],
      "tips": [string]
    }
  ]
}

If it's not about travel, set isTravel to false and provide a brief explanation.
Make the itinerary detailed, practical, and exciting with specific recommendations.`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Groq');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      if (result.isTravel) {
        setTravelPlan({
          destination: result.destination,
          duration: result.duration,
          overview: result.overview,
          itinerary: result.itinerary
        });
        setShowChatbot(true);
        setChatMessages([{
          role: 'assistant',
          content: `I've created your ${result.duration}-day itinerary for ${result.destination}! To help you find the best flights and hotels, I need some additional information. Please provide:\n\n• Departure city\n• Travel dates\n• Number of passengers\n• Budget preference (budget-friendly, mid-range, or luxury)`
        }]);
        toast({
          title: "Itinerary Generated!",
          description: `Created a ${result.duration}-day plan for ${result.destination}`,
        });
      } else {
        toast({
          title: "Not a Travel Request",
          description: "I can only help with travel planning. Please describe where you'd like to visit!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchHotels = async () => {
    if (!serpApiKey) {
      toast({
        title: "SERP API Key Required",
        description: "Please enter your SERP API key to search hotels.",
        variant: "destructive",
      });
      return;
    }

    if (!flightParams.departureDate || !flightParams.returnDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in travel dates to search hotels.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingHotels(true);
    
    try {
      // Since SERP API has CORS restrictions, we need to use a proxy or backend
      // For now, let's simulate the API call and show mock data
      toast({
        title: "CORS Issue Detected",
        description: "SERP API blocks direct browser requests. Using mock data for demonstration.",
        variant: "destructive",
      });
      
      // Mock hotel data for demonstration
      setTimeout(() => {
        const mockHotels: HotelData[] = [
          {
            name: "Conrad Maldives Rangali Island",
            rating: 4.8,
            price: 1200,
            image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=200&fit=crop",
            location: "South Ari Atoll",
            amenities: ["Private Beach", "Spa", "Pool"]
          },
          {
            name: "Four Seasons Resort Maldives",
            rating: 4.9,
            price: 1500,
            image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=300&h=200&fit=crop",
            location: "Kuda Huraa",
            amenities: ["Water Villa", "Diving Center", "Restaurant"]
          },
          {
            name: "Baros Maldives",
            rating: 4.7,
            price: 950,
            image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=300&h=200&fit=crop",
            location: "North Malé Atoll",
            amenities: ["Snorkeling", "Spa", "Beach Bar"]
          },
          {
            name: "Kurumba Maldives",
            rating: 4.5,
            price: 650,
            image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300&h=200&fit=crop",
            location: "North Malé Atoll",
            amenities: ["Kids Club", "Water Sports", "Multiple Restaurants"]
          }
        ];
        
        // Filter by budget preference
        const filteredHotels = mockHotels.filter(hotel => {
          if (flightParams.budget === 'budget-friendly') return hotel.price < 800;
          if (flightParams.budget === 'luxury') return hotel.price > 1000;
          return hotel.price >= 800 && hotel.price <= 1000;
        });
        
        setHotels(filteredHotels.length > 0 ? filteredHotels : mockHotels);
        toast({
          title: "Mock Hotels Loaded!",
          description: "Showing sample hotel data. Integrate with backend for real results.",
        });
        setIsLoadingHotels(false);
      }, 2000);
      
      return;
    } catch (error) {
      console.error('Error searching hotels:', error);
      toast({
        title: "Error",
        description: "Failed to search hotels. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHotels(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!apiKey) {
      toast({
        title: "Groq API Key Required",
        description: "Please enter your Groq API key to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    // Show loading message
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "🤔 Analyzing your message..." 
    }]);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a travel information extractor. Analyze the user's message and extract travel-related information.

Current destination: ${travelPlan?.destination || 'Not set'}
Current departure city: ${flightParams.departureCity || 'Not set'}
Current departure date: ${flightParams.departureDate || 'Not set'}
Current return date: ${flightParams.returnDate || 'Not set'}
Current passengers: ${flightParams.passengers || 1}
Current budget: ${flightParams.budget || 'mid-range'}

Extract and update ONLY the information mentioned in the user's message. Return a JSON object with this structure:
{
  "hasUpdates": boolean,
  "updates": {
    "departureCity": "string or null if not mentioned",
    "departureDate": "YYYY-MM-DD format or null if not mentioned", 
    "returnDate": "YYYY-MM-DD format or null if not mentioned",
    "passengers": number or null if not mentioned,
    "budget": "budget-friendly" | "mid-range" | "luxury" or null if not mentioned
  },
  "responseMessage": "A friendly response about what was updated or asking for clarification",
  "needsMoreInfo": boolean
}

Be smart about date parsing - handle formats like "August 5th", "5/8/2025", "next week", etc.
For budget, look for keywords like cheap/affordable/budget (budget-friendly), moderate/mid-range (mid-range), expensive/luxury/premium (luxury).
For passengers, look for numbers and context like "3 people", "with 2 friends", "family of 4", etc.`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Groq');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Remove loading message
      setChatMessages(prev => prev.slice(0, -1));

      if (result.hasUpdates) {
        setFlightParams(prev => ({
          ...prev,
          ...(result.updates.departureCity && { departureCity: result.updates.departureCity }),
          ...(result.updates.departureDate && { departureDate: result.updates.departureDate }),
          ...(result.updates.returnDate && { returnDate: result.updates.returnDate }),
          ...(result.updates.passengers && { passengers: result.updates.passengers }),
          ...(result.updates.budget && { budget: result.updates.budget }),
        }));
        
        if (!showFlightSearch) {
          setShowFlightSearch(true);
        }
      }

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.responseMessage 
      }]);

    } catch (error) {
      console.error('Error parsing message:', error);
      // Remove loading message
      setChatMessages(prev => prev.slice(0, -1));
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I had trouble understanding your message. Could you please rephrase it or provide more specific details like departure city, dates, number of passengers, or budget preference?" 
      }]);
    }
  };

  const searchFlights = async () => {
    if (!serpApiKey) {
      toast({
        title: "SERP API Key Required",
        description: "Please enter your SERP API key to search flights.",
        variant: "destructive",
      });
      return;
    }

    if (!flightParams.departureCity || !flightParams.departureDate || !flightParams.returnDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all flight search details.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFlights(true);
    
    try {
      // Since SERP API has CORS restrictions, we need to use a proxy or backend
      // For now, let's simulate the API call and show mock data
      toast({
        title: "CORS Issue Detected",
        description: "SERP API blocks direct browser requests. Using mock data for demonstration.",
        variant: "destructive",
      });
      
      // Mock flight data for demonstration
      setTimeout(() => {
        const mockFlights: FlightData[] = [
          {
            departure_token: "mock_1",
            price: 850,
            airline: "Emirates",
            flight_number: "EK-385",
            departure_time: "10:30 AM",
            arrival_time: "6:45 PM",
            duration: "8h 15m",
            stops: 1
          },
          {
            departure_token: "mock_2", 
            price: 920,
            airline: "Qatar Airways",
            flight_number: "QR-657",
            departure_time: "2:15 PM",
            arrival_time: "11:30 PM",
            duration: "9h 15m",
            stops: 1
          },
          {
            departure_token: "mock_3",
            price: 1150,
            airline: "Singapore Airlines",
            flight_number: "SQ-439",
            departure_time: "11:45 PM",
            arrival_time: "7:30 AM+1",
            duration: "7h 45m",
            stops: 0
          }
        ];
        
        setFlights(mockFlights);
        toast({
          title: "Mock Flights Loaded!",
          description: "Showing sample flight data. Integrate with backend for real results.",
        });
        setIsLoadingFlights(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error searching flights:', error);
      toast({
        title: "Error",
        description: "Failed to search flights. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFlights(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Form */}
      <Card className="border-0 shadow-travel bg-gradient-sky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Plane className="h-8 w-8 text-primary" />
            Travel Planning Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Groq API Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="bg-background/80 backdrop-blur-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter your Groq API key to generate travel itineraries (using Llama3-70B model)
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe Your Travel Plans</label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="I want to visit Paris for 5 days with my family..."
                className="min-h-24 bg-background/80 backdrop-blur-sm resize-none"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              variant="travel"
              size="lg"
              className="w-full"
            >
              {isLoading ? "Creating Your Itinerary..." : "Plan My Trip"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Travel Plan Display */}
      {travelPlan && (
        <Card className="border-0 shadow-warm">
          <CardHeader className="bg-gradient-sunset text-accent-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="h-8 w-8" />
              {travelPlan.destination}
            </CardTitle>
            <div className="flex items-center gap-4 text-accent-foreground/90">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {travelPlan.duration} Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg mb-6 text-muted-foreground">{travelPlan.overview}</p>
            
            <div className="space-y-6">
              {travelPlan.itinerary.map((day, index) => (
                <Card key={index} className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {day.day}
                      </div>
                      {day.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Activities
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {day.activities.map((activity, i) => (
                            <li key={i} className="text-muted-foreground">• {activity}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">💡 Tips</h4>
                        <ul className="space-y-1 text-sm">
                          {day.tips.map((tip, i) => (
                            <li key={i} className="text-muted-foreground">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chatbot Interface */}
      {showChatbot && (
        <Card className="border-0 shadow-warm">
          <CardHeader className="bg-gradient-sunset text-accent-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              🤖 Travel Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-4' 
                      : 'bg-muted text-muted-foreground mr-4'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tell me your departure city, dates, budget preference..."
                className="flex-1"
              />
              <Button type="submit" variant="travel">Send</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Flight Search Form */}
      {showFlightSearch && (
        <Card className="border-0 shadow-travel bg-gradient-sky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plane className="h-6 w-6 text-primary" />
              Find Flights to {travelPlan?.destination}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">SERP API Key</label>
              <Input
                type="password"
                value={serpApiKey}
                onChange={(e) => setSerpApiKey(e.target.value)}
                placeholder="Your SERP API key..."
                className="bg-background/80 backdrop-blur-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter your SERP API key to search for flights
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departure City</label>
                <Input
                  value={flightParams.departureCity}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, departureCity: e.target.value }))}
                  placeholder="New York, London, etc."
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Passengers
                </label>
                <Input
                  type="number"
                  min="1"
                  max="9"
                  value={flightParams.passengers}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget Preference</label>
                <select
                  value={flightParams.budget}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, budget: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background/80 backdrop-blur-sm"
                >
                  <option value="budget-friendly">Budget-friendly</option>
                  <option value="mid-range">Mid-range</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departure Date</label>
                <Input
                  type="date"
                  value={flightParams.departureDate}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Return Date</label>
                <Input
                  type="date"
                  value={flightParams.returnDate}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={searchFlights}
                disabled={isLoadingFlights}
                variant="travel"
                size="lg"
                className="w-full"
              >
                {isLoadingFlights ? "Searching Flights..." : "Search Flights"}
              </Button>
              <Button 
                onClick={searchHotels}
                disabled={isLoadingHotels}
                variant="travel"
                size="lg"
                className="w-full"
              >
                {isLoadingHotels ? "Searching Hotels..." : "Search Hotels"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Results */}
      {flights.length > 0 && (
        <Card className="border-0 shadow-warm">
          <CardHeader className="bg-gradient-sunset text-accent-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plane className="h-6 w-6" />
              Available Flights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {flights.map((flight, index) => (
                <Card key={index} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{flight.airline}</Badge>
                          <span className="text-sm text-muted-foreground">{flight.flight_number}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Departure</p>
                            <p className="text-muted-foreground">{flight.departure_time}</p>
                          </div>
                          <div>
                            <p className="font-medium">Arrival</p>
                            <p className="text-muted-foreground">{flight.arrival_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{flight.duration}</span>
                          <span>{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${flight.price}</p>
                        <p className="text-xs text-muted-foreground">per person</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotel Results */}
      {hotels.length > 0 && (
        <Card className="border-0 shadow-warm">
          <CardHeader className="bg-gradient-sunset text-accent-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              🏨 Available Hotels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {hotels.map((hotel, index) => (
                <Card key={index} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {hotel.image && (
                        <img src={hotel.image} alt={hotel.name} className="w-20 h-20 object-cover rounded-md" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{hotel.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < hotel.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">({hotel.rating})</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{hotel.location}</p>
                        {hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {hotel.amenities.map((amenity, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{amenity}</Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xl font-bold text-primary">${hotel.price}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};