import React, { useState } from 'react';
import { Search, MessageSquare, ThumbsUp, TrendingUp, ExternalLink } from 'lucide-react';
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
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update this to your actual backend URL
  const API_ENDPOINT = 'http://localhost:8000/search';

  const handleSearch = async (searchTopic) => {
    const query = (searchTopic ?? topic).trim();
    if (!query) {
      setError('Please enter a cryptocurrency');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(
        `${API_ENDPOINT}?q=${encodeURIComponent(query)}&n=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if we have valid data
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResults(data);
    } catch (err) {
      setError(`Failed to load recommendations: ${err.message}`);
      console.error('Search error:', err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Transform results for chart - top 10 posts by upvotes
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">
            Crypto Reddit Advisor
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Get advice from the most upvoted Reddit posts
          </p>
        </header>

        {/* Search Card */}
        <main className="mx-auto max-w-2xl">
          <div className="relative bg-white rounded-2xl shadow-lg p-5 md:p-6">
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full">
                  <Search size={18} className="text-blue-600" />
                </div>

                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter a cryptocurrency (e.g., Bitcoin, Dogecoin)"
                  className="flex-1 text-lg px-4 py-3 pr-28 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                />

                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="md:hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  <Search size={16} />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="hidden md:inline-flex items-center gap-2 absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow transition"
              >
                <Search size={16} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              💡 Try: "Bitcoin", "Ethereum", "Dogecoin", "when lambo", "buy the dip"
            </p>
          </div>

          {/* Results */}
          <div className="mt-6">
            {results ? (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Search className="text-blue-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Results Found</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {results.total_results || 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-full">
                      <ThumbsUp className="text-green-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Upvotes</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {totalUpvotes.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-full">
                      <MessageSquare className="text-purple-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Comments</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {totalComments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Top Posts by Upvotes
                    </h3>
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ right: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
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

                {/* Posts List */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Top Recommended Posts
                  </h3>
                  <div className="space-y-3">
                    {results.posts?.length ? (
                      results.posts.map((post, idx) => (
                        <div
                          key={post.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600 text-sm">
                                  #{idx + 1}
                                </div>
                                <span className="text-xs text-gray-500">
                                  r/{post.subreddit}
                                </span>
                                {post.flair && post.flair !== 'None' && (
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {post.flair}
                                  </span>
                                )}
                              </div>
                              
                              <h4 className="font-semibold text-gray-800 mb-1">
                                {post.title}
                              </h4>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {post.text}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp size={14} className="text-green-600" />
                                  <span>{post.upvotes.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare size={14} />
                                  <span>{post.num_comments.toLocaleString()}</span>
                                </div>
                                <span>by u/{post.author}</span>
                                <span className="text-blue-600">
                                  {(post.relevance_score * 100).toFixed(1)}% match
                                </span>
                              </div>
                            </div>
                            
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No posts found for this topic.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <Search size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-1">
                  Start Your Search
                </h3>
                <p className="text-gray-500">
                  Enter a cryptocurrency above to get advice from top Reddit posts
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}