import { TravelAgent } from "@/components/TravelAgent";
import heroImage from "@/assets/travel-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background/90" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Your AI Travel
            <span className="block bg-gradient-travel bg-clip-text text-transparent">
              Planning Agent
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Describe your dream destination in natural language and get a personalized, 
            day-by-day itinerary crafted just for you.
          </p>
        </div>
      </div>

      {/* Travel Agent Section */}
      <div className="container mx-auto px-4 py-16">
        <TravelAgent />
      </div>
    </div>
  );
};

export default Index;
