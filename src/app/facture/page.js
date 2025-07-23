"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Search, Download } from "lucide-react";
import { userService } from '@/api/userService';
import DocUploadCard from '../components/DocUploadCard';
import { quoteService } from '@/api/quoteService';
import Header from '../components/Header';

const REQUIRED_DOCUMENTS = [
  "Piece d'identite",
  "Assurance",
  "Kibis ou registre de commerce",
  "URSSAF",
  "Rib",
  "Diplome et certification"
];

export default function Facture() {
  const [search, setSearch] = useState("");
  const [activeLink, setActiveLink] = useState("facture");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    totalInvoices: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user data and stats in parallel
        const [{ data: user, status }, { stats: userStats }] = await Promise.all([
          userService.getCurrentUser(),
          userService.getUserStats()
        ]);

        if (status === 'success' && user) {
          setUserData(user);
          setStats(userStats);
          console.log('User data for commission:', user); // Debug commission data

          // Fetch detailed user info with role info (partner commission)
          const userWithRoleResult = await userService.getUserWithRoleInfo(user.id);
          if (userWithRoleResult.status === 'success' && userWithRoleResult.data) {
            setPartnerInfo(userWithRoleResult.data);
            console.log('Partner role info:', userWithRoleResult.data);
            console.log('Commission from role_info:', userWithRoleResult.data.role_info?.commission);
          } else {
            console.error('Failed to fetch partner role info:', userWithRoleResult.message);
          }

          // Calculate uploaded documents count
          const uploadedCount = REQUIRED_DOCUMENTS.reduce((count, docTitle) => {
            const storageKey = `${user.id}-${docTitle}`;
            return localStorage.getItem(storageKey) ? count + 1 : count;
          }, 0);
          
          setUploadedDocsCount(uploadedCount);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        const allQuotes = await quoteService.getQuotes();
        console.log('All quotes received:', allQuotes);
        
        // Show all quotes that can be invoiced (don't filter by status)
        setQuotes(allQuotes);
        
        // Update totalInvoices count
        setStats({
          totalInvoices: allQuotes.length
        });
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setError('Failed to fetch quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    fetchUserData();
  }, []);



  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate partner earnings based on commission
  const calculatePartnerEarnings = (quote) => {
    if (!partnerInfo || !quote) return 0;
    
    // Get commission from role_info
    const commissionRate = partnerInfo.role_info?.commission;
    
    if (!commissionRate) {
      console.warn('No commission rate found in partner role_info:', partnerInfo);
      return 0;
    }
    
    console.log('Using commission rate:', commissionRate + '%');
    
    // Calculate: Total TTC - Products Cost = Service Revenue
    const totalTTC = parseFloat(quote.total) || 0;
    const productsCost = parseFloat(quote.products_total) || 0;
    const serviceRevenue = totalTTC - productsCost;
    
    // Calculate partner earnings: Service Revenue * Commission Rate
    const partnerEarnings = (serviceRevenue * commissionRate) / 100;
    
    return partnerEarnings;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const filteredQuotes = quotes.filter(quote => 
    quote.client?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    quote.client?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    quote.service_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Debug logging
  console.log('Total quotes:', quotes.length);
  console.log('Filtered quotes:', filteredQuotes.length);
  console.log('Search term:', search);

  // Calculate total partner earnings
  const totalEarnings = filteredQuotes.reduce((total, quote) => {
    return total + calculatePartnerEarnings(quote);
  }, 0);

  const totalPaidEarnings = filteredQuotes
    .filter(quote => quote.payment_status === 'paid')
    .reduce((total, quote) => {
      return total + calculatePartnerEarnings(quote);
    }, 0);

  return (
    <div className="min-h-screen bg-[#F8F4F3] p-6 flex justify-center">
      <div className="w-full max-w-7xl bg-white p-6 rounded-xl shadow-md">
        <Header 
          stats={stats}
          loading={loading}
          userData={userData}
          uploadedDocsCount={uploadedDocsCount}
          activeLink="facture"
        />

        {/* Earnings Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-700 mb-1">Total des Gains</h4>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(totalEarnings)}</p>
            <p className="text-xs text-green-600">Sur {filteredQuotes.length} facture(s)</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Gains Perçus</h4>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalPaidEarnings)}</p>
            <p className="text-xs text-blue-600">Factures payées</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <h4 className="text-sm font-medium text-orange-700 mb-1">En Attente</h4>
            <p className="text-2xl font-bold text-orange-800">{formatCurrency(totalEarnings - totalPaidEarnings)}</p>
            <p className="text-xs text-orange-600">Commission {partnerInfo?.role_info?.commission || 'Non définie'}%</p>
          </div>
        </div>

        {/* Search and List Header */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
          <h3 className="text-lg font-semibold text-[#333] flex items-center mb-4 sm:mb-0">
            Liste des factures
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher..."
              className="border rounded-lg py-2 pl-8 pr-4 w-full text-[#333] border-gray-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {/* Quotes Table */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white text-black">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 border-b text-left font-semibold">Date</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Client</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Service</th>
                <th className="px-4 py-3 border-b text-center font-semibold">Produits</th>
                <th className="px-4 py-3 border-b text-center font-semibold">Total TTC</th>
                <th className="px-4 py-3 border-b text-center font-semibold bg-green-50">
                  <div className="text-green-700">Vos Gains</div>
                  <div className="text-xs text-green-600 font-normal">
                    Commission {partnerInfo?.role_info?.commission || 'Non définie'}%
                  </div>
                </th>
                <th className="px-4 py-3 border-b text-center font-semibold">Paiement</th>
                <th className="px-4 py-3 border-b text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const partnerEarnings = calculatePartnerEarnings(quote);
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 border-b text-left">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-4 py-3 border-b text-left">
                        <div className="font-medium">{quote.client.first_name} {quote.client.last_name}</div>
                        <div className="text-sm text-gray-500">{quote.client.email}</div>
                      </td>
                      <td className="px-4 py-3 border-b text-left">
                        <div className="font-medium">{quote.service_name}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(quote.service_price)}</div>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <div className="text-sm">
                          {quote.products?.length > 0 ? quote.products.map(p => p.name).join(', ') : 'Aucun produit'}
                        </div>
                        <div className="text-sm text-gray-500">{formatCurrency(quote.products_total)}</div>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <div className="font-medium text-lg">{formatCurrency(quote.total)}</div>
                        <div className="text-xs text-gray-500">
                          HT: {formatCurrency(quote.subtotal)} + TVA: {formatCurrency(quote.tva_amount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b text-center bg-green-50">
                        <div className="font-bold text-lg text-green-700">
                          {formatCurrency(partnerEarnings)}
                        </div>
                        <div className="text-xs text-green-600">
                          Sur {formatCurrency(parseFloat(quote.total) - parseFloat(quote.products_total))} de service
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quote.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quote.payment_status === 'paid' ? 'Payé' : 'Non payé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <button
                          onClick={() => {
                            const quoteId = String(quote.id);
                            console.log('Opening invoice for quote:', quoteId);
                            window.open(`/invoice/${quoteId}`, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}