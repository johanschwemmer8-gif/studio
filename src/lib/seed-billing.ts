
'use server';

import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function seedBillingData() {
    const retailerId = 'ret_123xyz';
    const subDocRef = db.collection('subscriptions').doc(retailerId);

    try {
        const doc = await subDocRef.get();
        if (doc.exists) {
            console.log('Billing data already seeded for retailer:', retailerId);
            return;
        }

        console.log('Seeding billing data for retailer:', retailerId);

        // 1. Create the main subscription document
        const subscriptionData = {
            retailerId: retailerId,
            planId: 'pro',
            status: 'active',
            nextBillingDate: Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
            paymentMethod: {
                cardType: 'Visa',
                last4: '4242'
            },
            stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`
        };
        await subDocRef.set(subscriptionData);

        // 2. Create invoices in the subcollection
        const invoicesRef = subDocRef.collection('invoices');
        const invoices = [
            {
                invoiceId: 'INV-2024-001',
                date: Timestamp.fromDate(new Date('2024-05-01')),
                amount: 1250.00,
                status: 'Paid',
                pdfUrl: '#'
            },
            {
                invoiceId: 'INV-2024-002',
                date: Timestamp.fromDate(new Date('2024-04-01')),
                amount: 1250.00,
                status: 'Paid',
                pdfUrl: '#'
            },
            {
                invoiceId: 'INV-2024-003',
                date: Timestamp.fromDate(new Date('2024-03-01')),
                amount: 999.00,
                status: 'Paid',
                pdfUrl: '#'
            }
        ];

        const batch = db.batch();
        invoices.forEach(invoice => {
            const invoiceRef = invoicesRef.doc(); // Auto-generate ID
            batch.set(invoiceRef, invoice);
        });
        await batch.commit();

        console.log('Successfully seeded billing data.');

    } catch (error) {
        console.error('Error seeding billing data:', error);
    }
}
