import { useState } from "react";
import { 
  useGetAdminOverview, 
  useListUsers, 
  useListCourses,
  useApproveTeacher,
  useUpdateUser,
  useDeleteUser,
  useCreateCourse,
  useEnrollStudent
} from "@workspace/api-client-react";
import { getAuthHeaders, cn } from "@/lib/utils";
import { Users, BookOpen, AlertTriangle, CheckCircle, Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'approvals'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Management' },
    { id: 'courses', label: 'Courses' },
    { id: 'approvals', label: 'Pending Approvals' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 p-1 bg-slate-200/50 rounded-xl w-full max-w-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'approvals' && <ApprovalsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useGetAdminOverview({ request: { headers: getAuthHeaders() } });

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data) return null;

  const riskData = [
    { name: 'At Risk', value: data.atRiskStudents, color: 'hsl(var(--destructive))' },
    { name: 'Safe', value: data.totalStudents - data.atRiskStudents, color: 'hsl(var(--chart-3))' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data.totalStudents} icon={<Users />} />
        <StatCard title="Total Teachers" value={data.totalTeachers} icon={<Users />} />
        <StatCard title="Active Courses" value={data.totalCourses} icon={<BookOpen />} />
        <StatCard title="At-Risk Alerts" value={data.atRiskStudents} icon={<AlertTriangle />} alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-slate-100 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-6">Student Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-6">Course Performance (Avg Score)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.courseStats} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="courseCode" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }}/>
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, alert }: any) {
  return (
    <div className={cn("p-6 rounded-2xl border", alert ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", alert ? "bg-rose-100 text-rose-600" : "bg-white text-primary shadow-sm")}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className={cn("text-3xl font-bold", alert ? "text-rose-700" : "text-slate-900")}>{value}</p>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useListUsers({ request: { headers: getAuthHeaders() } });
  const deleteMutation = useDeleteUser({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if(!confirm("Delete user?")) return;
    try {
      await deleteMutation.mutateAsync({ userId: id });
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users`] });
    } catch {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users?.map(user => (
            <tr key={user.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
              <td className="px-6 py-4 text-slate-500">{user.email}</td>
              <td className="px-6 py-4 capitalize">
                <span className={cn("px-2 py-1 rounded-md text-xs font-semibold", 
                  user.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                  user.role === 'teacher' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                )}>{user.role}</span>
              </td>
              <td className="px-6 py-4">
                <span className={cn("px-2 py-1 rounded-md text-xs font-semibold flex w-fit items-center gap-1", 
                  user.status === 'active' ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                )}>
                  {user.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoursesTab() {
  const { data: courses, isLoading } = useListCourses({ request: { headers: getAuthHeaders() } });
  
  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-0">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900">Course Catalog</h3>
          <p className="text-sm text-slate-500">Manage all courses and enrollments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
          <tr>
            <th className="px-6 py-4">Code</th>
            <th className="px-6 py-4">Title</th>
            <th className="px-6 py-4">Teacher</th>
            <th className="px-6 py-4">Students</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses?.map(course => (
            <tr key={course.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 font-bold text-slate-900">{course.code}</td>
              <td className="px-6 py-4 font-medium text-slate-700">{course.title}</td>
              <td className="px-6 py-4 text-slate-500">{course.teacherName || 'Unassigned'}</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md">{course.studentCount}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalsTab() {
  const { data: users, isLoading } = useListUsers({ request: { headers: getAuthHeaders() } });
  const approveMutation = useApproveTeacher({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pendingTeachers = users?.filter(u => u.role === 'teacher' && u.status === 'pending') || [];

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync({ userId: id });
      toast({ title: "Teacher approved successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/overview`] });
    } catch {
      toast({ title: "Failed to approve", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (pendingTeachers.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">All Caught Up</h3>
        <p className="text-slate-500 mt-1">There are no pending teacher approvals.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingTeachers.map(teacher => (
          <div key={teacher.id} className="p-5 border border-amber-200 bg-amber-50/30 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{teacher.name}</p>
              <p className="text-sm text-slate-600">{teacher.email}</p>
              <p className="text-xs text-slate-400 mt-1">Registered: {new Date(teacher.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => handleApprove(teacher.id)}
              disabled={approveMutation.isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Approve Access
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
