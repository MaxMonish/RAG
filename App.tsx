
import React, { useState } from 'react';
import { extractTriples, synthesizeContext, generateFinalResponse } from './services/geminiService';
import { Triple } from './types';
import { TrialFormatter } from './components/TrialFormatter';

type AppStep = 'EXTRACT' | 'ASSISTANT';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<AppStep>('ASSISTANT');
  
  // Extraction Lab State
  const [rawText, setRawText] = useState('');
  const [extractedTriples, setExtractedTriples] = useState<Triple[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Assistant State
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string, context?: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExtraction = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      const triples = await extractTriples(rawText);
      setExtractedTriples(triples);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAssistantQuery = async () => {
    if (!query.trim()) return;
    
    const userQuery = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsGenerating(true);

    try {
      // In a real RAG system, we'd search a vector DB here.
      // We simulate this by using any extracted triples from our "Lab" or a static medical context.
      const simulatedContext = extractedTriples.length > 0 
        ? extractedTriples 
        : [
            { subject: "Age-related Macular Degeneration", subject_type: "disease", predicate: "cause", object: "Central Vision Impairment", object_type: "progression" },
            { subject: "Smoking", subject_type: "risk_factor", predicate: "aggravate", object: "AMD Progression", object_type: "progression" },
            { subject: "NCT01778491", subject_type: "test/diagnostic", predicate: "diagnose", object: "AMD Subtypes", object_type: "disease" }
          ];

      // Step 2: Context Synthesis
      const narrative = await synthesizeContext(userQuery, simulatedContext as Triple[]);
      
      // Step 3: Verifiable Generation
      const finalAnswer = await generateFinalResponse(userQuery, narrative);
      
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: finalAnswer,
        context: narrative 
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: "I encountered an error processing your medical inquiry. Please check the clinical guidelines directly." 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <i className="fas fa-microscope text-2xl"></i>
          <h1 className="text-xl font-bold tracking-tight">MedGraph RAG Assistant</h1>
        </div>
        <nav className="flex gap-4">
          <button 
            onClick={() => setActiveStep('ASSISTANT')}
            className={`px-4 py-2 rounded-md transition ${activeStep === 'ASSISTANT' ? 'bg-indigo-900 shadow-inner' : 'hover:bg-indigo-600'}`}
          >
            Clinical Assistant
          </button>
          <button 
            onClick={() => setActiveStep('EXTRACT')}
            className={`px-4 py-2 rounded-md transition ${activeStep === 'EXTRACT' ? 'bg-indigo-900 shadow-inner' : 'hover:bg-indigo-600'}`}
          >
            Extraction Lab
          </button>
        </nav>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 overflow-hidden flex flex-col">
        {activeStep === 'EXTRACT' ? (
          <div className="flex flex-col h-full gap-6">
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <i className="fas fa-file-medical text-indigo-500"></i>
                Step 1: Relation Extraction (Listing 2)
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Paste a medical abstract to identify entities and causal relationships as structured triples.
              </p>
              <textarea
                className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50"
                placeholder="e.g. Age-related macular degeneration (AMD) leads to significant central vision impairment..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <button
                onClick={handleExtraction}
                disabled={isExtracting || !rawText}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isExtracting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
                Extract Triples
              </button>
            </section>

            <section className="flex-1 bg-white rounded-xl shadow-sm border p-6 overflow-hidden flex flex-col">
              <h3 className="text-md font-semibold mb-4 text-gray-700">Extracted Knowledge Base</h3>
              <div className="overflow-y-auto flex-1">
                {extractedTriples.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <i className="fas fa-project-diagram text-4xl mb-2"></i>
                    <p>No relationships extracted yet</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relation</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedTriples.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium">{t.subject}</span>
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 uppercase">{t.subject_type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600 uppercase">
                            {t.predicate}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium">{t.object}</span>
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-800 uppercase">{t.object_type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex h-full gap-6">
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-stethoscope text-2xl text-indigo-600"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Verified Medical AI</h3>
                    <p className="text-gray-500 mt-2">
                      I am grounded in structured knowledge graphs to minimize hallucinations. Ask me about AMD treatments, risks, or trials.
                    </p>
                    <div className="grid grid-cols-1 gap-2 mt-6 w-full">
                      {['What are the primary causes of AMD?', 'Does smoking affect vision loss?', 'What trials exist for anti-VEGF?'].map((q) => (
                        <button 
                          key={q} 
                          onClick={() => { setQuery(q); }}
                          className="p-2 text-sm border rounded-lg hover:bg-white hover:border-indigo-400 text-left text-gray-600 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-600 text-red' : 'bg-white border text-gray-800'
                    }`}>
                      {msg.role === 'ai' ? (
                        <TrialFormatter text={msg.content} />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      
                      {msg.context && (
                        <details className="mt-4 pt-4 border-t border-gray-100">
                          <summary className="text-xs font-bold text-indigo-500 cursor-pointer uppercase tracking-wider">
                            View Knowledge Context
                          </summary>
                          <div className="mt-2 text-xs italic text-gray-500 bg-gray-50 p-2 rounded">
                            {msg.context}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">Synthesizing narrative...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="Ask a medical question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAssistantQuery()}
                  />
                  <button
                    onClick={handleAssistantQuery}
                    disabled={isGenerating || !query}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest">
                  Implemented via Two-Prompt Synthesis & Verification Logic
                </p>
              </div>
            </div>

            {/* Sidebar Guide */}
            <aside className="hidden lg:block w-80 space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="font-bold text-indigo-700 flex items-center gap-2 mb-3">
                  <i className="fas fa-info-circle"></i>
                  How it works
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800">1. Context Synthesis</h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Instead of feeding raw triples, we use <strong>Listing 3</strong> to summarize facts into a coherent narrative.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">2. Trusted Persona</h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Using <strong>Listing 4</strong>, the AI assumes a medical expert role with strict "I don't know" rules.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">3. Verifiable Links</h4>
                    <p className="text-gray-500 text-xs mt-1">
                      All clinical trial IDs are formatted as direct clickable links to source repositories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">Paper Highlights</h4>
                <ul className="text-xs space-y-2 text-indigo-900">
                  <li><i className="fas fa-check-circle mr-2"></i> 12 Medical Entities</li>
                  <li><i className="fas fa-check-circle mr-2"></i> 8 Causal Relations</li>
                  <li><i className="fas fa-check-circle mr-2"></i> GraphDB Integration</li>
                  <li><i className="fas fa-check-circle mr-2"></i> Weaviate Hybrid Search</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t p-2 text-center text-xs text-gray-500">
        Knowledge Graph Augmented RAG System v1.0 • Based on "Reducing Hallucinations in Medical AI"
      </footer>
    </div>
  );
};

export default App;
