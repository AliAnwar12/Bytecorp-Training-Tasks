import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import transaction
from accounts.models import User
from companies.models import Company, CompanyMember
from skills.models import Skill, UserSkill, JobSkill
from jobs.models import Job
from job_applications.models import JobApplication


def seed_database():
    print("Starting database seeding with local Pakistani tech ecosystem data...")

    with transaction.atomic():
        # 1. Create or get Admin
        admin_user, created = User.objects.get_or_create(
            email="admin@bytecorp.pk",
            defaults={
                "name": "Ali Anwar (Platform Admin)",
                "role": User.Roles.ADMIN,
                "bio": "ByteCorp Platform Lead & System Administrator.",
                "years_of_experience": 10,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("Admin1234!")
        admin_user.save()
        print(f"[OK] Admin account ready: {admin_user.email} (Password: Admin1234!)")

        # 2. Create Global Platform Skills
        skill_names = [
            "Python",
            "Django",
            "React",
            "TypeScript",
            "Next.js",
            "PostgreSQL",
            "Docker",
            "Kubernetes",
            "AWS",
            "Redis",
            "Node.js",
            "FastAPI",
            "GraphQL",
            "Celery",
            "Flutter",
            "Go",
            "Tailwind CSS",
            "CI/CD",
        ]

        skills_dict = {}
        for name in skill_names:
            skill, _ = Skill.objects.get_or_create(
                name=name,
                deleted_at__isnull=True,
                defaults={"created_by": admin_user},
            )
            skills_dict[name] = skill
        print(f"[OK] {len(skills_dict)} Platform skills indexed.")

        # 3. Create Employers / Company Representatives
        employers_data = [
            {
                "name": "Hamza Tariq",
                "email": "hamza@sadapay.pk",
                "company_name": "SadaPay",
                "location": "Islamabad",
                "website": "https://sadapay.pk",
                "description": "Building modern financial services for Pakistan and the Middle East, making money seamless, mobile, and fee-free.",
                "is_verified": True,
                "bio": "VP of Engineering at SadaPay leading fintech infrastructure.",
                "experience": 9,
            },
            {
                "name": "Sara Ahmed",
                "email": "sara.ahmed@daraz.pk",
                "company_name": "Daraz Pakistan",
                "location": "Karachi",
                "website": "https://www.daraz.pk",
                "description": "The leading e-commerce platform in South Asia connecting millions of consumers with high-speed digital commerce.",
                "is_verified": True,
                "bio": "Engineering Director at Daraz (Alibaba Group).",
                "experience": 11,
            },
            {
                "name": "Bilal Sheikh",
                "email": "bilal.s@systemsltd.com",
                "company_name": "Systems Limited",
                "location": "Lahore",
                "website": "https://www.systemsltd.com",
                "description": "Pakistan's premier global technology innovator delivering enterprise software engineering, cloud, and AI solutions.",
                "is_verified": True,
                "bio": "Principal Architect & Hiring Lead at Systems Limited.",
                "experience": 12,
            },
            {
                "name": "Fatima Malik",
                "email": "fatima.m@10pearls.com",
                "company_name": "10Pearls",
                "location": "Karachi",
                "website": "https://10pearls.com",
                "description": "End-to-end digital transformation company designing, building, and accelerating digital products for global enterprises.",
                "is_verified": True,
                "bio": "Head of People and Technical Recruitment at 10Pearls.",
                "experience": 8,
            },
            {
                "name": "Mustafa Khan",
                "email": "mustafa@bazaartech.com",
                "company_name": "Bazaar Technologies",
                "location": "Karachi",
                "website": "https://bazaartech.com",
                "description": "Building the operating system for traditional retail in Pakistan across B2B supply chain, fintech, and merchant software.",
                "is_verified": True,
                "bio": "Director of Core Services at Bazaar Technologies.",
                "experience": 7,
            },
            {
                "name": "Zainab Raza",
                "email": "zainab@arbisoft.com",
                "company_name": "Arbisoft",
                "location": "Lahore",
                "website": "https://arbisoft.com",
                "description": "Engineering world-class web, mobile, machine learning, and edtech platforms for top global institutions.",
                "is_verified": True,
                "bio": "Lead Technical Recruiter at Arbisoft.",
                "experience": 6,
            },
        ]

        employer_users = []
        companies_list = []

        for emp in employers_data:
            user, _ = User.objects.get_or_create(
                email=emp["email"],
                defaults={
                    "name": emp["name"],
                    "role": User.Roles.COMPANY_REPRESENTATIVE,
                    "bio": emp["bio"],
                    "years_of_experience": emp["experience"],
                },
            )
            user.set_password("Password123!")
            user.save()
            employer_users.append(user)

            company, _ = Company.objects.get_or_create(
                name=emp["company_name"],
                deleted_at__isnull=True,
                defaults={
                    "location": emp["location"],
                    "website": emp["website"],
                    "description": emp["description"],
                    "is_verified": emp["is_verified"],
                    "created_by": user,
                },
            )
            companies_list.append(company)

            CompanyMember.objects.get_or_create(
                company=company,
                user=user,
                deleted_at__isnull=True,
                defaults={
                    "role": CompanyMember.MemberRoles.OWNER,
                    "created_by": user,
                },
            )

        print(f"[OK] {len(companies_list)} Local Pakistani tech companies & employers ready.")

        # 4. Create Job Seekers / Candidates
        candidates_data = [
            {
                "name": "Usman Tariq",
                "email": "usman.tariq@gmail.com",
                "bio": "Full Stack Engineer with 5+ years building scalable microservices in Python, Django, React, and PostgreSQL.",
                "experience": 5,
                "skills": ["Python", "Django", "React", "PostgreSQL", "Docker", "Redis"],
            },
            {
                "name": "Ayesha Siddiqui",
                "email": "ayesha.siddiqui@gmail.com",
                "bio": "Senior Frontend Developer specialized in React, TypeScript, Next.js, accessible design systems, and high performance web apps.",
                "experience": 4,
                "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
            },
            {
                "name": "Omer Farooq",
                "email": "omer.farooq@yahoo.com",
                "bio": "DevOps & Cloud Infrastructure Specialist with deep hands-on expertise in Kubernetes, AWS, Terraform, and CI/CD pipelines.",
                "experience": 6,
                "skills": ["AWS", "Docker", "Kubernetes", "CI/CD", "Python", "Go"],
            },
            {
                "name": "Hira Shah",
                "email": "hira.shah@hotmail.com",
                "bio": "Backend Engineer passionate about distributed systems, event-driven architectures with Celery/Redis, and FastAPI.",
                "experience": 3,
                "skills": ["Python", "FastAPI", "Django", "PostgreSQL", "Celery"],
            },
            {
                "name": "Danyal Hassan",
                "email": "danyal.hassan@gmail.com",
                "bio": "Mobile & Cross-platform specialist crafting beautiful Flutter applications with clean state management.",
                "experience": 3,
                "skills": ["Flutter", "TypeScript", "Node.js", "PostgreSQL"],
            },
        ]

        candidate_users = []
        for cand in candidates_data:
            c_user, _ = User.objects.get_or_create(
                email=cand["email"],
                defaults={
                    "name": cand["name"],
                    "role": User.Roles.JOB_SEEKER,
                    "bio": cand["bio"],
                    "years_of_experience": cand["experience"],
                },
            )
            c_user.set_password("Password123!")
            c_user.save()
            candidate_users.append(c_user)

            for s_name in cand["skills"]:
                if s_name in skills_dict:
                    UserSkill.objects.get_or_create(
                        user=c_user,
                        skill=skills_dict[s_name],
                        deleted_at__isnull=True,
                        defaults={"created_by": c_user},
                    )

        print(f"[OK] {len(candidate_users)} Candidates created with attached skill portfolios.")

        # 5. Create Realistic Job Openings
        jobs_seed_data = [
            {
                "company": companies_list[0],  # SadaPay
                "created_by": employer_users[0],
                "title": "Senior Backend Engineer (Fintech Core)",
                "description": "We are seeking a talented Senior Backend Engineer to design and scale our payment processing engine and core banking APIs. You will work on real-time transaction pipelines, ledger integrity, high-throughput microservices, and integrations with 1Link and Raast.",
                "location": "Islamabad",
                "salary_min": 250000,
                "salary_max": 400000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "AWS"],
            },
            {
                "company": companies_list[0],  # SadaPay
                "created_by": employer_users[0],
                "title": "Staff Platform & DevOps Engineer",
                "description": "Lead the infrastructure architecture for our high-availability banking systems. You will own automated Kubernetes clusters, multi-region failover, cloud security posture, and zero-downtime deployment pipelines.",
                "location": "Islamabad",
                "salary_min": 350000,
                "salary_max": 550000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Kubernetes", "AWS", "Docker", "CI/CD", "Go"],
            },
            {
                "company": companies_list[1],  # Daraz
                "created_by": employer_users[1],
                "title": "Lead Frontend Architect (E-Commerce)",
                "description": "Join Daraz to revolutionize the consumer shopping experience for over 40 million monthly active users. You will architect high-performance frontend micro-apps, maintain our design system, and optimize Core Web Vitals.",
                "location": "Karachi",
                "salary_min": 280000,
                "salary_max": 420000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
            },
            {
                "company": companies_list[1],  # Daraz
                "created_by": employer_users[1],
                "title": "Data & Backend Engineer (Search & Recommendations)",
                "description": "Build high-speed search and recommendation ranking pipelines serving millions of queries per minute during Mega Campaign events like 11.11.",
                "location": "Karachi",
                "salary_min": 200000,
                "salary_max": 320000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Python", "Django", "PostgreSQL", "Redis"],
            },
            {
                "company": companies_list[2],  # Systems Limited
                "created_by": employer_users[2],
                "title": "Principal Full Stack Cloud Architect",
                "description": "Architect enterprise cloud-native solutions for Fortune 500 global clients across North America and Europe. Spearhead technology evaluations, technical roadmaps, and mentoring engineering teams.",
                "location": "Lahore",
                "salary_min": 350000,
                "salary_max": 500000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Python", "Django", "React", "TypeScript", "AWS", "Docker"],
            },
            {
                "company": companies_list[2],  # Systems Limited
                "created_by": employer_users[2],
                "title": "Full Stack Engineer (Contract)",
                "description": "6-month contract role for building specialized customer portal modules with modern React and robust Django REST APIs.",
                "location": "Lahore",
                "salary_min": 180000,
                "salary_max": 260000,
                "employment_type": "contract",
                "status": "open",
                "skills": ["Python", "Django", "React", "PostgreSQL"],
            },
            {
                "company": companies_list[3],  # 10Pearls
                "created_by": employer_users[3],
                "title": "Senior React Native & Mobile Engineer",
                "description": "Develop mission-critical healthcare and fintech consumer mobile products with cutting-edge UI animations, offline synchronization, and native platform bridges.",
                "location": "Karachi",
                "salary_min": 220000,
                "salary_max": 350000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["React", "TypeScript", "Flutter", "GraphQL"],
            },
            {
                "company": companies_list[4],  # Bazaar
                "created_by": employer_users[4],
                "title": "Senior Backend Engineer (B2B Supply Chain)",
                "description": "Own backend fulfillment and logistics dispatch systems enabling thousands of small retailers across 20+ cities in Pakistan to restock inventory next-day.",
                "location": "Karachi",
                "salary_min": 240000,
                "salary_max": 380000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Python", "Django", "PostgreSQL", "Celery", "Docker"],
            },
            {
                "company": companies_list[5],  # Arbisoft
                "created_by": employer_users[5],
                "title": "Software Engineer (Open edX Platform)",
                "description": "Help shape the future of digital education by developing scalable learning platform extensions and analytics microservices for MIT, Harvard, and worldwide universities.",
                "location": "Lahore",
                "salary_min": 180000,
                "salary_max": 280000,
                "employment_type": "full-time",
                "status": "open",
                "skills": ["Python", "Django", "React", "Docker"],
            },
            {
                "company": companies_list[5],  # Arbisoft
                "created_by": employer_users[5],
                "title": "Junior Python / Django Developer (Draft)",
                "description": "Upcoming rotational program for high-potential software engineers with strong algorithmic problem solving skills and passion for backend development.",
                "location": "Lahore",
                "salary_min": 120000,
                "salary_max": 180000,
                "employment_type": "full-time",
                "status": "draft",
                "skills": ["Python", "Django", "PostgreSQL"],
            },
        ]

        created_jobs = []
        for jd in jobs_seed_data:
            job, _ = Job.objects.get_or_create(
                company=jd["company"],
                title=jd["title"],
                deleted_at__isnull=True,
                defaults={
                    "description": jd["description"],
                    "location": jd["location"],
                    "salary_min": jd["salary_min"],
                    "salary_max": jd["salary_max"],
                    "employment_type": jd["employment_type"],
                    "status": jd["status"],
                    "created_by": jd["created_by"],
                },
            )
            created_jobs.append(job)

            for s_name in jd["skills"]:
                if s_name in skills_dict:
                    JobSkill.objects.get_or_create(
                        job=job,
                        skill=skills_dict[s_name],
                        deleted_at__isnull=True,
                        defaults={"created_by": jd["created_by"]},
                    )

        print(f"[OK] {len(created_jobs)} Local job listings created with linked skills.")

        # 6. Create Realistic Candidate Job Applications
        applications_seed_data = [
            {
                "user": candidate_users[0],  # Usman Tariq
                "job": created_jobs[0],       # SadaPay Backend
                "cover_letter": "I have 5 years of production Python/Django experience and have previously built fintech payment routing pipelines. I would love to contribute to SadaPay's ledger integrity and core APIs.",
                "status": JobApplication.Statuses.SHORTLISTED,
            },
            {
                "user": candidate_users[0],  # Usman Tariq
                "job": created_jobs[7],       # Bazaar Backend
                "cover_letter": "My background in distributed queuing with Celery and Postgres query optimization fits Bazaar's high-volume B2B supply chain mission.",
                "status": JobApplication.Statuses.REVIEWED,
            },
            {
                "user": candidate_users[1],  # Ayesha Siddiqui
                "job": created_jobs[2],       # Daraz Frontend
                "cover_letter": "As a frontend specialist with 4 years in React and TypeScript design systems, I have delivered fast, accessible e-commerce user experiences with high Core Web Vitals.",
                "status": JobApplication.Statuses.SHORTLISTED,
            },
            {
                "user": candidate_users[2],  # Omer Farooq
                "job": created_jobs[1],       # SadaPay DevOps
                "cover_letter": "I have designed multi-tenant AWS EKS clusters and Terraform automation for banking security standards. Excited about the opportunity to lead SadaPay's platform reliability.",
                "status": JobApplication.Statuses.PENDING,
            },
            {
                "user": candidate_users[3],  # Hira Shah
                "job": created_jobs[8],       # Arbisoft edX
                "cover_letter": "I have worked extensively with Python and open source edtech systems. Eager to contribute to the scalable learning platforms at Arbisoft.",
                "status": JobApplication.Statuses.PENDING,
            },
            {
                "user": candidate_users[4],  # Danyal Hassan
                "job": created_jobs[6],       # 10Pearls Mobile
                "cover_letter": "I build responsive, pixel-perfect cross platform apps and have published multiple production apps on both iOS App Store and Google Play.",
                "status": JobApplication.Statuses.REVIEWED,
            },
        ]

        for app_d in applications_seed_data:
            JobApplication.objects.get_or_create(
                user=app_d["user"],
                job=app_d["job"],
                deleted_at__isnull=True,
                defaults={
                    "cover_letter": app_d["cover_letter"],
                    "status": app_d["status"],
                    "created_by": app_d["user"],
                },
            )

        print(f"[OK] {len(applications_seed_data)} Candidate applications seeded across review stages.")

    print("\n-------------------------------------------------------")
    print("Database successfully seeded with rich local test data!")
    print("-------------------------------------------------------")
    print("Test Logins (Password for all non-admin accounts: Password123!):")
    print("  * Admin:      admin@bytecorp.pk          (Password: Admin1234!)")
    print("  * Employer 1: hamza@sadapay.pk           (SadaPay - Islamabad)")
    print("  * Employer 2: sara.ahmed@daraz.pk        (Daraz - Karachi)")
    print("  * Employer 3: bilal.s@systemsltd.com     (Systems Limited - Lahore)")
    print("  * Employer 4: fatima.m@10pearls.com      (10Pearls - Karachi)")
    print("  * Employer 5: mustafa@bazaartech.com     (Bazaar - Karachi)")
    print("  * Employer 6: zainab@arbisoft.com        (Arbisoft - Lahore)")
    print("  * Candidate 1: usman.tariq@gmail.com     (Full Stack)")
    print("  * Candidate 2: ayesha.siddiqui@gmail.com (Frontend)")
    print("  * Candidate 3: omer.farooq@yahoo.com     (DevOps)")
    print("  * Candidate 4: hira.shah@hotmail.com     (Backend)")
    print("  * Candidate 5: danyal.hassan@gmail.com   (Mobile / Flutter)")
    print("-------------------------------------------------------\n")


if __name__ == "__main__":
    seed_database()
