import { CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MatchResult({ data }) {
  if (!data) return null;

  const color = data.match_score >= 75 ? 'green' : data.match_score >= 50 ? 'yellow' : 'red';

  return (
    <div className="space-y-4">
      {/* score */}
      <div className={`border rounded-xl p-6 text-center bg-${color}-50 border-${color}-200`}>
        <p className="text-sm font-medium text-gray-600 mb-1">Match Score</p>
        <p className={`text-5xl font-bold text-${color}-600`}>{data.match_score}%</p>
        <p className="text-sm text-gray-600 mt-2">{data.summary}</p>
      </div>

      {/* matched skills */}
      {data.matching_skills?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h4 className="font-semibold text-sm text-gray-800">Matching Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.matching_skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* missing */}
      {data.missing_skills?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-500" />
            <h4 className="font-semibold text-sm text-gray-800">Missing Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.missing_skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* strengths */}
      {data.strengths?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-sm text-gray-800">Your Strengths</h4>
          </div>
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* gaps */}
      {data.gaps?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h4 className="font-semibold text-sm text-gray-800">Areas to Address</h4>
          </div>
          <ul className="space-y-1.5">
            {data.gaps.map((g, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span> {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}