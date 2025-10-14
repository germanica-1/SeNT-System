import StudentManagement from "@/components/dashboard/StudentManagement";
import AttendanceLogs from "@/components/dashboard/AttendanceLogs";
import EmergencyNotification from "@/components/dashboard/EmergencyNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AttendanceManagementStoryboard() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            School Management System
          </h1>
          <p className="text-gray-600">
            Complete admin dashboard for managing student attendance and school
            operations
          </p>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceLogs />
          </TabsContent>

          <TabsContent value="emergency" className="mt-6">
            <EmergencyNotification />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
