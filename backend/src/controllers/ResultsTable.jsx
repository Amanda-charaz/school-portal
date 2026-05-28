import React, { useState, useMemo } from 'react';
import { BadgeCheck, BadgeAlert, Search, ChevronDown } from 'lucide-react';

/**
 * ResultsTable component
 * - Renders a standard table on desktop/tablets.
 * - Switches to a card-based layout on mobile for better readability.
 */
const ResultsTable = ({ results = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentNameQuery, setStudentNameQuery] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Memoize unique terms and years for dropdowns
  const uniqueTerms = useMemo(() => {
    const terms = new Set(results.map(r => r.term));
    return ['', ...Array.from(terms).sort()]; // Add empty option for "All"
  }, [results]);

  const uniqueYears = useMemo(() => {
    const years = new Set(results.map(r => r.year));
    return ['', ...Array.from(years).sort((a, b) => b - a)]; // Add empty option for "All", sort descending
  }, [results]);

  const filteredResults = results.filter((result) => {
    const matchesSubject = result.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStudent = (
      result.student?.full_name.toLowerCase().includes(studentNameQuery.toLowerCase()) ||
      result.student?.school_id.toLowerCase().includes(studentNameQuery.toLowerCase())
    );
    const matchesTerm = termFilter === '' || result.term === termFilter;
    const matchesYear = yearFilter === '' || result.year === parseInt(yearFilter);
    return matchesSubject && matchesStudent && matchesTerm && matchesYear;
  });

  if (results.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
        <p className="text-gray-500">No results found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* --- FILTER CONTROLS --- */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
        />
      </div>
        {/* Student Name/ID Search */}
        <div className="relative group flex-1 min-w-[200px] w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search student..."
            value={studentNameQuery}
            onChange={(e) => setStudentNameQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* Term Filter */}
        <div className="relative flex-1 min-w-[150px]">
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all appearance-none pr-10"
          >
            <option value="">All Terms</option>
            {uniqueTerms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown size={20} />
          </div>
        </div>

        {/* Year Filter */}
        <div className="relative flex-1 min-w-[120px]">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all appearance-none pr-10"
          >
            <option value="">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* --- NO RESULTS FALLBACK --- */}
      {filteredResults.length === 0 && (searchQuery || studentNameQuery || termFilter || yearFilter) && (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 text-lg">No subjects match "<span className="font-bold text-gray-800">{searchQuery}</span>"</p>
        </div>
      )}
      {/* --- DESKTOP TABLE VIEW (Visible on md and up) --- */}
      <div className={`${filteredResults.length === 0 ? 'hidden' : 'hidden md:block'} bg-white shadow-sm border border-gray-200 rounded-xl`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-5 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-5 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">Term / Year</th>
              <th className="px-6 py-5 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Score</th>
              <th className="px-6 py-5 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredResults.map((result) => ( // Use filteredResults here
              <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{result.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.term} - {result.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-base text-center font-mono text-blue-700 font-bold">{result.score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="font-black text-xl">{result.grade}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end">
                    {result.score >= 40 
                      ? <BadgeCheck className="text-green-500" size={20} />
                      : <BadgeAlert className="text-red-500" size={20} />
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE CARD VIEW (Visible on small screens only) --- */}
      <div className={`${filteredResults.length === 0 ? 'hidden' : 'md:hidden'} space-y-4`}>
        {filteredResults.map((result) => ( // Use filteredResults here
          <div key={result._id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-lg font-black text-gray-900">{result.subject}</h4>
                <p className="text-sm text-gray-500">Term {result.term}, {result.year}</p>
                {result.student?.full_name && (
                  <p className="text-xs text-gray-400">Student: {result.student.full_name} ({result.student.school_id})</p>
                )}
              </div>
              <div className="text-3xl font-black text-blue-700">{result.grade}</div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-base font-bold text-gray-600">Score: <span className="text-gray-900">{result.score}</span></span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${result.score >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.score >= 40 ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsTable;