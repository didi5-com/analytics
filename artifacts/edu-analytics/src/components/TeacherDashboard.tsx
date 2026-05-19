import { useState } from "react";
import { 
  useGetTeacherCourses, 
  useGetCourseStudents, 
  useUpsertGrade, 
  useUpsertAttendance 
} from "@workspace/api-client-react";
import { getAuthHeaders, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RISK_COLORS: Record<string, string> = {
  LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
  HIGH: "text-rose-700 bg-rose-50 border-rose-200",
};

export default function TeacherDashboard() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { data: courses, isLoading: loadingCourses } = useGetTeacherCourses({
    request: { headers: getAuthHeaders() }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">My Courses</h2>
          {loadingCourses ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : courses?.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
              No courses assigned yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses?.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-200",
                    selectedCourseId === course.id 
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "bg-white border-slate-200 hover:border-primary/30 hover:shadow-sm text-slate-700"
                  )}
                >
                  <div className={cn("p-2 rounded-lg mt-1", selectedCourseId === course.id ? "bg-white/20" : "bg-primary/10 text-primary")}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={cn("font-bold", selectedCourseId === course.id ? "text-white" : "text-slate-900")}>
                      {course.code}
                    </h3>
                    <p className={cn("text-sm line-clamp-1", selectedCourseId === course.id ? "text-white/80" : "text-slate-500")}>
                      {course.title}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-80 font-medium">
                      <Users className="w-3 h-3" />
                      {course.studentCount} Students
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-2">
          {selectedCourseId ? (
            <CourseStudentsTable courseId={selectedCourseId} />
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50/50 border border-slate-100 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <BookOpen className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">Select a course</p>
              <p className="text-sm">Choose a course from the list to view and manage student records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseStudentsTable({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: students, isLoading } = useGetCourseStudents(courseId, {
    request: { headers: getAuthHeaders() },
    query: { enabled: !!courseId }
  });

  const gradeMutation = useUpsertGrade({ request: { headers: getAuthHeaders() } });
  const attendanceMutation = useUpsertAttendance({ request: { headers: getAuthHeaders() } });

  // Local state to track edits before saving
  const [edits, setEdits] = useState<Record<number, { score?: string, attendance?: string }>>({});

  const handleEdit = (studentId: number, field: 'score' | 'attendance', value: string) => {
    setEdits(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const handleSave = async (studentId: number) => {
    const edit = edits[studentId];
    if (!edit) return;

    try {
      if (edit.score !== undefined) {
        await gradeMutation.mutateAsync({
          data: { studentId, courseId, score: Number(edit.score) }
        });
      }
      if (edit.attendance !== undefined) {
        await attendanceMutation.mutateAsync({
          data: { studentId, courseId, percentage: Number(edit.attendance) }
        });
      }

      toast({ title: "Updated successfully" });
      setEdits(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/courses/${courseId}/students`] });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Student Roster</h3>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Score (%)</th>
              <th className="px-6 py-4">Attendance (%)</th>
              <th className="px-6 py-4">Risk</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students?.map((student) => {
              const hasEdits = edits[student.studentId] !== undefined;
              const currentScore = edits[student.studentId]?.score ?? student.score ?? '';
              const currentAtt = edits[student.studentId]?.attendance ?? student.attendance ?? '';

              return (
                <tr key={student.studentId} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{student.studentName}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      value={currentScore}
                      onChange={(e) => handleEdit(student.studentId, 'score', e.target.value)}
                      className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="--"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      value={currentAtt}
                      onChange={(e) => handleEdit(student.studentId, 'attendance', e.target.value)}
                      className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="--"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {student.riskLevel ? (
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border", RISK_COLORS[student.riskLevel])}>
                        {student.riskLevel}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {hasEdits && (
                      <button
                        onClick={() => handleSave(student.studentId)}
                        disabled={gradeMutation.isPending || attendanceMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {students?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No students enrolled in this course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
