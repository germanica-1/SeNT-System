import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  Search,
  Clock,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AttendanceLog {
  id: string;
  full_name: string;
  grade_level: string;
  section: string;
  time: string;
  date: string;
  created_at: string;
}

interface AttendanceLogsProps {
  isVisible?: boolean;
}

const AttendanceLogs = ({ isVisible = true }: AttendanceLogsProps) => {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("daily");
  const { toast } = useToast();

  const fetchAttendanceLogs = useCallback(async () => {
    if (!isVisible) return;
    
    try {
      setLoading(true);

      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      // Filter by date range based on active tab
      const today = new Date();
      if (activeTab === "daily") {
        const todayStr = format(today, "yyyy-MM-dd");
        query = query.eq("date", todayStr);
      } else if (activeTab === "weekly") {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("date", format(weekAgo, "yyyy-MM-dd"));
      } else if (activeTab === "monthly") {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte("date", format(monthAgo, "yyyy-MM-dd"));
      }

      // Apply specific date filter if set
      if (dateFilter) {
        query = query.eq("date", dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceLogs(data || []);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter, isVisible, toast]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isVisible) return;

    fetchAttendanceLogs();

    const subscription = supabase
      .channel("attendance_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => {
          console.log("Attendance logs changed, refreshing data");
          setTimeout(() => {
            fetchAttendanceLogs();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isVisible, fetchAttendanceLogs]);

  // Fetch when tab or date filter changes
  useEffect(() => {
    if (isVisible) {
      fetchAttendanceLogs();
    }
  }, [activeTab, dateFilter, isVisible, fetchAttendanceLogs]);

  const exportToExcel = () => {
    const csvContent = filteredLogs
      .map(
        (log) =>
          `${log.full_name},${log.grade_level},${log.section},${log.date},${log.time}`
      )
      .join("\n");

    const blob = new Blob(
      [`Full Name,Grade Level,Section,Date,Time\n${csvContent}`],
      { type: "text/csv" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Attendance logs exported to Excel successfully",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Attendance Logs Report", 14, 22);
    
    // Add date range info
    doc.setFontSize(12);
    const dateInfo = `Generated on: ${format(new Date(), "MMM dd, yyyy 'at' HH:mm")}`;
    doc.text(dateInfo, 14, 32);
    
    // Add filter info if any filters are applied
    let filterInfo = "";
    if (gradeFilter !== "all") filterInfo += `Grade: ${gradeFilter} `;
    if (sectionFilter !== "all") filterInfo += `Section: ${sectionFilter} `;
    if (dateFilter) filterInfo += `Date: ${format(new Date(dateFilter), "MMM dd, yyyy")} `;
    if (searchTerm) filterInfo += `Search: "${searchTerm}" `;
    
    if (filterInfo) {
      doc.setFontSize(10);
      doc.text(`Filters Applied: ${filterInfo}`, 14, 40);
    }

    // Prepare table data
    const tableData = filteredLogs.map((log) => [
      log.full_name,
      log.grade_level,
      `Section ${log.section}`,
      format(new Date(log.date), "MMM dd, yyyy"),
      log.time,
    ]);

    // Add table
    autoTable(doc, {
      head: [["Student Name", "Grade Level", "Section", "Date", "Time"]],
      body: tableData,
      startY: filterInfo ? 45 : 38,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      margin: { top: 10 },
    });

    // Add summary at the bottom
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(10);
    doc.text(`Total Records: ${filteredLogs.length}`, 14, finalY + 15);

    // Save the PDF
    doc.save(`attendance_logs_${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "Attendance logs exported to PDF successfully",
    });
  };

  // Get unique sections from attendance logs
  const uniqueSections = Array.from(
    new Set(attendanceLogs.map((log) => log.section).filter(Boolean))
  );

  // Memoize filtered logs to prevent unnecessary re-renders
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const matchesSearch = log.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesGrade =
        gradeFilter === "all" || log.grade_level === gradeFilter;
      const matchesSection =
        sectionFilter === "all" || log.section === sectionFilter;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [attendanceLogs, searchTerm, gradeFilter, sectionFilter]);

  // Memoize stats calculation
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const todayLogs = filteredLogs.filter(log => log.date === format(new Date(), "yyyy-MM-dd")).length;

    return { total, todayLogs };
  }, [filteredLogs]);

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Attendance Logs
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Track and monitor student attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button
            onClick={exportToPDF}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                  Total Records
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                  Today's Records
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {stats.todayLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-shrink-0 relative">
            <div 
              className="relative cursor-pointer"
              onClick={() => {
                const dateInput = document.getElementById('attendance-date-filter');
                if (dateInput) {
                  dateInput.showPicker?.() || dateInput.focus();
                }
              }}
            >
              <Input
                id="attendance-date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                placeholder="Select date"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-600 dark:text-gray-300 pointer-events-none" />
            </div>
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32 sm:w-40 flex-shrink-0">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Grade 7">Grade 7</SelectItem>
              <SelectItem value="Grade 8">Grade 8</SelectItem>
              <SelectItem value="Grade 9">Grade 9</SelectItem>
              <SelectItem value="Grade 10">Grade 10</SelectItem>
              <SelectItem value="Grade 11">Grade 11</SelectItem>
              <SelectItem value="Grade 12">Grade 12</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-32 sm:w-40 flex-shrink-0">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {uniqueSections.map((section) => (
                <SelectItem key={section} value={section}>
                  Section {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Grade & Section</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading attendance logs...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {log.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{log.full_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">{log.grade_level}</Badge>
                      <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                        Section {log.section}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {log.time}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceLogs;