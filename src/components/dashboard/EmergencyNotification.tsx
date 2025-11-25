import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Send,
  History,
  Users,
  MessageSquare,
  Mail,
  Phone,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface EmergencyNotification {
  id: string;
  message: string;
  sent_at: string;
  recipient_count: number;
}

interface EmergencyNotificationProps {
  isVisible?: boolean;
  isSidebarCollapsed?: boolean;
}

// Enhanced cache with subscription management
const emergencyCache = {
  notifications: null as EmergencyNotification[] | null,
  parentCount: 0,
  emailCount: 0,
  timestamp: 0,
  subscription: null as any,
  subscribers: new Set<() => void>(),
  isValid: () => Date.now() - emergencyCache.timestamp < 10 * 60 * 1000, // 10 minutes
  invalidate: () => {
    emergencyCache.timestamp = 0;
    emergencyCache.subscribers.forEach((callback) => callback());
  },
  subscribe: (callback: () => void) => {
    emergencyCache.subscribers.add(callback);
    return () => emergencyCache.subscribers.delete(callback);
  },
  setData: (
    notifications: EmergencyNotification[],
    parentCount: number,
    emailCount: number,
  ) => {
    emergencyCache.notifications = notifications;
    emergencyCache.parentCount = parentCount;
    emergencyCache.emailCount = emailCount;
    emergencyCache.timestamp = Date.now();
  },
};

const EmergencyNotification = ({
  isVisible = true,
}: EmergencyNotificationProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<EmergencyNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [parentCount, setParentCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();

  const fetchAllData = useCallback(
    async (forceRefresh = false) => {
      // Use cache if valid and not forcing refresh
      if (
        !forceRefresh &&
        emergencyCache.isValid() &&
        emergencyCache.notifications
      ) {
        setNotifications(emergencyCache.notifications);
        setParentCount(emergencyCache.parentCount);
        setEmailCount(emergencyCache.emailCount);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Use setTimeout to make the call non-blocking
        setTimeout(async () => {
          try {
            // Fetch all data in parallel for better performance
            const [notificationsResult, emailCountResult] = await Promise.all([
              supabase
                .from("emergency_notifications")
                .select("*")
                .order("sent_at", { ascending: false })
                .limit(10),
              supabase
                .from("students")
                .select("*", { count: "exact", head: true })
                .not("parent_email", "is", null),
            ]);

            if (notificationsResult.error) throw notificationsResult.error;
            if (emailCountResult.error) throw emailCountResult.error;

            const notificationsData = notificationsResult.data || [];
            const emailCountData = emailCountResult.count || 0;

            setNotifications(notificationsData);
            setEmailCount(emailCountData);

            emergencyCache.setData(notificationsData, 0, emailCountData);

            // Setup real-time subscription only once
            if (!emergencyCache.subscription) {
              emergencyCache.subscription = supabase
                .channel("emergency_changes")
                .on(
                  "postgres_changes",
                  {
                    event: "*",
                    schema: "public",
                    table: "emergency_notifications",
                  },
                  (payload) => {
                    console.log(
                      "Emergency notifications changed, refreshing data",
                      payload
                    );
                    // Immediately refresh data when emergency notifications change
                    setTimeout(() => {
                      fetchAllData(true);
                    }, 100);
                  },
                )
                .on(
                  "postgres_changes",
                  { event: "*", schema: "public", table: "students" },
                  () => {
                    console.log(
                      "Students data changed, invalidating emergency cache",
                    );
                    emergencyCache.invalidate();
                  },
                )
                .subscribe((status) => {
                  console.log("Emergency subscription status:", status);
                });
            }
          } catch (error: unknown) {
            console.error("Error fetching emergency data:", error);
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to fetch emergency notification data",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        }, 0);
      } catch (error: unknown) {
        console.error("Error in fetchAllData:", error);
        setLoading(false);
      }
    },
    [toast],
  );

  // Lazy loading with cache subscription
  useEffect(() => {
    if (isVisible && !hasInitialized) {
      setHasInitialized(true);
      fetchAllData();

      // Subscribe to cache invalidation
      const unsubscribe = emergencyCache.subscribe(() => {
        if (isVisible) {
          fetchAllData(true);
        }
      });

      return unsubscribe;
    }
  }, [isVisible, hasInitialized, fetchAllData]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (
        emergencyCache.subscription &&
        emergencyCache.subscribers.size === 0
      ) {
        supabase.removeChannel(emergencyCache.subscription);
        emergencyCache.subscription = null;
      }
    };
  }, []);

  const sendEmergencyNotification = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to send this emergency notification to ${emailCount} parents via email?`,
      )
    ) {
      return;
    }

    try {
      setSending(true);

      // Fetch all students with parent emails
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("parent_email, full_name")
        .not("parent_email", "is", null);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({
          title: "Warning",
          description: "No parent emails found in the system",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Import emailjs
      const emailjs = (await import("@emailjs/browser")).default;

      // Initialize EmailJS with your public key
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      let emailsSent = 0;
      let emailErrors = 0;

      // Send emails to all parents
      for (const student of students) {
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              title: "EMERGENCY ALERT - STI College Munoz-EDSA",
              to_email: student.parent_email,
              student_name: student.full_name,
              message: message,
              from_name: "STI College Munoz-EDSA Administration",
            }
          );
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to ${student.parent_email}:`, error);
          emailErrors++;
        }
      }

      // Record the notification in the database
      const { error: insertError } = await supabase
        .from("emergency_notifications")
        .insert({
          message: message,
          recipient_count: emailsSent,
        });

      if (insertError) {
        console.error("Error recording notification:", insertError);
      }

      toast({
        title: "Success",
        description: `Emergency notification sent to ${emailsSent} parents via email${emailErrors > 0 ? ` (${emailErrors} errors)` : ""}`,
      });

      setMessage("");
      
      // Immediately refresh the notifications table
      await fetchAllData(true);
    } catch (error: unknown) {
      console.error("Error sending emergency notification:", error);
      toast({
        title: "Error",
        description: `Failed to send emergency notification: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const predefinedMessages = [
  "Emergency evacuation in progress. Please do not come to school to pick up your child. We will notify you when it's safe.",
  "School is under lockdown due to safety concerns. All students are secure. Updates will follow.",
  "Due to severe weather conditions, school is closing early. Please arrange for immediate pickup.",
  "Medical emergency on campus. School operations are temporarily suspended. Students are safe.",
  "Water supply interruption on campus. Classes are suspended until further notice.",
  "Power outage affecting school operations. Early dismissal at 2:00 PM today.",

  ];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-3 sm:p-4 lg:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            <span className="hidden sm:inline">
              Emergency Notification System
            </span>
            <span className="sm:hidden">Emergency Alerts</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Send instant alerts to all parents during emergencies
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{emailCount} email notifications</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Send Emergency Notification */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-red-200 dark:border-red-800/50 bg-white dark:bg-gray-800/80">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Emergency Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div>
                <Label htmlFor="emergency_message">Emergency Message</Label>
                <Textarea
                  id="emergency_message"
                  placeholder="Enter your emergency message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={9}
                  style={{ resize: "none" }}
                  className="mt-1"
                />
              </div>

              <Alert variant="destructive" className="py-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="mb-1">Warning</AlertTitle>
                <AlertDescription className="text-sm leading-tight">
                  This will immediately send email notifications to {emailCount}{" "}
                  parents. Use only for genuine emergencies.
                </AlertDescription>
              </Alert>

            <Button
              onClick={sendEmergencyNotification}
              disabled={sending || !message.trim()}
              className={`w-full mb-0 ${
                message.trim() 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-gray-300 hover:bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Emergency Alert
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        {/* Quick Message Templates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quick Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pb-2">
              <div className="space-y-2 flex-1">
                {predefinedMessages.map((template, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full text-left h-auto p-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                      onClick={() => setMessage(template)}
                    >
                      <div className="text-sm leading-relaxed whitespace-normal break-words">
                        {template}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Notification History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="mt-6 lg:mt-8 bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Emergency Notifications
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading notification history...
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-gray-500"
                    >
                      No emergency notifications sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-base font-medium truncate cursor-help">
                                  {notification.message}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p className="text-base whitespace-normal">
                                  {notification.message}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {notification.recipient_count} parents
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(notification.sent_at),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          Delivered
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
};

export default EmergencyNotification;