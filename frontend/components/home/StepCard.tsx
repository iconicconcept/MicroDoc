function StepCard({ step, title, description, icon }: { 
  step: string; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center group">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
          {step}
        </div>
        <div className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
}

export default StepCard