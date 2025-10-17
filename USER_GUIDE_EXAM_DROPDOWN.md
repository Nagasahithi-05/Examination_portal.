# Student Exam Selection - Quick Guide

## 🎯 What Changed?

**Before**: Students had to enter exam codes manually
**Now**: Students select exams from a dropdown menu!

---

## 📋 How to Use (Student)

### Step 1: Login to Your Account
- Go to the login page
- Enter your email and password
- Click "Login"

### Step 2: View Available Exams
Once logged in, you'll see:

1. **Stats Dashboard** at the top showing:
   - Total Exams
   - Completed Exams
   - Average Score
   - Upcoming Exams

2. **Quick Start Exam Section** with a dropdown menu

3. **Available Exams List** with detailed cards

### Step 3: Start an Exam (Two Ways)

#### Option A: Quick Dropdown
```
1. Click the dropdown menu at the top
2. Select your exam from the list
3. Click "Start Exam" button
```

#### Option B: Exam Cards
```
1. Scroll to "Available Exams" section
2. Find your exam card
3. Click "Start Exam" on the specific card
```

---

## 🔍 Exam Information Display

Each exam shows:
- ✏️ **Title**: Exam name (e.g., "Mathematics Final Exam")
- 👨‍🏫 **Teacher**: Who created the exam
- 📅 **Date**: When the exam is scheduled
- ⏰ **Time**: Start time
- ⏱️ **Duration**: How long you have to complete it
- 📊 **Marks**: Total marks available
- 🏷️ **Status Badge**: Active/Upcoming/Completed

---

## 🎨 Status Colors

- **🟢 Green Badge (Active)**: You can take this exam now!
- **🟡 Yellow Badge (Upcoming)**: Exam not started yet
- **⚫ Gray Badge (Completed)**: Exam period ended

**Note**: You can only start exams with **Active** status.

---

## 🎓 For Teachers/Admins

### How to Make Exams Available to Students:

1. **Create an Exam**:
   - Go to Create Exam page
   - Fill in exam details
   - Set start date to current or future date
   - Set end date after start date

2. **Publish the Exam**:
   - Make sure "Active" is enabled
   - Click "Publish" or "Create Exam"

3. Students will now see the exam in their dropdown!

---

## ⚙️ Technical Requirements

### Backend Must Be Running:
```bash
cd backend
npm start
# Server should be on http://localhost:5001
```

### Frontend Must Be Running:
```bash
cd frontend
npm start
# App should be on http://localhost:3000
```

### Database Must Be Connected:
- MongoDB Atlas connection configured
- Check for "✅ Connected to MongoDB successfully" in backend console

---

## 🐛 Troubleshooting

### Problem: No exams showing in dropdown
**Solution**:
- Make sure at least one exam is created
- Check if exam is published (`isPublished: true`)
- Check if exam is active (`isActive: true`)
- Verify exam dates (start date should be now or past, end date should be future)

### Problem: "Start Exam" button is disabled
**Solution**:
- Check exam status - only Active exams can be started
- If exam is "Upcoming", wait until start date/time
- If exam is "Completed", you can no longer take it

### Problem: Dropdown is empty but exams exist
**Solution**:
- Refresh the page
- Check browser console for errors (F12)
- Verify backend is running on port 5001
- Check network tab to see if API call is successful

### Problem: "Failed to load exam data" error
**Solution**:
- Check if backend server is running
- Verify MongoDB connection is active
- Check if student is logged in properly
- Clear browser cache and cookies

---

## 📱 Mobile Responsive

The dropdown and exam cards work on:
- 💻 Desktop computers
- 📱 Mobile phones
- 📱 Tablets

---

## 🚀 Quick Start Checklist

- [ ] Backend server running (port 5001)
- [ ] Frontend server running (port 3000)
- [ ] MongoDB connected
- [ ] At least one exam created
- [ ] Exam is published and active
- [ ] Logged in as student
- [ ] Can see exams in dropdown
- [ ] Can click "Start Exam"

---

## 📞 Support

If you encounter issues:
1. Check the browser console (F12 → Console tab)
2. Check backend terminal for errors
3. Verify all services are running
4. Check MongoDB connection

---

**Last Updated**: October 15, 2025
**Version**: 2.0
