import { useGetStudentDashboard } from "@workspace/api-client-react";
import { getAuthHeaders, cn } from "@/lib/utils";
import { Loader2, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from "recharts";

const RISK_COLORS = {
  LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
  HIGH: "text-rose-700 bg-rose-50 border-rose-200",
};

export default function StudentDashboard() {
  const { data, isLoading, error } = useGetStudentDashboard({
    request: { headers: getAuthHeaders() }
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !data) {
    return <div className="p-6 bg-rose-50 text-rose-600 rounded-xl">Failed to load dashboard data.</div>;
  }

  const chartData = data.courses.map(c => ({
    name: c.courseCode,
    score: c.score,
    attendance: c.attendance,
    riskLevel: c.riskLevel
  }));

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Overall Score</p>
            <p className="text-2xl font-bold text-slate-900">{data.overallScore.toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
            <p className="text-2xl font-bold text-slate-900">{data.overallAttendance.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={cn("p-4 rounded-xl", 
            data.overallRisk === 'HIGH' ? "bg-rose-100 text-rose-600" :
            data.overallRisk === 'MEDIUM' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
          )}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Risk Level</p>
            <p className="text-2xl font-bold text-slate-900 capitalize">{data.overallRisk.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Recommendations Banner (if HIGH or MEDIUM risk) */}
      {(data.overallRisk === 'HIGH' || data.overallRisk === 'MEDIUM') && (
        <div className={cn(
          "p-6 rounded-2xl border",
          data.overallRisk === 'HIGH' ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
        )}>
          <h3 className={cn("font-bold text-lg mb-2", 
            data.overallRisk === 'HIGH' ? "text-rose-800" : "text-amber-800"
          )}>
            Recommended Actions
          </h3>
          <ul className={cn("list-disc pl-5 space-y-1",
             data.overallRisk === 'HIGH' ? "text-rose-700" : "text-amber-700"
          )}>
            {data.overallRisk === 'HIGH' ? (
              <>
                <li>Schedule a meeting with your academic advisor immediately.</li>
                <li>Ensure perfect attendance for the next two weeks.</li>
                <li>Join peer study groups for courses with scores below 50%.</li>
              </>
            ) : (
              <>
                <li>Review course materials where your score is below average.</li>
                <li>Participate more actively in upcoming lectures.</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Course Scores</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.riskLevel === 'HIGH' ? 'hsl(var(--destructive))' : 
                      entry.riskLevel === 'MEDIUM' ? 'hsl(var(--chart-4))' : 'hsl(var(--primary))'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Record</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="attendance" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Course Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm font-medium text-slate-500">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.courses.map((course) => (
                <tr key={course.courseId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{course.courseCode}</p>
                    <p className="text-sm text-slate-500">{course.courseTitle}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{course.score}%</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{course.attendance}%</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", RISK_COLORS[course.riskLevel])}>
                      {course.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
