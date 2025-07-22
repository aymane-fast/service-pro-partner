"use client";
import { useState, useEffect, use } from 'react';
import { quoteService } from '@/api/quoteService';
import InvoiceTemplate from '@/app/components/InvoiceTemplate';

export default function InvoicePage({ params }) {
  const resolvedParams = use(params);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set document title for this page
  useEffect(() => {
    document.title = 'Service Pro - Invoice';
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        console.log('Fetching quote with ID:', resolvedParams.id);
        const quotes = await quoteService.getQuotes();
        console.log('All quotes:', quotes);
        // Convert both IDs to strings for comparison
        const foundQuote = quotes.find(q => String(q.id) === String(resolvedParams.id));
        console.log('Found quote:', foundQuote);
        setQuote(foundQuote);
        
        // Update title with quote info once loaded
        if (foundQuote) {
          document.title = `Service Pro - Invoice #${foundQuote.id}`;
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Chargement...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">
          Facture non trouvée (ID: {resolvedParams.id})
        </div>
      </div>
    );
  }

  return <InvoiceTemplate quote={quote} onLoad={handlePrint} />;
}
