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
  const hasResults = !!(results && results.posts && results.posts.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [displayedTopic, setDisplayedTopic] = useState('');

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
  //const API_ENDPOINT = 'https://spraybottleapp.calmmushroom-85f2636c.westus2.azurecontainerapps.io/search';
  const API_ENDPOINT = 'http://127.0.0.1:8000/search';

  const handleSearch = async (searchTopic) => {
    const query = (searchTopic ?? topic).trim();
    if (!query) {
      setError('Please enter a cryptocurrency');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const params = new URLSearchParams({
      q: query,
      n: String(maxNumPosts || 5),
      upvotes_min: String(minUpvotes || 0),
    });
    const url = `${API_ENDPOINT}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
      setDisplayedTopic(query);
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
      title: post.title,
    })) || [];

  const totalUpvotes =
    results?.posts?.reduce((sum, p) => sum + (p.upvotes || 0), 0) || 0;

  const totalComments =
    results?.posts?.reduce((sum, p) => sum + (p.num_comments || 0), 0) || 0;

  // Limit how much post content we display in the list
  const MAX_CONTENT_CHARS = 200;
  const truncateContent = (text, n = MAX_CONTENT_CHARS) => {
    if (!text) return '';
    const s = String(text);
    return s.length > n ? s.slice(0, n) + '…' : s;
  };

  return (
    <div>
      {/* WELCOME MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Welcome to <span className="text-blue-600">₡rypto Reddit Advisor!</span>
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-pink-50 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-6xl">
            {/* STICKY NAV WHEN RESULTS PRESENT */}
            {hasResults && (
              <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm">
                <div className="mx-auto max-w-6xl px-5 py-4 flex items-center gap-5">
                  {/* Home button */}
                  <button
                    type="button"
                    onClick={() => {
                      setResults(null);
                      setTopic('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-3xl font-black text-blue-700 hover:text-blue-800"
                    aria-label="Go to home"
                  >
                    ₡rypto.
                  </button>

                  {/* Inline search */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                    className="flex-1 flex items-center gap-4"
                  >
                    <div className="flex-1 bg-white/90 rounded-full border border-gray-200 shadow-sm px-5 py-3 flex items-center gap-3">
                      <Search size={20} className="text-gray-400" />
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Search topic"
                        className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500 text-base"
                        disabled={loading}
                      />
                    </div>
                    {/* Posts control */}
                    <div className="px-4 py-2.5 bg-white/90 rounded-full border border-gray-200 shadow-sm flex items-center gap-2.5">
                      <span className="text-xs font-medium text-gray-600">Posts</span>
                      <input
                        id="nav-maxNumPosts"
                        type="number"
                        min={1}
                        className="w-20 text-sm text-center bg-transparent border-none focus:outline-none text-gray-800"
                        value={maxNumPosts}
                        onChange={(e) => setMaxNumPosts(Number(e.target.value))}
                        disabled={loading}
                      />
                    </div>
                    {/* Upvotes control */}
                    <div className="px-4 py-2.5 bg-white/90 rounded-full border border-gray-200 shadow-sm flex items-center gap-2.5">
                      <span className="text-xs font-medium text-gray-600">Upvotes</span>
                      <input
                        id="nav-minUpvotes"
                        type="number"
                        min={0}
                        className="w-20 text-sm text-center bg-transparent border-none focus:outline-none text-gray-800"
                        value={minUpvotes}
                        onChange={(e) => setMinUpvotes(Number(e.target.value))}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                      aria-label="Search"
                    >
                      {loading ? '...' : '\u00A0search\u00A0'}
                    </button>
                  </form>
                </div>
              </nav>
            )}

            {/* HEADER (hidden when results present) */}
            {!hasResults && (
              <header className="text-center mb-40">
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight drop-shadow-sm">
                  <span className="text-blue-700">₡rypto</span> Reddit Advisor
                </h1>
                <p className="text-lg text-gray-500 mt-4">
                  Get advice from the <span className="font-bold text-blue-600">most upvoted</span> Reddit posts
                </p>
              </header>
            )}
            {/* Spacer between title and search bar  */}
            {!hasResults && <div className="h-8" />}
            {/* SEARCH CARD */}
            <main className="w-full flex justify-center mb-12">
              <div className="relative w-full max-w-5xl px-6">
                <form
                  className="flex flex-col items-center space-y-12 w-full"
                  onSubmit={e => {
                    e.preventDefault();
                    handleSearch();
                    }}
                  >
                    {/* search bar (hidden when nav shown) */}
                    {!hasResults && (
                      <div className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-full shadow-lg border border-white/50 focus-within:ring-4 focus-within:ring-blue-100 transition-all hover:bg-white mb-10">
                      <div className="flex items-center gap-3">
                        <div className="pl-4 text-gray-400">
                          <Search size={24} />
                        </div>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Enter a cryptocurrency (e.g., Bitcoin)"
                          className="flex-1 text-2xl px-4 py-4 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500 text-center"
                          disabled={loading}
                          aria-label="Search topic"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 px-12 py-4 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex-shrink-0"
                          aria-label="Search"
                        >
                          {loading ? '...' : '\u00A0search\u00A0'}
                        </button>
                      </div>
                      </div>
                    )}

                    {/* Tip*/}
                    {!hasResults && (
                      <div className="text-center -mt-6 mb-6">
                        <p className="text-xs text-gray-500">
                          💡 Try: <span className="font-medium text-blue-600">Bitcoin</span>, <span className="font-medium text-blue-600">Ethereum</span>, <span className="font-medium text-blue-600">Dogecoin</span>
                        </p>
                      </div>
                    )}
                    
                    {/* Spacer between search bar and controls */}
                    <div className="h-8" />

                    {/* Controls below search: Posts and Upvotes (hidden when nav shown) */}
                    {!hasResults && (
                      <div className="mt-12 flex items-center justify-center gap-12">
                      <div className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow border border-white/50 hover:bg-white transition flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">Posts</span>
                        <input
                          id="maxNumPosts"
                          type="number"
                          min={1}
                          className="w-28 text-lg text-center bg-transparent border-none focus:outline-none text-gray-800"
                          value={maxNumPosts}
                          onChange={(e) => setMaxNumPosts(Number(e.target.value))}
                          disabled={loading}
                          aria-label="Maximum number of posts"
                        />
                      </div>
                      <div className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow border border-white/50 hover:bg-white transition flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">Upvotes</span>
                        <input
                          id="minUpvotes"
                          type="number"
                          min={0}
                          className="w-28 text-lg text-center bg-transparent border-none focus:outline-none text-gray-800"
                          value={minUpvotes}
                          onChange={(e) => setMinUpvotes(Number(e.target.value))}
                          disabled={loading}
                          aria-label="Minimum upvotes"
                        />
                      </div>
                      </div>
                    )}
                    {/* Spacer between controls and error/tip */}
                    <div className="h-8" />

                    {error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center animate-shake">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                    
                  </form>
                  <div className="mb-8">
                    {results && (
                    <div className="space-y-6">
                      {/* Post-search heading banner */}
                      <img
                        src="/banner2.jpg"
                        alt="Cryptocurrency banner"
                        className="w-full max-w-6xl h-24 md:h-32 object-cover rounded-xl shadow mx-auto"
                      />
                      {/* Spacer and topic heading under banner */}
                      <div className="h-4" />
                      <h2 className="text-left text-2xl md:text-3xl font-semibold text-gray-800">
                        Top posts about <span className="text-blue-700 font-bold">{displayedTopic}</span> from r/CryptoCurrency
                      </h2>
                      <div className="h-4" />
                      {/* STATS + CHART LAYOUT: chart left, merged stats right */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 items-start">
                        {chartData.length > 0 && (
                          <div className="md:col-span-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/50">
                          <h3 className="text-lg font-bold text-gray-800 mb-4">
                            📊 Top Posts by Upvotes
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
                                        <div className="bg-white/90 p-3 border border-white/50 rounded shadow-sm max-w-xs">
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
                        {/* Right column: subreddit box, spacer, merged stats; total height matches chart */}
                        <div className="md:col-span-1 flex flex-col gap-4" style={{ height: 260 }}>
                          {/* Subreddit box */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm px-6 py-10 border border-white/50 text-left">
                            <div className="flex items-center gap-4">
                              <img
                                src="/crypto-currency.webp"
                                alt="CryptoCurrency icon"
                                className="w-9 h-9 rounded-full shadow"
                              />
                              <a
                              href="https://www.reddit.com/r/CryptoCurrency/"
                              target="_blank"
                              rel="noopener noreferrer"
                                className="text-blue-700 font-semibold hover:underline text-lg"
                              >
                                r/CryptoCurrency
                              </a>
                            </div>
                            <div className="mt-4 border-t border-gray-200 pt-3">
                              <p className="text-sm text-gray-500">
                                The leading community for cryptocurrency news, discussion, and analysis.
                              </p>
                            </div>
                          </div>
                          {/* Empty spacer to balance height visually (now via gap) */}
                          {/* Merged stats box */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-5 border border-white/50 flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-blue-50 rounded-full">
                                <Search className="text-blue-600" size={20} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase">Results Found</p>
                                <p className="text-2xl font-bold text-gray-800">{results.total_results || 0}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-50 rounded-full">
                                <ThumbsUp className="text-green-600" size={20} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase">Total Upvotes</p>
                                <p className="text-2xl font-bold text-gray-800">{totalUpvotes.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-purple-50 rounded-full">
                                <MessageSquare className="text-purple-600" size={20} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase">Total Comments</p>
                                <p className="text-2xl font-bold text-gray-800">{totalComments.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Spacer between chart area and posts list */}
                      <div className="h-8" />
                      {/* POSTS LIST */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/50">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          🔝 Top Recommended Posts
                        </h3>
                        <div className="divide-y divide-gray-200">
                          {results.posts?.length ? (
                            results.posts.map((post, idx) => (
                              <div
                                key={post.id}
                                className={`p-5 hover:bg-white/60 transition flex items-start gap-6 bg-white/60 ${idx !== 0 ? 'border-t border-gray-200' : ''}`}
                              >
                                {/* Left: Rank and similarity */}
                                <div className="flex items-center gap-3 w-32 md:w-36 flex-shrink-0">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-xl shadow">{idx + 1}</div>
                                  <div className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                    {(post.relevance_score * 100).toFixed(1)}%
                                  </div>
                                </div>

                                {/* Main content stack */}
                                <div className="flex-1 min-w-0">
                                  {/* Username */}
                                  <div className="flex items-center gap-1 text-sm text-gray-700 mb-1">
                                    <img src="/user-icon.png" alt="Reddit user" className="w-4 h-4 bg-white rounded-full p-0.5 shadow-sm" />
                                    <span className="font-bold text-slate-700">u/{post.author}</span>
                                  </div>
                                  {/* Title */}
                                  <h4 className="font-semibold text-gray-900 mb-1 break-words text-lg md:text-xl">{post.title}</h4>
                                  {/* Category / Flair */}
                                  <div className="text-xs text-gray-600">
                                    {post.flair && post.flair !== 'None' ? (
                                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">{post.flair}</span>
                                    ) : (
                                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">Uncategorized</span>
                                    )}
                                  </div>
                                  {/* Empty line spacer */}
                                  <div className="h-3" />
                                  {/* Post content */}
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-3">{truncateContent(post.text)}</p>
                                  {/* Extra empty line between content and meta */}
                                  <div className="h-3" />
                                  {/* Likes and comments */}
                                  <div className="flex items-center gap-6 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp size={14} className="text-green-600" />
                                      {post.upvotes.toLocaleString()} upvotes
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare size={14} />
                                      {post.num_comments.toLocaleString()} comments
                                    </span>
                                  </div>
                                </div>

                                {/* External link */}
                                <a
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
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