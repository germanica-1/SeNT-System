Secure Entry, Notification, and Tracking System (SeNT)

SeNT is an integrated system built to enhance school security, automate attendance tracking, and streamline communication through face recognition and real-time alerts. It combines a Flask API server, a Raspberry Pi client, and a web dashboard for admin controls and reporting.

Overview :


The system captures a student’s face via a Raspberry Pi camera and sends the frame to a Flask-based backend for face embedding and comparison against pre-synced student embeddings stored in Supabase.
If a match is found, the student’s attendance is logged with the current date and time, displayed on a Waveshare HDMI LCD, and can trigger a notification or email to the parent.
If no match is found, the system alerts the staff (and optionally triggers a buzzer).



Features :

Automated Attendance Recognition – Real-time facial recognition for logging student presence.

Emergency Notifications – Send, view, and manage critical alerts from the web dashboard.

Attendance Logs & Records – Automatically record check-ins with timestamps.

Data Export – Export logs to Excel or PDF for reporting.

LCD Display Integration – Shows live camera feed, recognition results, and timestamps.

Parent Notifications – Automatically email parents when their child is logged in the attendance logs.



Web Dashboard :

The admin dashboard provides a centralized interface for:

Managing student profiles and parent contacts

Viewing and exporting attendance logs

Sending emergency notifications

Syncing data with the Flask Server 

Built with Vite + React, powered by Supabase as the backend database and Flask as the backend server.




Tech Stack:

🖥️ Server

Python (Flask) – for face matching and syncing

FaceNet + MTCNN – Facial embedding and detection

NumPy & OpenCV – Image and vector processing

Supabase – Cloud database for student data

💻 Client (Raspberry Pi)

OpenCV – Frame capture

Requests – Sending frames to the Flask API

Waveshare HDMI LCD – Display for feedback and camera feed

🌐 Web Frontend

Vite + React – Web dashboard for admin management

Supabase SDK – Data operations

EmailJS – For sending automated email notifications
