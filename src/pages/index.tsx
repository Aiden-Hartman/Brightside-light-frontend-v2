import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import MessageBubble from '../components/Chat/MessageBubble';
import ChatInput from '../components/Chat/ChatInput';
import AnalyzingIndicator from '../components/Chat/AnalyzingIndicator';
import CategoryPanel from '../components/Selection/CategoryPanel';
import ProductRow from '../components/Selection/ProductRow';
import SummaryPanel from '../components/Selection/SummaryPanel';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SummarySidePanel, { SummaryPanelHandle } from '../components/Selection/SummarySidePanel';
import { PRODUCT_CATEGORIES, AI_PROMPTS } from '../lib/constants';
import { Product, ChatMessage } from '../types';
import { fetchProducts, askAboutProducts, fetchAllProducts, classifyGPTMessage, compareProductsWithAI, explainProductWithAI } from '../lib/api';
import { getCachedProducts, setCachedProducts, getGPTAllProductsCache, setGPTAllProductsCache } from '../lib/dataCache';
import { animateProductImage } from '../lib/animateProductImage';

export default function HomePage() {
  const [openSection, setOpenSection] = useState<string | null>(PRODUCT_CATEGORIES[0].key);
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product, catKey: string }[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [categoryLoading, setCategoryLoading] = useState<Record<string, boolean>>({});
  const [categoryError, setCategoryError] = useState<Record<string, boolean>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [lastChatRequest, setLastChatRequest] = useState<{ message: string; context: any } | null>(null);
  const [nextShimmerShown, setNextShimmerShown] = useState<Record<string, boolean>>({});
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null);
  
  // New state for side panel
  const [lastSelectedProduct, setLastSelectedProduct] = useState<Product | null>(null);
  // Add state for lastSelectedProductCatKey
  const [lastSelectedProductCatKey, setLastSelectedProductCatKey] = useState<string | null>(null);

  // Add this effect to reset animation trigger state whenever openSection changes
  useEffect(() => {
    setLastSelectedProduct(null);
    setLastSelectedProductCatKey(null);
  }, [openSection]);

  const summaryPanelRef = useRef<SummaryPanelHandle>(null);

  // Layout constants for perfect alignment
  const CHAT_WIDTH = 384;
  const MAIN_WIDTH = 900;
  const GAP = 48;
  const GROUP_WIDTH = CHAT_WIDTH + GAP + MAIN_WIDTH;
  const groupLeft = `calc(50vw - ${GROUP_WIDTH / 2}px)`;
  const mainTopMargin = '2.5vh'; // To match the chat's top margin

  // Fetch products when a panel is opened
  useEffect(() => {
    if (!openSection) return;
    if (categoryProducts[openSection] || getCachedProducts(openSection)) return;
    setCategoryLoading((prev) => ({ ...prev, [openSection]: true }));
    setCategoryError((prev) => ({ ...prev, [openSection]: false }));
    fetchProducts({ category: openSection }, 3)
      .then((products) => {
        if (products.length > 0) {
          setCachedProducts(openSection, products);
          setCategoryProducts((prev) => ({ ...prev, [openSection]: products }));
        } else {
          setCategoryError((prev) => ({ ...prev, [openSection]: true }));
        }
      })
      .catch(() => {
        setCategoryError((prev) => ({ ...prev, [openSection]: true }));
      })
      .finally(() => {
        setCategoryLoading((prev) => ({ ...prev, [openSection]: false }));
      });
  }, [openSection, categoryProducts]);

  // Load from cache on mount
  useEffect(() => {
    const cached: Record<string, Product[]> = {};
    PRODUCT_CATEGORIES.forEach((cat) => {
      const cachedProducts = getCachedProducts(cat.key);
      if (cachedProducts) {
        cached[cat.key] = cachedProducts;
      }
    });
    if (Object.keys(cached).length > 0) {
      setCategoryProducts(cached);
    }
  }, []);

  // Chat send handler
  const handleSendChat = async (customMessage?: string, customContext?: any) => {
    const message = customMessage ?? chatInput;
    if (!message.trim()) return;
    setChatLoading(true);
    setChatError(false);
    setChatInput('');
    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, userMsg]);

    console.group('🤖 GPT Chat Flow');
    console.log('📝 User Message:', message);

    try {
      // Get all products (from cache or fetch)
      console.log('🔄 Checking product cache...');
      let allProducts = getGPTAllProductsCache();
      if (!allProducts) {
        console.log('📦 Cache miss - fetching all products...');
        allProducts = await fetchAllProducts();
        setGPTAllProductsCache(allProducts);
        console.log('✅ Fetched products:', allProducts.map(p => p.title).join(', '));
      } else {
        console.log('✅ Using cached products:', allProducts.map(p => p.title).join(', '));
      }

      // Layer 1: Classify the message
      console.log('🔍 Layer 1: Classifying message...');
      const classification = await classifyGPTMessage(message, allProducts);
      console.log('📊 Classification result:', {
        status: classification.status,
        requiredProducts: classification.required_context
      });

      if (classification.status === 'fallback') {
        console.log('⚠️ Fallback case detected - no relevant products found');
        // Handle fallback case
        const fallbackContext = {
          products: [],
          answers: [],
          summary: '',
          chatMessages: [...chatMessages, userMsg].slice(-5)
        };
        console.log('🔄 Layer 2: Sending fallback request to GPT...');
        const reply = await askAboutProducts(message, fallbackContext);
        if (!reply) throw new Error('Failed to get fallback response');
        console.log('✅ Fallback response received:', reply);
        setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } else {
        // Layer 2: Get response with filtered context
        console.log('🔄 Layer 2: Filtering products for context...');
        const requiredProducts = allProducts.filter(p => 
          classification.required_context.includes(p.title)
        );
        console.log('📦 Selected products for context:', requiredProducts.map(p => p.title).join(', '));
        
        const context = {
          products: requiredProducts,
          answers: [],
          summary: '',
          chatMessages: [...chatMessages, userMsg].slice(-5)
        };
        console.log('🔄 Layer 2: Sending request to GPT with filtered context...');
        const reply = await askAboutProducts(message, context);
        if (!reply) throw new Error('Failed to get GPT response');
        console.log('✅ GPT response received:', reply);
        setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (error) {
      console.error('❌ Error in chat flow:', error);
      setChatError(true);
    } finally {
      setChatLoading(false);
      console.groupEnd();
    }
  };

  // Retry handler
  const handleRetryChat = () => {
    if (lastChatRequest) {
      handleSendChat(lastChatRequest.message, lastChatRequest.context);
    }
  };

  // Special handler for Explain with AI
  const handleExplainWithAI = async (product: Product) => {
    const message = `Explain ${product.title}`;
    setChatLoading(true);
    setChatError(false);
    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    
    try {
      console.group('🤖 AI Explanation Flow');
      console.log('📝 User Message:', message);
      console.log('📦 Product:', product.title);
      
      // Check cache first - use the product directly since we already have it
      console.log('🔄 Using product from context:', product.title);
      
      // Bypass classification layer and directly call GPT with custom prompt
      console.log('🔄 Sending request to GPT with custom prompt...');
      const reply = await explainProductWithAI(product, chatMessages);
      
      if (!reply) throw new Error('Failed to get explanation response');
      console.log('✅ Explanation response received:', reply);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('❌ Error in explanation flow:', error);
      setChatError(true);
    } finally {
      setChatLoading(false);
      console.groupEnd();
    }
  };

  // Helper: scroll to open panel
  const scrollToPanel = (catKey: string) => {
    const el = document.querySelector(`[data-category-panel="${catKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper: get current category index
  const getCurrentCategoryIndex = () => {
    if (openSection === 'summary' || openSection === null) return -1;
    return PRODUCT_CATEGORIES.findIndex(c => c.key === openSection);
  };

  // Handler: Previous/Next navigation
  const handleNavigateCategory = (direction: 'prev' | 'next') => {
    // Reset animation trigger state when changing categories
    setLastSelectedProduct(null);
    setLastSelectedProductCatKey(null);
    const idx = getCurrentCategoryIndex();
    if (idx === -1) return;
    if (direction === 'next') {
      if (idx === PRODUCT_CATEGORIES.length - 1) {
        // Open the side panel instead of the summary dropdown
        return;
      }
      const newKey = PRODUCT_CATEGORIES[idx + 1].key;
      setOpenSection(newKey);
      setPendingScrollKey(newKey); // set pending scroll
    } else {
      if (idx === 0) return;
      const newKey = PRODUCT_CATEGORIES[idx - 1].key;
      setOpenSection(newKey);
      setPendingScrollKey(newKey); // set pending scroll
    }
  };

  // Effect: scroll after panel open animation completes
  useEffect(() => {
    if (!pendingScrollKey) return;
    // Wait for panel to open, then scroll (handled by onPanelOpenComplete)
  }, [pendingScrollKey]);

  // Handler: Compare with AI
  const handleCompareWithAI = async (catKey: string) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.key === catKey);
    const message = `Compare the ${cat?.label || catKey} products`;
    setChatLoading(true);
    setChatError(false);
    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    
    try {
      console.group('🤖 AI Comparison Flow');
      console.log('📝 User Message:', message);
      console.log('📦 Category:', catKey);
      
      // Check cache first
      console.log('🔄 Checking product cache...');
      let products = getCachedProducts(catKey);
      if (!products || products.length === 0) {
        console.log('📦 Cache miss - fetching products...');
        products = await fetchProducts({ category: catKey }, 10); // Get more products to ensure we have all 3
        if (products.length > 0) {
          setCachedProducts(catKey, products);
        }
      }
      
      console.log('✅ Using products:', products.map(p => p.title).join(', '));
      
      // Bypass classification layer and directly call GPT with custom prompt
      console.log('🔄 Sending request to GPT with custom prompt...');
      const reply = await compareProductsWithAI(products, chatMessages);
      
      if (!reply) throw new Error('Failed to get comparison response');
      console.log('✅ Comparison response received:', reply);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('❌ Error in comparison flow:', error);
      setChatError(true);
    } finally {
      setChatLoading(false);
      console.groupEnd();
    }
  };

  // Handler: Product select (add shimmer logic)
  const handleProductSelect = (catKey: string, pid: string) => {
    const prod = categoryProducts[catKey].find(p => p.id === pid);
    if (prod) {
      setSelectedProducts(prev => {
        // Remove any existing product from this category
        const filtered = prev.filter(item => item.catKey !== catKey);
        // Check if this product is already selected (deselect)
        const isSelected = prev.some(item => item.catKey === catKey && item.product.id === pid);
        if (isSelected) {
          // Deselect
          return filtered;
        } else {
          // Add new product to end or replace in place
          setLastSelectedProduct(prod);
          setLastSelectedProductCatKey(catKey);
          // Trigger the animation directly
          setTimeout(() => {
            summaryPanelRef.current?.triggerAnimation(pid);
          }, 400);
          // Shimmer logic (unchanged)
          if (!nextShimmerShown[catKey]) {
            setNextShimmerShown(shown => ({ ...shown, [catKey]: true }));
            const btn = buttonRefs.current[catKey];
            if (btn) {
              btn.classList.remove('btn-next-shimmer');
              void btn.offsetWidth;
              btn.classList.add('btn-next-shimmer');
              setTimeout(() => btn.classList.remove('btn-next-shimmer'), 1300);
            }
          }
          return [...filtered, { product: prod, catKey }];
        }
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FFFDF5] text-[#527055] flex flex-col">
      {/* Main 3-panel layout */}
      <div className="flex flex-1 flex-col md:flex-row w-full max-w-full mx-auto">
        {/* Chat Sidebar */}
        <div className="w-96 flex-shrink-0 flex flex-col z-30">
          <ChatSidebar className="glass-panel rounded-r-3xl">
            <ChatWindow>
              {chatMessages.length === 0 ? (
                <MessageBubble 
                  message="Hello! How can I assist you today? If you have any questions about our products or ingredients, feel free to ask!" 
                  role="assistant" 
                />
              ) : (
                chatMessages.map((msg, i) => (
                  <MessageBubble key={i} message={msg.content} role={msg.role} />
                ))
              )}
              {chatLoading && <AnalyzingIndicator />}
              {chatError && (
                <div className="flex flex-col items-center py-4">
                  <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-2">
                    Sorry, something went wrong. Please try again.
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleRetryChat}
                  >
                    Retry
                  </button>
                </div>
              )}
            </ChatWindow>
            <ChatInput
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onSend={() => handleSendChat()}
              disabled={chatLoading}
            />
          </ChatSidebar>
        </div>
        {/* Gap between chat and main content */}
        <div className="hidden md:block" style={{ width: '16px' }} />
        {/* Main Content */}
        <div className="flex-1 px-4 py-8 max-w-[1200px] mx-auto">
          <main>
            <div className="space-y-8">
              {PRODUCT_CATEGORIES.map((cat, idx) => (
                <CategoryPanel
                  key={cat.key}
                  title={cat.label}
                  open={openSection === cat.key}
                  onToggle={() => {
                    if (openSection !== cat.key) {
                      setOpenSection(cat.key);
                      setPendingScrollKey(cat.key);
                    } else {
                      setOpenSection(null);
                    }
                  }}
                  bannerColor="main-green"
                  data-category-panel={cat.key}
                  onPanelOpenComplete={() => {
                    if (pendingScrollKey === cat.key) {
                      scrollToPanel(cat.key);
                      setPendingScrollKey(null);
                    }
                  }}
                >
                  {/* <div className="mb-6 text-white/90">
                    Here are our top three options for {cat.label.toLowerCase()} products.
                  </div> */}
                  {categoryLoading[cat.key] ? (
                    <LoadingSpinner />
                  ) : categoryError[cat.key] ? (
                    <div className="text-red-200 py-4">
                      Sorry, we couldn't load products for this category. Please try again later.
                    </div>
                  ) : categoryProducts[cat.key] && categoryProducts[cat.key].length > 0 ? (
                    <>
                      <ProductRow
                        products={categoryProducts[cat.key]}
                        selectedProductIds={selectedProducts.filter(item => item.catKey === cat.key).map(item => item.product.id) || []}
                        onSelect={pid => handleProductSelect(cat.key, pid)}
                        onExplainWithAI={handleExplainWithAI}
                      />
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex gap-3">
                          {idx !== 0 && (
                            <button
                              className="px-6 py-2 rounded-lg font-body bg-dark-green-start text-white transition-all duration-300 hover:bg-orange-cream hover:text-dark-green-start"
                              onClick={() => handleNavigateCategory('prev')}
                            >
                              ← Previous
                            </button>
                          )}
                          <button
                            ref={el => (buttonRefs.current[cat.key] = el)}
                            className="px-6 py-2 rounded-lg font-body bg-dark-green-start text-white transition-all duration-300 hover:bg-orange-cream hover:text-dark-green-start focus:outline-none"
                            onClick={() => handleNavigateCategory('next')}
                          >
                            Next →
                          </button>
                        </div>
                        <button
                          className="px-6 py-2 rounded-lg font-body bg-white border border-orange-cream text-orange-cream flex items-center gap-2 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-cream/50"
                          onClick={() => { handleCompareWithAI(cat.key); }}
                        >
                          <span role="img" aria-label="sparkles">✨</span>
                          <span className="shimmer-text">Compare products with AI</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-white/70 py-4">
                      No products found for this category.
                    </div>
                  )}
                </CategoryPanel>
              ))}
            </div>
          </main>
        </div>
        {/* Gap between main content and summary panel */}
        <div className="hidden md:block" style={{ width: '16px' }} />
        {/* Summary Panel - always open */}
        <div className="w-96 flex-shrink-0 flex flex-col z-30">
          <SummarySidePanel
            ref={summaryPanelRef}
            selectedProducts={selectedProducts.map(item => item.product)}
            total={selectedProducts.reduce((sum, item) => sum + (item.product.price || 0), 0)}
          />
        </div>
      </div>
    </div>
  );
} 