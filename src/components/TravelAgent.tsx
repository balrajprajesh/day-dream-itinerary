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
      const params = new URLSearchParams({
        engine: 'google_hotels',
        q: `hotels in ${travelPlan?.destination}`,
        check_in_date: flightParams.departureDate,
        check_out_date: flightParams.returnDate,
        adults: flightParams.passengers.toString(),
        currency: 'USD',
        gl: 'us',
        hl: 'en',
        api_key: serpApiKey
      });

      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SERP API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Hotel SERP API Response:', data);
      
      if (data.properties && data.properties.length > 0) {
        const formattedHotels = data.properties.slice(0, 6).map((hotel: any) => ({
          name: hotel.name || 'Hotel Name',
          rating: hotel.overall_rating || 0,
          price: hotel.rate_per_night?.lowest || 0,
          image: hotel.images?.[0]?.thumbnail || '',
          location: hotel.neighborhood || travelPlan?.destination || '',
          amenities: hotel.amenities?.slice(0, 3) || []
        }));
        
        setHotels(formattedHotels);
        toast({
          title: "Hotels Found!",
          description: `Found ${data.properties.length} available hotels`,
        });
      } else {
        toast({
          title: "No Hotels Found",
          description: "Try adjusting your search criteria.",
          variant: "destructive",
        });
      }
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

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    // Simple keyword extraction for demo
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('departure') || lowerMessage.includes('from')) {
      const cityMatch = userMessage.match(/from\s+([^,.\n]+)/i) || userMessage.match(/departure.*?([A-Za-z\s]+)/i);
      if (cityMatch) {
        setFlightParams(prev => ({ ...prev, departureCity: cityMatch[1].trim() }));
      }
    }
    
    if (lowerMessage.includes('budget')) {
      if (lowerMessage.includes('budget-friendly') || lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
        setFlightParams(prev => ({ ...prev, budget: 'budget-friendly' }));
      } else if (lowerMessage.includes('luxury') || lowerMessage.includes('premium')) {
        setFlightParams(prev => ({ ...prev, budget: 'luxury' }));
      } else {
        setFlightParams(prev => ({ ...prev, budget: 'mid-range' }));
      }
    }
    
    if (lowerMessage.includes('passenger') || lowerMessage.includes('people')) {
      const numberMatch = userMessage.match(/(\d+)/);
      if (numberMatch) {
        setFlightParams(prev => ({ ...prev, passengers: parseInt(numberMatch[1]) }));
      }
    }

    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "I've updated your preferences! Feel free to provide more details or use the search forms below to find flights and hotels." 
    }]);
    
    setShowFlightSearch(true);
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
      const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: flightParams.departureCity,
        arrival_id: travelPlan?.destination || '',
        outbound_date: flightParams.departureDate,
        return_date: flightParams.returnDate,
        adults: flightParams.passengers.toString(),
        currency: 'USD',
        hl: 'en',
        api_key: serpApiKey
      });

      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SERP API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('SERP API Response:', data);
      
      if (data.best_flights && data.best_flights.length > 0) {
        setFlights(data.best_flights.slice(0, 5)); // Show top 5 flights
        toast({
          title: "Flights Found!",
          description: `Found ${data.best_flights.length} available flights`,
        });
      } else {
        toast({
          title: "No Flights Found",
          description: "Try adjusting your search criteria.",
          variant: "destructive",
        });
      }
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