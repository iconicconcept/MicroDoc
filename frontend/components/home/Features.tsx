import React from "react";
import FeatureCard from "./FeatureCard";

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Nigerian Healthcare Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Designed specifically to address the unique challenges faced by
            healthcare workers in Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon="🎤"
            title="Voice-to-Text Notes"
            description="Record clinical observations with AI-powered transcription that works even in low-network areas."
          />
          <FeatureCard
            icon="🔬"
            title="Smart Lab Reports"
            description="Automate microbiology lab documentation with AI suggestions for common pathogens and tests."
          />
          <FeatureCard
            icon="💖"
            title="Burnout Prevention"
            description="Track workload and get personalized recommendations to maintain mental wellbeing."
          />
          <FeatureCard
            icon="📱"
            title="Offline-First Design"
            description="Work seamlessly without internet connection. Data syncs automatically when online."
          />
          <FeatureCard
            icon="🛡️"
            title="NDPR Compliant"
            description="Built with Nigerian data protection regulations in mind from the ground up."
          />
          <FeatureCard
            icon="⚡"
            title="Fast & Reliable"
            description="Optimized for the unique infrastructure challenges in Nigerian healthcare settings."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
