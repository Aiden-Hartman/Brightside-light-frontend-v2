import React, { useState, useEffect } from 'react';
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
import SummaryDropdown from '../components/Selection/SummaryDropdown';
import { PRODUCT_CATEGORIES } from '../lib/constants';
import { Product, ChatMessage } from '../types';
import { fetchProducts, askAboutProducts } from '../lib/api';
import { getCachedProducts, setCachedProducts } from '../lib/dataCache';
import { sendSpecialChatRequest } from '../lib/specialChatRequest';

export default function HomePage() {
  const [openSection, setOpenSection] = useState<string | null>(PRODUCT_CATEGORIES[0].key);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Product[]>>({});
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

  // Layout constants for perfect alignment
  const CHAT_WIDTH = 384;
  const MAIN_WIDTH = 900;
  const GAP = 48;
  const GROUP_WIDTH = CHAT_WIDTH + GAP + MAIN_WIDTH;
  const groupLeft = `calc(50vw - ${GROUP_WIDTH / 2}px)`;
  const mainTopMargin = '5vh'; // To match the chat's top margin

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
    const newMessages = [...chatMessages, userMsg].slice(-5);
    const context = customContext ?? {
      products: Object.values(selectedProducts).flat(),
      answers: [],
      summary: '',
      chatMessages: newMessages,
    };
    setLastChatRequest({ message, context });
    setChatMessages((prev) => [...prev, userMsg]);
    const reply = await askAboutProducts(message, context);
    if (!reply) {
      setChatError(true);
      setChatLoading(false);
      return;
    }
    setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setChatLoading(false);
  };

  // Retry handler
  const handleRetryChat = () => {
    if (lastChatRequest) {
      handleSendChat(lastChatRequest.message, lastChatRequest.context);
    }
  };

  // Special handler for Explain with AI
  const handleExplainWithAI = async (product: Product) => {
    const message = `explain ${product.title}`;
    setChatLoading(true);
    setChatError(false);
    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    setLastChatRequest({ message, context: { products: [product], answers: [], summary: '', chatMessages: [...chatMessages, userMsg].slice(-5) } });
    const reply = await sendSpecialChatRequest({ message, product, previousMessages: chatMessages });
    if (!reply) {
      setChatError(true);
      setChatLoading(false);
      return;
    }
    setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setChatLoading(false);
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
    const idx = getCurrentCategoryIndex();
    if (idx === -1) return;
    if (direction === 'next') {
      if (idx === PRODUCT_CATEGORIES.length - 1) {
        setOpenSection('summary');
        setTimeout(() => {
          const el = document.querySelector(`[data-summary-panel]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
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
  const handleCompareWithAI = (catKey: string) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.key === catKey);
    const products = categoryProducts[catKey] || [];
    const message = `Compare the ${cat?.label || catKey} products`;
    console.log(`[AI] Compare with AI clicked. Category:`, catKey, 'Products:', products, 'Message:', message);
    handleSendChat(message, { products, answers: [], summary: '', chatMessages });
  };

  // Handler: Product select (add shimmer logic)
  const handleProductSelect = (catKey: string, pid: string) => {
    const prod = categoryProducts[catKey].find(p => p.id === pid);
    if (prod) {
      setSelectedProducts(prev => {
        const currentSelections = prev[catKey] || [];
        const isSelected = currentSelections.some(p => p.id === pid);
        // Shimmer logic: only trigger if not shown yet and first selection
        if (!nextShimmerShown[catKey] && !isSelected) {
          setNextShimmerShown(shown => ({ ...shown, [catKey]: true }));
          // Add shimmer class
          const btn = buttonRefs.current[catKey];
          if (btn) {
            btn.classList.remove('btn-next-shimmer');
            // Force reflow to restart animation
            void btn.offsetWidth;
            btn.classList.add('btn-next-shimmer');
            setTimeout(() => btn.classList.remove('btn-next-shimmer'), 1300);
          }
        }
        if (isSelected) {
          // Remove product if already selected
          return {
            ...prev,
            [catKey]: currentSelections.filter(p => p.id !== pid)
          };
        } else {
          // Add product if not selected
          return {
            ...prev,
            [catKey]: [...currentSelections, prod]
          };
        }
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FFFDF5] text-[#527055]">
      {/* Chat Sidebar */}
      <div
        className="fixed left-0 z-30 w-[384px] pointer-events-none"
        style={{ top: '2.5vh', height: '45vh' }}
      >
        <div className="w-full h-full pointer-events-auto">
          <ChatSidebar className="glass-panel rounded-r-3xl h-full">
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
      </div>

      {/* Main Content */}
      <div className="ml-[384px] pl-12 pr-8 py-8">
        <main className="max-w-[900px] mx-auto">
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
                      selectedProductIds={selectedProducts[cat.key]?.map(p => p.id) || []}
                      onSelect={pid => handleProductSelect(cat.key, pid)}
                      onExplainWithAI={handleExplainWithAI}
                    />
                    {/* Button Group Below ProductRow */}
                    <div className="flex items-center justify-between mt-6">
                      {/* Previous/Next Group */}
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
                      {/* Compare with AI Button */}
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
            {/* Summary Dropdown at the end */}
            <SummaryDropdown
              selectedProducts={Object.values(selectedProducts).flat()}
              total={Object.values(selectedProducts).flat().reduce((sum, p) => sum + (p.price || 0), 0)}
              open={openSection === 'summary'}
              onToggle={() => setOpenSection(openSection === 'summary' ? null : 'summary')}
              data-summary-panel
            />
          </div>
        </main>
      </div>
    </div>
  );
} 