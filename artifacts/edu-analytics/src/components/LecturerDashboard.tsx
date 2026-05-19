import { useState, useMemo } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Users, AlertCircle, Percent } from 'lucide-react';

export function LecturerDashboard() {
  const { data } = useAnalytics();
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const courses = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.predictions.map(p => p.course))).sort();
  }, [data]);

  const courseData = useMemo(() => {
    if (!data || !selectedCourse) return [];
    return data.predictions.filter(p => p.course === selectedCourse);
  }, [data, selectedCourse]);

  const atRiskStudents = useMemo(() => {
    return courseData.filter(d => d.risk_level === 'HIGH').sort((a,b) => a.score - b.score);
  }, [courseData]);

  const metrics = useMemo(() => {
    if (courseData.length === 0) return { avgScore: 0, avgAtt: 0, highRisk: 0 };
    const avgScore = courseData.reduce((acc, curr) => acc + curr.score, 0) / courseData.length;
    const avgAtt = courseData.reduce((acc, curr) => acc + curr.attendance, 0) / courseData.length;
    return {
      avgScore: avgScore.toFixed(1),
      avgAtt: avgAtt.toFixed(1),
      highRisk: atRiskStudents.length
    };
  }, [courseData, atRiskStudents]);

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Course Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Class-wide performance and engagement metrics</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {courses.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {courseData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.avgScore}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Average Attendance</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.avgAtt}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">High Risk Students</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.highRisk}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-semibold">Score vs Attendance Correlation</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[0, 100]} tick={{fill: '#64748b'}} />
                  <YAxis type="number" dataKey="score" name="Score" domain={[0, 100]} tick={{fill: '#64748b'}} />
                  <ZAxis type="category" dataKey="risk_level" name="Risk" />
                  <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px'}} />
                  <Scatter data={courseData.filter(d => d.risk_level === 'LOW')} fill="#10b981" />
                  <Scatter data={courseData.filter(d => d.risk_level === 'MEDIUM')} fill="#f59e0b" />
                  <Scatter data={courseData.filter(d => d.risk_level === 'HIGH')} fill="#ef4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-red-100">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                At-Risk Students Action List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {atRiskStudents.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Student ID</TableHead>
                      <TableHead className="font-semibold text-slate-700">Score</TableHead>
                      <TableHead className="font-semibold text-slate-700">Attendance</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Risk Factor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atRiskStudents.map((s) => (
                      <TableRow key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">#{s.student_id}</TableCell>
                        <TableCell>
                          <span className={cn("font-medium", s.score < 50 ? "text-red-600" : "")}>
                            {s.score.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("font-medium", s.attendance < 75 ? "text-amber-600" : "")}>
                            {s.attendance.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                           <Badge variant="destructive" className="bg-red-100 text-red-700 border-none shadow-none rounded-lg px-2">
                             {(s.risk_probability * 100).toFixed(0)}% Prob
                           </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-700">All clear!</p>
                  <p>No high-risk students found in this course.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
