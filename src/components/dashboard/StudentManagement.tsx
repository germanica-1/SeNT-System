import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  CreditCard,
  X,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Student {
  id: string;
  full_name: string;
  grade_level: string;
  section: string;
  face_embedding_front?: number[];
  face_embedding_low_angle?: number[];
  face_embedding_left?: number[];
  face_embedding_right?: number[];
  face_image_front_url?: string;
  face_image_low_angle_url?: string;
  face_image_left_url?: string;
  face_image_right_url?: string;
  parent_contact: string;
  parent_email?: string;
  created_at: string;
}

interface StudentManagementProps {
  isVisible?: boolean;
  isSidebarCollapsed?: boolean;
}

// Enhanced cache with subscription management
const studentCache = {
  data: null as Student[] | null,
  timestamp: 0,
  subscription: null as any,
  subscribers: new Set<() => void>(),
  isValid: () => Date.now() - studentCache.timestamp < 5 * 60 * 1000, // 5 minutes (reduced for more frequent updates)
  invalidate: () => {
    studentCache.timestamp = 0;
    studentCache.subscribers.forEach((callback) => callback());
  },
  subscribe: (callback: () => void) => {
    studentCache.subscribers.add(callback);
    return () => studentCache.subscribers.delete(callback);
  },
  setData: (data: Student[]) => {
    studentCache.data = data;
    studentCache.timestamp = Date.now();
  },
  forceRefresh: () => {
    studentCache.timestamp = 0;
    studentCache.subscribers.forEach((callback) => callback());
  },
};

const StudentManagement = ({ isVisible = true, isSidebarCollapsed = false }: StudentManagementProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    grade_level: "",
    section: "",
    face_embedding_front: null as number[] | null,
    face_embedding_low_angle: null as number[] | null,
    face_embedding_left: null as number[] | null,
    face_embedding_right: null as number[] | null,
    face_image_front_url: "" as string,
    face_image_low_angle_url: "" as string,
    face_image_left_url: "" as string,
    face_image_right_url: "" as string,
    parent_contact: "",
    parent_email: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    front: File | null;
    lowAngle: File | null;
    left: File | null;
    right: File | null;
  }>({ front: null, lowAngle: null, left: null, right: null });
  const [previewUrls, setPreviewUrls] = useState<{
    front: string;
    lowAngle: string;
    left: string;
    right: string;
  }>({ front: "", lowAngle: "", left: "", right: "" });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProcessingEmbeddings, setIsProcessingEmbeddings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    lowAngle: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  };

  const fetchStudents = useCallback(
    async (forceRefresh = false) => {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && studentCache.isValid() && studentCache.data) {
        setStudents(studentCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const studentsData = data || [];
        setStudents(studentsData);
        studentCache.setData(studentsData);

        // Setup real-time subscription only once
        if (!studentCache.subscription) {
          console.log("Setting up real-time subscription for students");
          studentCache.subscription = supabase
            .channel("students_realtime_changes")
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "students" },
              (payload) => {
                console.log("Real-time change detected:", payload);
                // Force immediate refresh when data changes
                setTimeout(() => {
                  studentCache.forceRefresh();
                }, 100);
              },
            )
            .subscribe((status) => {
              console.log("Subscription status:", status);
            });
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to fetch students",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Lazy loading with cache subscription
  useEffect(() => {
    if (isVisible && !hasInitialized) {
      setHasInitialized(true);
      fetchStudents();
    }
  }, [isVisible, hasInitialized, fetchStudents]);

  // Subscribe to cache invalidation when component is visible
  useEffect(() => {
    if (isVisible) {
      const unsubscribe = studentCache.subscribe(() => {
        console.log("Cache invalidated, refreshing students");
        fetchStudents(true);
      });

      return unsubscribe;
    }
  }, [isVisible, fetchStudents]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (studentCache.subscription && studentCache.subscribers.size <= 1) {
        console.log("Cleaning up real-time subscription");
        supabase.removeChannel(studentCache.subscription);
        studentCache.subscription = null;
      }
    };
  }, []);

  // Process embeddings for all students
  const handleProcessEmbeddings = async () => {
    try {
      setIsProcessingEmbeddings(true);

      const apiUrl = import.meta.env.VITE_LOCAL_API_URL;
      const response = await fetch(`${apiUrl}/api/process-embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Processed embeddings for ${result.processed || 0} students`,
      });

      await fetchStudents();
    } catch (error) {
      console.error("Error processing embeddings:", error);
      toast({
        title: "Error",
        description: "Failed to process embeddings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEmbeddings(false);
    }
  };

  // Sync students with external system
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      const apiUrl = import.meta.env.VITE_LOCAL_SYNC_API_URL;
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Synced ${result.synced || 0} students successfully`,
      });

      await fetchStudents();
    } catch (error) {
      console.error("Error syncing students:", error);
      toast({
        title: "Error",
        description: "Failed to sync students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Convert image file to base64 for database storage
  const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to base64"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  // Image processing function for preview
  const processImageForPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Set target dimensions (4:5 aspect ratio, 600x750)
        const targetWidth = 600;
        const targetHeight = 750;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate scaling and cropping
        const imgAspectRatio = img.width / img.height;
        const targetAspectRatio = targetWidth / targetHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (imgAspectRatio > targetAspectRatio) {
          // Image is wider than target, crop width
          sourceWidth = img.height * targetAspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller than target, crop height
          sourceHeight = img.width / targetAspectRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw the cropped and resized image
        ctx?.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        );

        // Convert to base64 with compression
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Image quality detection using Laplacian variance (blur detection)
  const checkImageQuality = (file: File): Promise<{ isQualityOk: boolean; score: number; message: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve({ isQualityOk: false, score: 0, message: "Failed to analyze image quality." });
          return;
        }

        // Resize for faster processing (max 500px)
        const maxSize = 500;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and calculate Laplacian variance
        const width = canvas.width;
        const height = canvas.height;
        const gray: number[] = [];
        
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale conversion
          gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        
        // Apply Laplacian kernel and calculate variance
        let sum = 0;
        let sumSq = 0;
        let count = 0;
        
        // Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const laplacian = 
              gray[idx - width] +     // top
              gray[idx - 1] +         // left
              -4 * gray[idx] +        // center
              gray[idx + 1] +         // right
              gray[idx + width];      // bottom
            
            sum += laplacian;
            sumSq += laplacian * laplacian;
            count++;
          }
        }
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        
        // Threshold for blur detection (lower variance = more blur)
        // Typical values: < 100 = very blurry, 100-500 = somewhat blurry, > 500 = sharp
        const blurThreshold = 100;
        const isQualityOk = variance >= blurThreshold;
        
        // Also check minimum resolution
        const minResolution = 200;
        const hasMinResolution = img.width >= minResolution && img.height >= minResolution;
        
        if (!hasMinResolution) {
          resolve({
            isQualityOk: false,
            score: variance,
            message: `Image resolution too low. Minimum ${minResolution}x${minResolution} pixels required.`
          });
          return;
        }
        
        if (!isQualityOk) {
          resolve({
            isQualityOk: false,
            score: variance,
            message: "Image appears to be blurry or low-quality. Please upload a clearer photo."
          });
          return;
        }
        
        resolve({
          isQualityOk: true,
          score: variance,
          message: "Image quality is acceptable."
        });
      };
      
      img.onerror = () => {
        resolve({ isQualityOk: false, score: 0, message: "Failed to load image for quality check." });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "front" | "lowAngle" | "left" | "right",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG or PNG image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Check image quality (blur detection)
    const qualityResult = await checkImageQuality(file);
    if (!qualityResult.isQualityOk) {
      toast({
        title: "Image Quality Issue",
        description: qualityResult.message,
        variant: "destructive",
      });
      // Clear the file input
      if (fileInputRefs[imageType].current) {
        fileInputRefs[imageType].current.value = "";
      }
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [imageType]: file }));

    try {
      // Process image for preview
      const processedImageUrl = await processImageForPreview(file);
      setPreviewUrls((prev) => ({ ...prev, [imageType]: processedImageUrl }));

      const angleNames = {
        front: "Front-angle",
        lowAngle: "Low-angle",
        left: "Left-angle",
        right: "Right-angle",
      };

      toast({
        title: "Image Selected",
        description: `${angleNames[imageType]} photo selected successfully.`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove selected image
  const removeImage = (imageType: "front" | "lowAngle" | "left" | "right") => {
    setSelectedFiles((prev) => ({ ...prev, [imageType]: null }));
    setPreviewUrls((prev) => ({ ...prev, [imageType]: "" }));
    if (fileInputRefs[imageType].current) {
      fileInputRefs[imageType].current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.grade_level) {
      toast({
        title: "Validation Error",
        description: "Grade level is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.section.trim()) {
      toast({
        title: "Validation Error",
        description: "Section is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.parent_contact.trim()) {
      toast({
        title: "Validation Error",
        description: "Parent contact is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.parent_email.trim()) {
      toast({
        title: "Validation Error",
        description: "Parent email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      // First, create/update student record with basic info (no image URLs yet)
      const basicStudentData = {
        full_name: formData.full_name.trim(),
        grade_level: formData.grade_level,
        section: formData.section.trim(),
        parent_contact: formData.parent_contact.trim(),
        parent_email: formData.parent_email.trim(),
      };

      let studentId = editingStudent?.id;

      if (editingStudent) {
        // Update existing student basic info
        const { error } = await supabase
          .from("students")
          .update(basicStudentData)
          .eq("id", editingStudent.id);

        if (error) throw error;
      } else {
        // Create new student with basic info
        const { data, error } = await supabase
          .from("students")
          .insert([basicStudentData])
          .select("id")
          .single();

        if (error) throw error;
        studentId = data.id;
      }

      // Convert images to base64 and store in database
      const imageData: {
        face_image_front_url?: string;
        face_image_low_angle_url?: string;
        face_image_left_url?: string;
        face_image_right_url?: string;
      } = {};

      // Process images sequentially
      const imageTypes = [
        {
          key: "front",
          file: selectedFiles.front,
          urlKey: "face_image_front_url",
        },
        {
          key: "lowAngle",
          file: selectedFiles.lowAngle,
          urlKey: "face_image_low_angle_url",
        },
        {
          key: "left",
          file: selectedFiles.left,
          urlKey: "face_image_left_url",
        },
        {
          key: "right",
          file: selectedFiles.right,
          urlKey: "face_image_right_url",
        },
      ] as const;

      for (const { key, file, urlKey } of imageTypes) {
        if (file && studentId) {
          try {
            const base64Data = await convertImageToBase64(file);
            imageData[urlKey] = base64Data;
            console.log(`Successfully processed ${key} image`);
          } catch (error: any) {
            console.error(`Error processing ${key} image:`, error);
            const errorMessage = error?.message || "Unknown error occurred";

            toast({
              title: "Image Processing Failed",
              description: `Failed to process ${key} image: ${errorMessage}`,
              variant: "destructive",
            });
          }
        }
      }

      // Update student record with image data
      if (Object.keys(imageData).length > 0 && studentId) {
        const { error: updateError } = await supabase
          .from("students")
          .update(imageData)
          .eq("id", studentId);

        if (updateError) {
          console.error("Error updating image data:", updateError);
          toast({
            title: "Warning",
            description:
              "Student saved but failed to update image data in database",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: editingStudent
          ? "Student updated successfully"
          : "Student added successfully",
      });

      // Reset form and dialog state
      setFormData({
        full_name: "",
        grade_level: "",
        section: "",
        face_embedding_front: null,
        face_embedding_low_angle: null,
        face_embedding_left: null,
        face_embedding_right: null,
        face_image_front_url: "",
        face_image_low_angle_url: "",
        face_image_left_url: "",
        face_image_right_url: "",
        parent_contact: "",
        parent_email: "",
      });
      setSelectedFiles({
        front: null,
        lowAngle: null,
        left: null,
        right: null,
      });
      setPreviewUrls({ front: "", lowAngle: "", left: "", right: "" });

      // Clear file inputs
      Object.values(fileInputRefs).forEach((ref) => {
        if (ref.current) {
          ref.current.value = "";
        }
      });

      // Close dialog and reset editing state
      setIsAddDialogOpen(false);
      setEditingStudent(null);

      // Force immediate refresh to show new/updated student
      studentCache.forceRefresh();
      await fetchStudents(true);
    } catch (error: any) {
      console.error("Error saving student:", error);

      // Handle specific error cases
      let errorMessage = "Failed to save student";

      if (error?.code === "23505") {
        errorMessage = "A student with this information already exists";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      grade_level: student.grade_level,
      section: student.section,
      face_embedding_front: student.face_embedding_front || null,
      face_embedding_low_angle: student.face_embedding_low_angle || null,
      face_embedding_left: student.face_embedding_left || null,
      face_embedding_right: student.face_embedding_right || null,
      face_image_front_url: student.face_image_front_url || "",
      face_image_low_angle_url: student.face_image_low_angle_url || "",
      face_image_left_url: student.face_image_left_url || "",
      face_image_right_url: student.face_image_right_url || "",
      parent_contact: student.parent_contact,
      parent_email: student.parent_email || "",
    });

    // Show existing images in preview if available
    setPreviewUrls({
      front: student.face_image_front_url || "",
      lowAngle: student.face_image_low_angle_url || "",
      left: student.face_image_left_url || "",
      right: student.face_image_right_url || "",
    });
    setSelectedFiles({ front: null, lowAngle: null, left: null, right: null });

    setIsAddDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;
      toast({ title: "Success", description: "Student deleted successfully" });

      // Force immediate refresh to show updated list
      studentCache.forceRefresh();
      await fetchStudents(true);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  // Get unique sections from students data
  const uniqueSections = Array.from(
    new Set(students.map((student) => student.section).filter(Boolean)),
  );

  // Memoize filtered students to prevent unnecessary re-renders
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_contact.includes(searchTerm);
      const matchesGrade =
        gradeFilter === "all" || student.grade_level === gradeFilter;
      const matchesSection =
        sectionFilter === "all" || student.section === sectionFilter;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [students, searchTerm, gradeFilter, sectionFilter]);

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Student Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage student profiles and information
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (open && !editingStudent) {
                setFormData({
                  full_name: "",
                  grade_level: "",
                  section: "",
                  face_embedding_front: null,
                  face_embedding_low_angle: null,
                  face_embedding_left: null,
                  face_embedding_right: null,
                  face_image_front_url: "",
                  face_image_low_angle_url: "",
                  face_image_left_url: "",
                  face_image_right_url: "",
                  parent_contact: "",
                  parent_email: "",
                });
                setSelectedFiles({
                  front: null,
                  lowAngle: null,
                  left: null,
                  right: null,
                });
                setPreviewUrls({
                  front: "",
                  lowAngle: "",
                  left: "",
                  right: "",
                });
                Object.values(fileInputRefs).forEach((ref) => {
                  if (ref.current) {
                    ref.current.value = "";
                  }
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade_level">Grade Level *</Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grade_level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section *</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value })
                      }
                      placeholder="Enter section"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_contact">Parent Contact *</Label>
                    <Input
                      id="parent_contact"
                      value={formData.parent_contact}
                      onChange={(e) => {
                        // Format the input to 09xx xxx xxxx pattern
                        let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                        if (value.length > 0) {
                          if (value.length <= 4) {
                            value = value;
                          } else if (value.length <= 7) {
                            value = value.slice(0, 4) + " " + value.slice(4);
                          } else {
                            value =
                              value.slice(0, 4) +
                              " " +
                              value.slice(4, 7) +
                              " " +
                              value.slice(7, 11);
                          }
                        }
                        setFormData({ ...formData, parent_contact: value });
                      }}
                      placeholder="09xx xxx xxxx"
                      maxLength={13}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="parent_email">Parent Email *</Label>
                    <Input
                      id="parent_email"
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parent_email: e.target.value,
                        })
                      }
                      placeholder="Enter parent's email address"
                      required
                    />
                  </div>
                </div>

                {/* Face Photos Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Face Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        key: "front",
                        label: "Front View",
                        ref: fileInputRefs.front,
                      },
                      {
                        key: "lowAngle",
                        label: "Low Angle",
                        ref: fileInputRefs.lowAngle,
                      },
                      {
                        key: "left",
                        label: "Left Profile",
                        ref: fileInputRefs.left,
                      },
                      {
                        key: "right",
                        label: "Right Profile",
                        ref: fileInputRefs.right,
                      },
                    ].map(({ key, label, ref }) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {previewUrls[key as keyof typeof previewUrls] ? (
                            <div className="relative">
                              <img
                                src={
                                  previewUrls[key as keyof typeof previewUrls]
                                }
                                alt={`${label} preview`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1"
                                onClick={() =>
                                  removeImage(key as keyof typeof selectedFiles)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => ref.current?.click()}
                              >
                                Upload {label}
                              </Button>
                            </div>
                          )}
                          <input
                            ref={ref}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) =>
                              handleFileSelect(
                                e,
                                key as keyof typeof selectedFiles,
                              )
                            }
                            className="hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingStudent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploadingImage}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isUploadingImage
                      ? "Saving..."
                      : editingStudent
                        ? "Update Student"
                        : "Add Student"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleProcessEmbeddings}
            disabled={isProcessingEmbeddings || students.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 whitespace-nowrap"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{isProcessingEmbeddings ? "Processing..." : "Process Images"}</span>
            <span className="sm:hidden">{isProcessingEmbeddings ? "Processing..." : "Process"}</span>
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-purple-500 hover:bg-purple-600 text-white disabled:bg-gray-400 whitespace-nowrap"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students by name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32 sm:w-40">
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
            <SelectTrigger className="w-32 sm:w-40">
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

      {/* Students Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%] min-w-[200px]">Student</TableHead>
                <TableHead className="w-[20%] min-w-[120px]">Grade & Section</TableHead>
                <TableHead className="w-[25%] min-w-[130px]">Parent Contact</TableHead>
                <TableHead className="w-[20%] min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          {student.face_image_front_url ? (
                            <AvatarImage src={student.face_image_front_url} />
                          ) : null}
                          <AvatarFallback>
                            {student.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate text-base">{student.full_name}</div>
                          <div className="text-base text-gray-500 dark:text-gray-300 truncate">
                            {student.parent_email}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 truncate">
                            {[
                              student.face_embedding_front && "Front",
                              student.face_embedding_low_angle && "Low-angle",
                              student.face_embedding_left && "Left",
                              student.face_embedding_right && "Right",
                            ]
                              .filter(Boolean)
                              .join(", ") || "No embeddings"}{" "}
                            face data
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{student.grade_level}</Badge>
                        <div className="text-base text-gray-500 dark:text-gray-300 mt-1">
                          Section {student.section}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{student.parent_contact}</TableCell>

                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-10 sm:w-auto"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-10 sm:w-auto"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;