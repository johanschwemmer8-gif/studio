import type { ShopperTemplateId } from './types';

export type ShopperTemplateDefinition = {
    id: ShopperTemplateId;
    name: string;
    description: string;
};

export const SHOPPER_TEMPLATE_REGISTRY: ShopperTemplateDefinition[] = [
    {
        id: 'template1',
        name: 'Ari Signature',
        description: 'A balanced flagship Ari experience for guided product decisions.',
    },
    {
        id: 'template2',
        name: 'Product Spotlight',
        description: 'A product-first experience with rich visual context and Ari assistance.',
    },
    {
        id: 'template3',
        name: 'Conversation First',
        description: 'A chat-led experience for shoppers who want guidance immediately.',
    },
    {
        id: 'template4',
        name: 'Compare & Decide',
        description: 'Structured comparison and decision support for competing options.',
    },
    {
        id: 'template5',
        name: 'Visual Discovery',
        description: 'A visual browsing experience for discovery-led retail categories.',
    },
    {
        id: 'template6',
        name: 'Expert Advisor',
        description: 'Detailed guidance for specification-heavy or considered purchases.',
    },
    {
        id: 'template7',
        name: 'Quick Assist',
        description: 'Fast answers and low-friction decision shortcuts for shoppers.',
    },
    {
        id: 'template8',
        name: 'Brand Immersive',
        description: 'Rich brand storytelling combined with Ari shopper assistance.',
    },
    {
        id: 'template9',
        name: 'Retail Media Premium',
        description: 'Shopper utility with sophisticated eligible retail media placement.',
    },
];
