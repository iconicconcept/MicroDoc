import Link from "next/link";
import { Button } from "../ui/button";

const CTA = () => {
  return (
    <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white">
            Ready to Transform
            <span className="block">Your Practice?</span>
          </h2>
          
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join healthcare professionals across Nigeria who are saving hours each week and providing better patient care with MicroDoc AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 text-lg px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-12 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <div className="pt-8">
            <p className="text-blue-200 text-sm font-medium">
              No credit card required • 30-day free trial • Setup in 5 minutes • NDPR Compliant
            </p>
          </div>
        </div>
      </section>
  );
};

export default CTA;
