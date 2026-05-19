import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/use-analytics';
import { useToast } from '@/hooks/use-toast';
import { PredictRequest } from '@workspace/api-client-react';

export function DataLoader() {
  const { predict, isPredicting, generateDemoData } = useAnalytics();
  const { toast } = useToast();
  
  const [gradesFile, setGradesFile] = useState<File | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  
  const gradesInputRef = useRef<HTMLInputElement>(null);
  const attendanceInputRef = useRef<HTMLInputElement>(null);

  const parseCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  };

  const handleAnalyze = async () => {
    if (!gradesFile || !attendanceFile) return;
    
    try {
      const gradesData = await parseCsv(gradesFile);
      const attendanceData = await parseCsv(attendanceFile);
      
      const payload: PredictRequest = {
        grades: gradesData.map(g => ({
          student_id: g.student_id,
          course: g.course || g.course_id || "Unknown",
          score: g.score || g.grade || 0
        })),
        attendance: attendanceData.map(a => ({
          student_id: a.student_id,
          percentage: a.percentage || a.attendance || 0
        }))
      };

      await predict(payload);
      toast({ title: "Analysis Complete", description: "Data successfully processed by the ML model." });
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message || "Check CSV format", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-display font-bold text-slate-900">Upload Dataset</h2>
        <p className="text-slate-500 mt-2">Provide grades and attendance CSV files to generate risk predictions.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-md shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileType className="w-5 h-5 text-primary" />
              Grades Data
            </CardTitle>
            <CardDescription>CSV with student_id, course, score</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${gradesFile ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
              onClick={() => gradesInputRef.current?.click()}
            >
              <input type="file" accept=".csv" className="hidden" ref={gradesInputRef} onChange={(e) => setGradesFile(e.target.files?.[0] || null)} />
              {gradesFile ? (
                <div className="flex flex-col items-center text-emerald-600">
                  <CheckCircle2 className="w-10 h-10 mb-3" />
                  <span className="font-medium">{gradesFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <UploadCloud className="w-10 h-10 mb-3" />
                  <span className="font-medium text-slate-600">Click to upload Grades CSV</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-md shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileType className="w-5 h-5 text-indigo-500" />
              Attendance Data
            </CardTitle>
            <CardDescription>CSV with student_id, percentage</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${attendanceFile ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
              onClick={() => attendanceInputRef.current?.click()}
            >
              <input type="file" accept=".csv" className="hidden" ref={attendanceInputRef} onChange={(e) => setAttendanceFile(e.target.files?.[0] || null)} />
              {attendanceFile ? (
                <div className="flex flex-col items-center text-emerald-600">
                  <CheckCircle2 className="w-10 h-10 mb-3" />
                  <span className="font-medium">{attendanceFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <UploadCloud className="w-10 h-10 mb-3" />
                  <span className="font-medium text-slate-600">Click to upload Attendance CSV</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-4 pt-6">
        <Button 
          size="lg" 
          className="px-12 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all w-full md:w-auto"
          disabled={!gradesFile || !attendanceFile || isPredicting}
          onClick={handleAnalyze}
        >
          {isPredicting ? "Processing Data..." : "Analyze Student Data"}
        </Button>
        
        <div className="flex items-center gap-4 w-full md:w-auto mt-4">
          <div className="h-px bg-slate-200 flex-1 md:w-24"></div>
          <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold">OR</span>
          <div className="h-px bg-slate-200 flex-1 md:w-24"></div>
        </div>

        <Button 
          variant="outline" 
          className="border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 w-full md:w-auto"
          onClick={() => {
            generateDemoData();
            toast({ title: "Demo Mode Active", description: "Generated 200 synthetic student records." });
          }}
        >
          Use Synthetic Demo Data
        </Button>
      </div>
    </div>
  );
}
