import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

function FeatureCard({ icon, title, description, gradient }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <Card className="group medical-card-hover bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 medical-shadow hover:border-primary/20 transition-all duration-500">
      <CardHeader className="p-0 mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-r ${gradient} w-fit text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 leading-relaxed text-base">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export default FeatureCard;