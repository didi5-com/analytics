import streamlit as st
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
import requests

# ------------------ PAGE CONFIG ------------------
st.set_page_config(
    page_title="Educational Data Analytics System",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ------------------ API & DATA HANDLING ------------------

def login(email, password):
    """Attempt to log in and return a token."""
    try:
        response = requests.post(
            "http://127.0.0.1:5000/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            st.session_state.token = response.json()["access_token"]
            return True
        else:
            st.sidebar.error("Invalid credentials.")
            return False
    except requests.exceptions.RequestException as e:
        st.sidebar.error(f"Login failed: {e}")
        return False

def get_predictions(grades_df, attendance_df):
    """Send data to the prediction API and return the resulting dataframe."""
    payload = {
        "grades": grades_df.to_dict(orient='records'),
        "attendance": attendance_df.to_dict(orient='records'),
    }
    headers = {"Authorization": f"Bearer {st.session_state.token}"}

    try:
        response = requests.post(
            "http://127.0.0.1:5000/analytics/predict",
            json=payload,
            headers=headers,
        )
        if response.status_code == 200:
            return pd.DataFrame(response.json())
        else:
            st.error(f"Prediction failed: {response.json().get('msg', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        st.error(f"An error occurred while making the request: {e}")
        return None

def get_recommendations(df):
    students = df[['student_id', 'course', 'risk_level']].to_dict(orient='records')
    headers = {"Authorization": f"Bearer {st.session_state.token}"} if 'token' in st.session_state and not st.session_state.demo else {}
    try:
        response = requests.post(
            "http://127.0.0.1:5000/analytics/recommend",
            json={"students": students},
            headers=headers,
        )
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Recommendations failed: {response.json().get('msg', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        st.error(f"Recommendation request failed: {e}")
        return None

# Initialize session state for dataframe
if 'df' not in st.session_state:
    st.session_state.df = None
if 'demo' not in st.session_state:
    st.session_state.demo = False

# ------------------ SIDEBAR ------------------
st.sidebar.title("🔧 Settings")
st.sidebar.checkbox("Demo Mode (no API)", value=st.session_state.demo, key="demo")
st.sidebar.markdown("---")
st.sidebar.title("🔑 Authentication")

if 'token' not in st.session_state and not st.session_state.demo:
    email = st.sidebar.text_input("Email")
    password = st.sidebar.text_input("Password", type="password")
    if st.sidebar.button("Login"):
        if login(email, password):
            st.sidebar.success("Login successful!")
            st.rerun()
elif not st.session_state.demo:
    st.sidebar.success("Logged in successfully.")
    st.sidebar.markdown("---")
    st.sidebar.title("📊 Navigation")
    role = st.sidebar.selectbox(
        "Select View",
        ["Student Dashboard", "Lecturer Dashboard", "Admin Dashboard"]
    )
    st.sidebar.markdown("---")
    st.sidebar.info("Educational Data Analytics System\n\nPython • Flask • Streamlit")
    # Export current data if available
    if st.session_state.df is not None:
        csv = st.session_state.df.to_csv(index=False).encode('utf-8')
        st.sidebar.download_button("Export data (CSV)", csv, "analytics_export.csv", "text/csv")
else:
    st.sidebar.info("Demo Mode enabled. Using synthetic data.")
    st.sidebar.markdown("---")
    st.sidebar.title("📊 Navigation")
    role = st.sidebar.selectbox(
        "Select View",
        ["Student Dashboard", "Lecturer Dashboard", "Admin Dashboard"]
    )
    if st.session_state.df is not None:
        csv = st.session_state.df.to_csv(index=False).encode('utf-8')
        st.sidebar.download_button("Export data (CSV)", csv, "analytics_export.csv", "text/csv")

# ------------------ HEADER ------------------
st.title("🎓 Educational Data Analytics System")
st.caption("Personalized Learning & Academic Intelligence Platform")

if 'token' not in st.session_state and not st.session_state.demo:
    st.info("Please log in or enable Demo Mode to continue.")
    st.stop()

if st.session_state.df is None:
    st.header("📤 Load Data")
    if st.session_state.demo:
        n_students = st.slider("Number of students", 50, 1000, 200)
        courses = ["MTH101", "CSC201", "PHY102", "ENG103", "STA210"]
        rng = np.random.default_rng(42)
        students = np.arange(1, n_students + 1)
        course_choices = rng.choice(courses, size=n_students)
        scores = rng.normal(65, 12, size=n_students).clip(0, 100)
        attendance = rng.normal(80, 10, size=n_students).clip(0, 100)
        df_demo = pd.DataFrame({
            "student_id": students,
            "course": course_choices,
            "score": scores.round(1),
            "attendance": attendance.round(1),
        })
        perf = 0.7 * df_demo["score"] + 0.3 * df_demo["attendance"]
        risk_prob = 1 - (perf / 100)
        bins = [0, 0.4, 0.7, 1.01]
        labels = ["LOW", "MEDIUM", "HIGH"]
        df_demo["risk_probability"] = risk_prob.round(3)
        df_demo["risk_level"] = pd.cut(risk_prob, bins=bins, labels=labels, include_lowest=True)
        st.session_state.df = df_demo
        st.success("Synthetic demo data generated.")
        st.rerun()
    else:
        col1, col2 = st.columns(2)
        with col1:
            grades_file = st.file_uploader("Upload Grades (CSV)", type=["csv"])
        with col2:
            attendance_file = st.file_uploader("Upload Attendance (CSV)", type=["csv"])

        if grades_file and attendance_file:
            grades_df = pd.read_csv(grades_file)
            attendance_df = pd.read_csv(attendance_file)
            
            if st.button("Analyze Student Data", type="primary"):
                with st.spinner("Connecting to API and processing data..."):
                    st.session_state.df = get_predictions(grades_df, attendance_df)
                    if st.session_state.df is not None:
                        st.rerun()

if st.session_state.df is None:
    st.stop()

df = st.session_state.df
df_view = df.copy()
with st.sidebar.expander("Cohort Filters"):
    if "department" in df_view.columns:
        selected_deps = st.multiselect("Departments", sorted(df_view["department"].dropna().unique().tolist()))
        if selected_deps:
            df_view = df_view[df_view["department"].isin(selected_deps)]
    if "level" in df_view.columns:
        selected_lvls = st.multiselect("Levels", sorted(df_view["level"].dropna().unique().tolist()))
        if selected_lvls:
            df_view = df_view[df_view["level"].isin(selected_lvls)]

# ------------------ KPI METRICS ------------------
st.markdown("---")
col1, col2, col3, col4 = st.columns(4)

col1.metric("Average Score", f"{df_view['score'].mean():.1f}")
col2.metric("Avg Attendance", f"{df_view['attendance'].mean():.1f}%")
col3.metric("At-Risk Students", len(df_view[df_view["risk_level"] == "HIGH"]))
col4.metric("Total Students", df_view["student_id"].nunique())

st.markdown("---")

# ================== STUDENT DASHBOARD ==================
if role == "Student Dashboard":
    st.subheader("📘 Student Performance Overview")

    student_id = st.selectbox("Select Student ID", df_view["student_id"].unique())
    student_df = df_view[df_view["student_id"] == student_id]

    if not student_df.empty:
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Scores by Course")
            fig, ax = plt.subplots()
            sns.barplot(x="course", y="score", data=student_df, ax=ax, palette="viridis")
            ax.set_ylim(0, 100)
            st.pyplot(fig)

        with col2:
            st.subheader("Attendance by Course")
            fig, ax = plt.subplots()
            sns.barplot(x="course", y="attendance", data=student_df, ax=ax, palette="plasma")
            ax.set_ylim(0, 100)
            st.pyplot(fig)
        
        risk_level = student_df.iloc[0]['risk_level']
        if risk_level == "HIGH":
            st.error(f"**Risk Level:** {risk_level}")
        elif risk_level == "MEDIUM":
            st.warning(f"**Risk Level:** {risk_level}")
        else:
            st.success(f"**Risk Level:** {risk_level}")

        # RECOMMENDATION SECTION
        st.subheader("📈 Personalized Recommendations")
        with st.expander("Click to see actionable advice"):
            if risk_level == "HIGH":
                st.markdown("""
                **Priority Actions:** Your current performance indicates a **high risk** of failing. It's crucial to take immediate action.
                - **Contact Your Lecturer:** Schedule a meeting with your course lecturer or academic advisor *this week*.
                - **Attend All Classes:** Do not miss any upcoming lectures, labs, or tutorials.
                - **Form a Study Group:** Collaborating with peers can significantly improve understanding.
                - **Seek Tutoring:** Your institution offers academic support services. Find them and use them.
                """)
            elif risk_level == "MEDIUM":
                st.markdown("""
                **Focus Areas:** You are in a middle-ground. With some focused effort, you can significantly improve your standing.
                - **Review Recent Material:** Go over the last few weeks of course material to identify areas of confusion.
                - **Increase Study Time:** Dedicate extra time to practice problems and review notes.
                - **Engage in Class:** Ask questions during lectures to clarify your doubts.
                """)
            else: # LOW risk
                st.markdown("""
                **Keep Up the Great Work!** You are performing well. Here's how to maintain your momentum and excel.
                - **Explore Advanced Topics:** Challenge yourself by reading ahead or exploring supplementary materials.
                - **Mentor a Peer:** Helping others is a great way to solidify your own knowledge.
                - **Plan for Future Courses:** Look at the curriculum ahead and start thinking about your academic path.
                """)

        if not st.session_state.demo:
            if st.button("Fetch API Recommendations"):
                recs = get_recommendations(student_df)
                if recs:
                    st.json(recs)

# ================== LECTURER DASHBOARD ==================
elif role == "Lecturer Dashboard":
    st.subheader("👨‍🏫 Lecturer Analytics")

    course = st.selectbox("Select Course", df_view["course"].unique())
    course_df = df_view[df_view["course"] == course]

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Score Distribution")
        fig, ax = plt.subplots()
        sns.histplot(course_df["score"], kde=True, ax=ax)
        st.pyplot(fig)

    with col2:
        st.subheader("Attendance Spread")
        fig, ax = plt.subplots()
        sns.boxplot(y=course_df["attendance"], ax=ax)
        st.pyplot(fig)

    st.subheader("🚨 At-Risk Students")
    st.dataframe(course_df[course_df["risk_level"] == "HIGH"]) 
    st.subheader("📊 Course Summary")
    c1, c2, c3 = st.columns(3)
    c1.metric("Average Score", f"{course_df['score'].mean():.1f}")
    c2.metric("Avg Attendance", f"{course_df['attendance'].mean():.1f}%")
    c3.metric("High Risk", f"{(course_df['risk_level']=='HIGH').sum()}")
    if not st.session_state.demo:
        if st.button("Fetch Course Recommendations"):
            recs = get_recommendations(course_df)
            if recs:
                st.json(recs)

# ================== ADMIN DASHBOARD ==================
else:
    st.subheader("🏛 Institutional Analytics")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Student Risk Distribution")
        fig, ax = plt.subplots()
        sns.countplot(x="risk_level", data=df, ax=ax, order=["LOW", "MEDIUM", "HIGH"], palette="coolwarm")
        st.pyplot(fig)

    with col2:
        st.subheader("Average Course Performance")
        fig, ax = plt.subplots()
        sns.barplot(x="course", y="score", data=df, ax=ax, palette="crest")
        st.pyplot(fig)

    st.subheader("📋 Full Student Analytics Table")
    st.dataframe(df_view)
    st.subheader("📈 Department/Level Cohorts")
    if "department" in df_view.columns:
        fig, ax = plt.subplots()
        sns.countplot(x="department", hue="risk_level", data=df_view, ax=ax)
        st.pyplot(fig)
    if "level" in df_view.columns:
        fig, ax = plt.subplots()
        sns.countplot(x="level", hue="risk_level", data=df_view, ax=ax)
        st.pyplot(fig)
    csv_main = df_view.to_csv(index=False).encode('utf-8')
    st.download_button("Export table (CSV)", csv_main, "institution_analytics.csv", "text/csv")

# ------------------ FOOTER ------------------
st.markdown("---")
st.caption("© Educational Data Analytics System | Built with Python & Streamlit")
