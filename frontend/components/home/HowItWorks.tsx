import React from "react";
import StepCard from "./StepCard";

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple. Fast. Effective.
          </h2>
          <p className="text-xl text-gray-600">
            Get started in minutes and transform your clinical workflow today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StepCard
            step="1"
            title="Sign Up"
            description="Create your account in 2 minutes. No credit card required for the free trial."
          />
          <StepCard
            step="2"
            title="Set Up Your Profile"
            description="Configure your hospital, department, and preferences for personalized experience."
          />
          <StepCard
            step="3"
            title="Start Documenting"
            description="Begin creating clinical notes and lab reports with AI assistance immediately."
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
