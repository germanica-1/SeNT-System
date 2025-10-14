import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, BarChart2, Users, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProjectCardProps {
  title: string;
  progress: number;
  team: Array<{ name: string; avatar: string }>;
  dueDate: string;
}

interface DashboardGridProps {
  projects?: ProjectCardProps[];
  isLoading?: boolean;
}

const defaultProjects: ProjectCardProps[] = [
  {
    title: "Grade 1 - Section A",
    progress: 95,
    team: [
      {
        name: "Emma",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
      {
        name: "Liam",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
      },
      {
        name: "Olivia",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
      },
    ],
    dueDate: "Today",
  },
  {
    title: "Grade 2 - Section B",
    progress: 88,
    team: [
      {
        name: "Noah",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
      },
      {
        name: "Ava",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ava",
      },
    ],
    dueDate: "Today",
  },
  {
    title: "Grade 3 - Section C",
    progress: 92,
    team: [
      {
        name: "Sophia",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
      },
      {
        name: "Mason",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mason",
      },
      {
        name: "Isabella",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella",
      },
    ],
    dueDate: "Today",
  },
];

const ProjectCard = ({ title, progress, team, dueDate }: ProjectCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
          <BarChart2 className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-900">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-gray-100 rounded-full"
              style={
                {
                  backgroundColor: "rgb(243, 244, 246)",
                } as React.CSSProperties
              }
            />
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Attendance: {dueDate}</span>
            </div>
            <div className="flex -space-x-2">
              {team.map((member, i) => (
                <Avatar
                  key={i}
                  className="h-7 w-7 border-2 border-white shadow-sm"
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardGrid = ({
  projects = defaultProjects,
  isLoading = false,
}: DashboardGridProps) => {
  const [loading, setLoading] = useState(isLoading);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm h-[200px] sm:h-[220px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="relative">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-blue-500/20 animate-pulse" />
                  </div>
                </div>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-500 text-center">
                  Loading project data...
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Summary Cards */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900">
              Total Students
            </CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
              245
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Enrolled students
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900">
              Present Today
            </CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-green-50 flex items-center justify-center">
              <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
              228
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              93% attendance rate
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900">
              Absent Today
            </CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-red-50 flex items-center justify-center">
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
              17
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Require follow-up
            </p>
          </CardContent>
        </Card>

        {/* Project Cards */}
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
};

export default DashboardGrid;
