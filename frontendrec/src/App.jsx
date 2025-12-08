import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ThumbsUp, ExternalLink } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function CryptoRecommender() {
  const [topic, setTopic] = useState('');
  const [maxNumPosts, setMaxNumPosts] = useState(5);
  const [minUpvotes, setMinUpvotes] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);

  // Check "Remember my choice" on mount
  useEffect(() => {
    const remembered = localStorage.getItem('crypto_recommender_ack');
    if (remembered === '1') {
      setModalOpen(false);
    }
  }, []);

  const handleModalClose = () => {
    if (rememberChoice) {
      localStorage.setItem('crypto_recommender_ack', '1');
    }
    setModalOpen(false);
  };

  // Your backend endpoint
  const API_ENDPOINT = 'https://spraybottleapp.calmmushroom-85f2636c.westus2.azurecontainerapps.io/search';
  
  //const API_ENDPOINT = 'http://127.0.0.1:8000/search';
  const handleSearch = async (searchTopic) => {
  const query = (searchTopic ?? topic).trim();
  if (!query) {
    setError('Please enter a cryptocurrency');
    return;
  }

  setLoading(true);
  setError('');
  setResults(null);

  // Defensive query param construction
  const params = new URLSearchParams({
    q: query,
    n: String(maxNumPosts || 5),
    upvotes_min: String(minUpvotes || 0),
  });
  const url = `${API_ENDPOINT}?${params.toString()}`;
  console.log('FETCH URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    setResults(data);
  } catch (err) {
    setError(`Failed to load recommendations: ${err.message}`);
    setResults(null);
  } finally {
    setLoading(false);
  }
};

  // Chart transformation
  const chartData =
    results?.posts?.slice(0, 10).map((post, idx) => ({
      name: `#${idx + 1}`,
      upvotes: post.upvotes || 0,
      title: post.title
    })) || [];

  const totalUpvotes =
    results?.posts?.reduce((sum, p) => sum + (p.upvotes || 0), 0) || 0;

  const totalComments =
    results?.posts?.reduce((sum, p) => sum + (p.num_comments || 0), 0) || 0;

  return (
    <div>
      {/* WELCOME MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Welcome to <span className="text-blue-600">Crypto Reddit Advisor!</span>
            </h2>
            <div className="text-gray-700 mb-8">
              <p>
                This site provides advice and trends based on the most upvoted public Reddit posts.
              </p>
              <p className="font-bold mt-6">
                Always do your own research before making financial decisions.
              </p>
            </div>
            
            <button
              onClick={handleModalClose}
              className="bg-blue-600 text-white w-64 py-3 rounded-full font-semibold hover:bg-blue-700 transition shadow-md mb-4"
            >
              I Understand
            </button>

            <div className="flex items-center justify-center">
              <input
                id="remember-choice"
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-choice" className="ml-2 text-gray-700 text-sm cursor-pointer">
                Remember my choice
              </label>
            </div>
          </div>
        </div>
      )}
      {/* MAIN CONTENT BG */}
      <div className={modalOpen ? "pointer-events-none opacity-40 select-none" : ""}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-pink-50 flex items-center justify-center px-2 py-8">
          <div className="w-full max-w-5xl">
            {/* HEADER */}
            <header className="text-center mb-24">
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight drop-shadow-sm">
                <span className="text-blue-700">Crypto</span> Reddit Advisor
              </h1>
              <p className="text-lg text-gray-500 mt-4">
                Get advice from the <span className="font-bold text-blue-600">most upvoted</span> Reddit posts
              </p>
            </header>
            {/* SEARCH CARD */}
            <main className="w-full flex justify-center mb-12">
              <div className="relative w-full max-w-2xl">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSearch();
                    }}
                  >
                    <div className="flex flex-col gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-3xl shadow-lg border border-white/50 focus-within:ring-4 focus-within:ring-blue-100 transition-all hover:bg-white">
                    <div className="flex items-center gap-3">
                      <div className="pl-4 text-gray-400">
                      <Search size={24} />
                      </div>
                      <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter a cryptocurrency (e.g., Bitcoin)"
                      className="flex-1 text-xl px-2 py-2 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500 text-center"
                      disabled={loading}
                      />
                      <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-12 py-4 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex-shrink-0"
                      >
                      {loading ? '...' : 'Search'}
                      </button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 flex flex-col">
                      <label className="text-xs text-gray-500 font-medium mb-1 text-left px-4" htmlFor="maxNumPosts">
                        Max # of posts returned
                      </label>
                      <input
                        id="maxNumPosts"
                        type="number"
                        className="text-base px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 placeholder-gray-500 text-center"
                        placeholder="Set max # of posts returned"
                        value={maxNumPosts}
                        onChange={(e) => setMaxNumPosts(Number(e.target.value))}
                        disabled={loading}
                      />
                      </div>
                      <div className="flex-1 flex flex-col">
                      <label className="text-xs text-gray-500 font-medium mb-1 text-left px-4" htmlFor="minUpvotes">
                        Minimum # of upvotes
                      </label>
                      <input
                        id="minUpvotes"
                        type="number"
                        className="text-base px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 placeholder-gray-500 text-center"
                        placeholder="Enter minimum # of upvotes"
                        value={minUpvotes}
                        onChange={(e) => setMinUpvotes(Number(e.target.value))}
                        disabled={loading}
                      />
                      </div>
                    </div>
                    </div>
                    {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center animate-shake">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    )}
                    <div className="text-center mt-4">
                    <p className="text-xs text-gray-500">
                      💡 Try: <span className="font-medium text-blue-600">Bitcoin</span>, <span className="font-medium text-blue-600">Ethereum</span>, <span className="font-medium text-blue-600">Dogecoin</span>
                    </p>
                    </div>
                  </form>
                  <div className="mb-8">
                    {results && (
                    <div className="space-y-5">
                      {/* STAT CARDS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-xl shadow flex items-center gap-3 p-5 border">
                          <div className="p-3 bg-blue-50 rounded-full">
                            <Search className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Results Found</p>
                            <p className="text-2xl font-bold text-gray-800">{results.total_results || 0}</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow flex items-center gap-3 p-5 border">
                          <div className="p-3 bg-green-50 rounded-full">
                            <ThumbsUp className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Total Upvotes</p>
                            <p className="text-2xl font-bold text-gray-800">{totalUpvotes.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow flex items-center gap-3 p-5 border">
                          <div className="p-3 bg-purple-50 rounded-full">
                            <MessageSquare className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Total Comments</p>
                            <p className="text-2xl font-bold text-gray-800">{totalComments.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      {/* CHART */}
                      {chartData.length > 0 && (
                        <div className="bg-white rounded-xl shadow p-6 border">
                          <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Top Posts by Upvotes
                          </h3>
                          <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                              <BarChart data={chartData} margin={{ right: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="bg-white p-3 border rounded shadow-lg max-w-xs">
                                          <p className="font-semibold">{payload[0].value} upvotes</p>
                                          <p className="text-xs text-gray-600 mt-1">{payload[0].payload.title}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="upvotes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {/* POSTS LIST */}
                      <div className="bg-white rounded-xl shadow p-6 border">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          Top Recommended Posts
                        </h3>
                        <div className="space-y-4">
                          {results.posts?.length ? (
                            results.posts.map((post, idx) => (
                              <div
                                key={post.id}
                                className="p-5 border border-gray-100 rounded-lg hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                              >
                                <div className="flex items-center gap-4 mb-2 md:mb-0">
                                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg shadow">{idx + 1}</div>
                                  <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-600 font-bold mr-2">{`r/${post.subreddit}`}</span>
                                  {post.flair && post.flair !== 'None' && (
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-slate-700 tracking-wide">{post.flair}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-800 mb-1 line-clamp-1">{post.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.text}</p>
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp size={14} className="text-green-600" />
                                      {post.upvotes.toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare size={14} />
                                      {post.num_comments.toLocaleString()}
                                    </span>
                                    <span>by <span className="font-bold text-slate-700">u/{post.author}</span></span>
                                    <span className="font-bold text-blue-700">
                                      {(post.relevance_score * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                  aria-label="Open original Reddit post"
                                >
                                  <ExternalLink size={22} />
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-center py-4">
                              No posts found for this topic.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}