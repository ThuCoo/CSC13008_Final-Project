import Header from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Help & Support</h1>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>How does Auto-bidding work?</AccordionTrigger>
              <AccordionContent>
                The system automatically bids for you up to your max price[cite:
                322].
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Seller Upgrade?</AccordionTrigger>
              <AccordionContent>
                Requests are valid for 7 days upon approval.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
