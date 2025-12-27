import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <AlertCircle className="w-24 h-24 text-amber-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {description}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/browse">Browse Auctions</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
