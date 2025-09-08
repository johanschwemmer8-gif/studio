
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Code, MessageCircle, Share2, Sparkles } from 'lucide-react';

export default function SystemIntegrationPage() {

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Generative AI Capabilities</h2>
        <p className="text-muted-foreground max-w-3xl">
          This dashboard showcases the powerful Generative AI features integrated into the iNteract-AOE platform to create a personalized and engaging in-store experience.
        </p>
      </div>
      <Separator />

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-accent" />
                    AI-Powered Cross-Sell Recommendations
                </CardTitle>
                <CardDescription>
                    Dynamically generate relevant product suggestions to increase basket size and enhance the customer's shopping journey.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="leading-relaxed">
                    When a customer scans a product's QR code, our AI engine analyzes its attributes (name, category, price) and instantly generates a list of complementary products. This goes beyond simple "frequently bought together" lists by providing a contextual reason for each recommendation, encouraging upsells and cross-sells.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                         <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="text-green-500" /> Key Features</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Real-time recommendation generation.</li>
                            <li>Contextual reasoning for each suggestion.</li>
                            <li>Seamless integration into the product details page.</li>
                            <li>Directly drives revenue uplift and bigger basket sizes.</li>
                         </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Share2 className="text-blue-500" /> Integration Points</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li><strong>Trigger:</strong> Customer scans a QR code.</li>
                            <li><strong>Input:</strong> Scanned product's data.</li>
                            <li><strong>AI Flow:</strong> `generateCrossSellRecommendations`</li>
                            <li><strong>Output:</strong> Displayed on product page (`/product/[id]`).</li>
                         </ul>
                    </div>
                </div>
                 <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    <code className="font-code">
{`// src/ai/flows/generate-cross-sell-recommendations.ts

const prompt = ai.definePrompt({
  name: 'generateCrossSellRecommendationsPrompt',
  prompt: \`You are an expert retail sales assistant. A customer has scanned a product.
  Based on the details of the scanned product, recommend other products that the customer may be interested in purchasing...
  
  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}\`
});`}
                    </code>
                </pre>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="text-accent" />
                    Conversational AI Chatbot
                </CardTitle>
                <CardDescription>
                    Engage customers with a friendly, knowledgeable AI assistant that can answer product-specific questions in real time.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="leading-relaxed">
                    Elevate the customer service experience by offering an AI-powered chatbot directly on the product page. Customers can ask anything from "Is this item waterproof?" to "What other colors does this come in?". The AI uses the product's information and a natural, conversational tone to provide instant, accurate answers, keeping customers engaged and informed.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                         <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="text-green-500" /> Key Features</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Answers natural language questions.</li>
                            <li>Maintains conversation history for context.</li>
                            <li>Acts as a 24/7 in-store sales assistant.</li>
                            <li>Reduces friction in the purchasing process.</li>
                         </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Share2 className="text-blue-500" /> Integration Points</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                             <li><strong>Trigger:</strong> Customer clicks "Chat with an Assistant".</li>
                            <li><strong>Input:</strong> Product data and user's chat history.</li>
                            <li><strong>AI Flow:</strong> `productChat`</li>
                            <li><strong>Output:</strong> A conversational response in the chat UI.</li>
                         </ul>
                    </div>
                </div>
                 <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    <code className="font-code">
{`// src/ai/flows/product-chat-flow.ts

const llmResponse = await ai.generate({
    prompt: \`You are a friendly and helpful in-store sales assistant. Your goal is to answer the customer's questions about the product...

    Here is the product information:
    - Name: \${input.product.name}
    - Description: \${input.product.description}\`,
    history: chatHistory,
});`}
                    </code>
                </pre>
            </CardContent>
        </Card>

    </div>
  );
}
