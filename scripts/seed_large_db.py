"""Seed script to populate MongoDB with a rich set of 20 realistic projects per Tamil Nadu district,
along with sample timeline milestones, citizen complaints, and global activity logs.

Usage:
  python scripts/seed_large_db.py
"""
import os
import random
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from bson import ObjectId

TAMIL_NADU_DISTRICTS = [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
    'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
    'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
    'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
    'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
    'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
    'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
    'Vellore', 'Viluppuram', 'Virudhunagar'
]

DEPARTMENTS = [
    {'name': 'Water Resources', 'image': 'water'},
    {'name': 'Highways & Roads', 'image': 'road'},
    {'name': 'Public Health', 'image': 'health'},
    {'name': 'School Education', 'image': 'school'},
    {'name': 'Municipal Administration', 'image': 'municipal'},
    {'name': 'Energy & Power', 'image': 'power'},
    {'name': 'Agriculture', 'image': 'agriculture'},
    {'name': 'Social Welfare', 'image': 'welfare'}
]

PROJECT_TEMPLATES = [
    # Water Resources
    {'name': 'Water Supply Pipeline Extension', 'dept': 'Water Resources', 'budget_min': 5000000, 'budget_max': 50000000},
    {'name': 'Overhead Drinking Water Tank', 'dept': 'Water Resources', 'budget_min': 2000000, 'budget_max': 15000000},
    {'name': 'Lake Restoration & Bund Re-alignment', 'dept': 'Water Resources', 'budget_min': 10000000, 'budget_max': 80000000},
    {'name': 'Desalination Infrastructure Node', 'dept': 'Water Resources', 'budget_min': 50000000, 'budget_max': 300000000},
    
    # Highways & Roads
    {'name': 'District Bypass Road Construction', 'dept': 'Highways & Roads', 'budget_min': 40000000, 'budget_max': 250000000},
    {'name': 'Rural Link Roads Asphalt Paving', 'dept': 'Highways & Roads', 'budget_min': 8000000, 'budget_max': 35000000},
    {'name': 'Traffic Junction Pedestrian Foot Overbridge', 'dept': 'Highways & Roads', 'budget_min': 15000000, 'budget_max': 60000000},
    {'name': 'River Bridge Reconstruction', 'dept': 'Highways & Roads', 'budget_min': 30000000, 'budget_max': 120000000},
    
    # Public Health
    {'name': 'Primary Health Centre Renovation', 'dept': 'Public Health', 'budget_min': 3000000, 'budget_max': 12000000},
    {'name': 'Government Hospital New ICU Block', 'dept': 'Public Health', 'budget_min': 20000000, 'budget_max': 90000000},
    {'name': 'Diagnostic Lab Construction', 'dept': 'Public Health', 'budget_min': 5000000, 'budget_max': 25000000},
    
    # School Education
    {'name': 'Smart Classrooms & Science Lab Setup', 'dept': 'School Education', 'budget_min': 1500000, 'budget_max': 8000000},
    {'name': 'Government High School Building Extension', 'dept': 'School Education', 'budget_min': 8000000, 'budget_max': 40000000},
    
    # Municipal Administration
    {'name': 'Stormwater Smart Drainage Network', 'dept': 'Municipal Administration', 'budget_min': 15000000, 'budget_max': 100000000},
    {'name': 'Municipal Public Green Park & Walkway', 'dept': 'Municipal Administration', 'budget_min': 2000000, 'budget_max': 18000000},
    {'name': 'Solid Waste Segregation & Bio-Gas Facility', 'dept': 'Municipal Administration', 'budget_min': 12000000, 'budget_max': 70000000},
    
    # Energy & Power
    {'name': 'Substation Capacity Upgrade', 'dept': 'Energy & Power', 'budget_min': 25000000, 'budget_max': 150000000},
    {'name': 'Solar Street Lights Grid Installation', 'dept': 'Energy & Power', 'budget_min': 4000000, 'budget_max': 20000000},
    
    # Agriculture
    {'name': 'Cold Storage Warehouse for Farmers', 'dept': 'Agriculture', 'budget_min': 15000000, 'budget_max': 60000000},
    {'name': 'Veterinary Care Clinic', 'dept': 'Agriculture', 'budget_min': 1500000, 'budget_max': 6000000},
    
    # Social Welfare
    {'name': 'Anganwadi Child Care Centre Renovation', 'dept': 'Social Welfare', 'budget_min': 1000000, 'budget_max': 5000000},
    {'name': 'Multi-Purpose Community Center', 'dept': 'Social Welfare', 'budget_min': 5000000, 'budget_max': 25000000}
]

CITIZEN_NAMES = ['Aravind', 'Baskar', 'Chitra', 'Divya', 'Elango', 'Farooq', 'Ganesh', 'Hari', 'Induja', 'Jayakumar', 'Karthik', 'Lakshmi', 'Mani', 'Nisha', 'Omprakash', 'Priya', 'Rajesh', 'Sangeetha', 'Thangavel', 'Uma']
COMPLAINT_TYPES = ['Poor Quality', 'Delay in Execution', 'Safety Hazard', 'Corrupt Activity', 'Environmental Impact', 'Water Stagnation']
COMPLAINT_DESCS = {
    'Poor Quality': [
        "The concrete mix used for the columns looks very dilute and shows cracks within a week.",
        "Pipes laid for the water supply are leaking at several joints, causing low pressure.",
        "Road gravel laying is very uneven, and the asphalt layer is already peeling off.",
        "Plastering is peeling off the newly built school classrooms. Standard of materials is questionable."
    ],
    'Delay in Execution': [
        "No construction workers have visited the site for the past three weeks. The project lies abandoned.",
        "The road has been dug up for months, and no pipeline laying has begun. Total failure in scheduling.",
        "Work is proceeding at a snail's pace, causing heavy traffic jams daily during peak hours."
    ],
    'Safety Hazard': [
        "Open trenches have been left uncovered at night without warning lights or barricades. Very dangerous for children.",
        "Scaffolding used at the hospital site is unstable and drops debris on pedestrians passing below.",
        "Exposed rebar sticks out of the foundation without safety caps near the walking path."
    ],
    'Environmental Impact': [
        "Construction waste is being dumped directly into the local lake bed, polluting the water resources.",
        "Huge clouds of dust are generated during mixing without any water spraying, causing breathing problems.",
        "Trees on the road margin are being cut down indiscriminately without permission."
    ]
}

def main():
    import bcrypt

    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.environ.get('MONGO_DB_NAME', 'government_monitoring')

    print(f"Connecting to MongoDB at {mongo_uri}...")
    client = MongoClient(mongo_uri)
    db = client[db_name]

    # Clean existing collections
    print("Clearing existing database collections (projects, timeline, feedback, activities, users, documents, notifications, audit_logs)...")
    db.projects.delete_many({})
    db.timeline.delete_many({})
    db.feedback.delete_many({})
    db.activities.delete_many({})
    db.users.delete_many({})
    db.documents.delete_many({})
    db.notifications.delete_many({})
    db.audit_logs.delete_many({})

    projects_to_insert = []
    timelines_to_insert = []
    feedbacks_to_insert = []
    activities_to_insert = []

    now = datetime.now(timezone.utc)

    # Seed default users
    print("Hashing default passwords and seeding district users...")
    officer_password = os.environ.get('OFFICER_PASSWORD', 'TempPass!23')
    hashed_pwd = bcrypt.hashpw(officer_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    users_to_insert = [
        {
            '_id': ObjectId(),
            'full_name': 'Chief Officer',
            'email': 'officer@example.com',
            'hashed_password': hashed_pwd,
            'role': 'Officer',
            'district': 'Chennai',
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            '_id': ObjectId(),
            'full_name': 'System Admin',
            'email': 'admin@example.com',
            'hashed_password': hashed_pwd,
            'role': 'Admin',
            'district': 'Chennai',
            'is_active': True,
            'created_at': now,
            'updated_at': now
        }
    ]

    for district in TAMIL_NADU_DISTRICTS:
        dist_lower = district.lower().replace(' ', '')
        users_to_insert.append({
            '_id': ObjectId(),
            'full_name': f"{district} Citizen",
            'email': f"citizen.{dist_lower}@example.com",
            'hashed_password': hashed_pwd,
            'role': 'Citizen',
            'district': district,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        })
        users_to_insert.append({
            '_id': ObjectId(),
            'full_name': f"{district} Engineer",
            'email': f"engineer.{dist_lower}@gov.in",
            'hashed_password': hashed_pwd,
            'role': 'Engineer',
            'district': district,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        })

    print(f"Generating 20 projects for each of the {len(TAMIL_NADU_DISTRICTS)} districts...")

    for district in TAMIL_NADU_DISTRICTS:
        # Generate exactly 20 projects per district by drawing from templates
        selected_templates = random.sample(PROJECT_TEMPLATES, 20)
        
        # We assign a local engineer to the district to simulate district boundary ownership
        engineer_email = f"engineer.{district.lower()}@gov.in"
        
        for idx, template in enumerate(selected_templates):
            project_id = ObjectId()
            budget = float(random.randint(template['budget_min'], template['budget_max']))
            
            # Stagger start/end dates
            start_offset = random.randint(-180, 30) # started up to 6 months ago, or planned next month
            duration_days = random.randint(90, 365)
            
            start_date = now + timedelta(days=start_offset)
            end_date = start_date + timedelta(days=duration_days)
            
            # Determine project status & completion
            if start_offset > 0:
                status = 'Planned'
                completion = 0
            else:
                # Started
                if start_date + timedelta(days=duration_days) < now:
                    # Past end date
                    if random.random() < 0.6:
                        status = 'Completed'
                        completion = 100
                    else:
                        status = 'Delayed'
                        completion = random.randint(65, 95)
                else:
                    # Currently in progress
                    elapsed = (now - start_date).days
                    total = duration_days
                    progress_pct = int((elapsed / total) * 100)
                    progress_pct = max(5, min(95, progress_pct))
                    
                    if random.random() < 0.15:
                        status = 'Delayed'
                        completion = max(10, progress_pct - random.randint(15, 30))
                    elif progress_pct > 85 and random.random() < 0.5:
                        status = 'Inspection Scheduled'
                        completion = 90
                    else:
                        status = 'In Progress'
                        completion = progress_pct

            project_doc = {
                '_id': project_id,
                'name': f"{district} {template['name']}",
                'department': template['dept'],
                'budget': budget,
                'start_date': start_date,
                'end_date': end_date,
                'location': district,
                'status': status,
                'completion': completion,
                'created_by': 'officer@example.com',
                'assigned_engineer': engineer_email,
                'created_at': start_date,
                'updated_at': now
            }
            projects_to_insert.append(project_doc)

            # Insert timeline events for this project
            # 1. Project Created milestone
            timelines_to_insert.append({
                'project_id': str(project_id),
                'title': 'Project Created',
                'description': f"Administrative approval and budget of INR {budget:,.0f} sanctioned for {district} works.",
                'created_by': 'officer@example.com',
                'timestamp': start_date,
                'image_url': None
            })

            if status != 'Planned':
                # 2. Construction Started milestone
                timelines_to_insert.append({
                    'project_id': str(project_id),
                    'title': 'Construction Phase Commenced',
                    'description': f"Site cleared and foundation work started under supervision of Engineer {engineer_email}.",
                    'created_by': 'officer@example.com',
                    'timestamp': start_date + timedelta(days=10),
                    'image_url': None
                })
                
                # 3. Intermediate milestones based on completion
                if completion >= 20:
                    timelines_to_insert.append({
                        'project_id': str(project_id),
                        'title': '20% Completion Milestone',
                        'description': f"Structural framework and primary excavations completed. Quality checks passed.",
                        'created_by': engineer_email,
                        'timestamp': start_date + timedelta(days=int(duration_days * 0.2)),
                        'image_url': None
                    })
                if completion >= 50:
                    timelines_to_insert.append({
                        'project_id': str(project_id),
                        'title': '50% Completion Milestone',
                        'description': f"Main structures laid and utility pipes/lines routed. Mid-term audit completed.",
                        'created_by': engineer_email,
                        'timestamp': start_date + timedelta(days=int(duration_days * 0.5)),
                        'image_url': None
                    })
                if status == 'Completed':
                    timelines_to_insert.append({
                        'project_id': str(project_id),
                        'title': 'Project Completed',
                        'description': f"All construction, painting, and utility validations finished. Project handed over for public usage.",
                        'created_by': engineer_email,
                        'timestamp': end_date,
                        'image_url': None
                    })
                elif status == 'Delayed':
                    timelines_to_insert.append({
                        'project_id': str(project_id),
                        'title': 'Project Delayed Alert',
                        'description': f"Work delayed due to material supply disruptions or rain seasons. Revised timeline estimation initiated.",
                        'created_by': engineer_email,
                        'timestamp': now - timedelta(days=2),
                        'image_url': None
                    })
                elif status == 'Inspection Scheduled':
                    timelines_to_insert.append({
                        'project_id': str(project_id),
                        'title': 'Quality Inspection Scheduled',
                        'description': f"Construction completed. Official inspections and structural strength checks planned.",
                        'created_by': engineer_email,
                        'timestamp': now - timedelta(days=1),
                        'image_url': None
                    })

            # Create citizen feedback/complaints for some of the active/delayed projects
            if status in ['In Progress', 'Delayed'] and idx % 4 == 0:
                citizen_name = random.choice(CITIZEN_NAMES)
                issue = random.choice(list(COMPLAINT_DESCS.keys()))
                description = random.choice(COMPLAINT_DESCS[issue])
                severity = random.choice(['Low', 'Medium', 'High'])
                
                feedback_id = ObjectId()
                feedback_doc = {
                    '_id': feedback_id,
                    'project_id': str(project_id),
                    'citizen_name': citizen_name,
                    'citizen_id': f"citizen_{citizen_name.lower()}@example.com",
                    'issue_type': issue,
                    'description': description,
                    'image_url': '',
                    'location': district,
                    'severity': severity,
                    'status': 'OPEN',
                    'assigned_inspector': None,
                    'created_at': now - timedelta(days=random.randint(1, 15)),
                    'updated_at': now
                }
                feedbacks_to_insert.append(feedback_doc)

                # Log feedback submission to global activity feed
                sev_emoji = "🔴" if severity == "High" else "🟡" if severity == "Medium" else "🟢"
                msg = f"🟡 Citizen {citizen_name} submitted complaint: \"{issue}\" in {district} ({sev_emoji} {severity} Severity)"
                activities_to_insert.append({
                    'type': 'COMPLAINT_SUBMIT',
                    'message': msg,
                    'project_id': str(project_id),
                    'project_name': f"{district} {template['name']}",
                    'timestamp': now - timedelta(days=random.randint(1, 15))
                })

            # Log project creation to global activity feed
            if idx % 10 == 0:
                activities_to_insert.append({
                    'type': 'PROJECT_CREATE',
                    'message': f"🔵 Officer created project: {district} {template['name']}",
                    'project_id': str(project_id),
                    'project_name': f"{district} {template['name']}",
                    'timestamp': start_date
                })

    # Bulk insert for efficiency
    print(f"Bulk inserting {len(projects_to_insert)} projects...")
    db.projects.insert_many(projects_to_insert)

    print(f"Bulk inserting {len(timelines_to_insert)} timeline milestones...")
    db.timeline.insert_many(timelines_to_insert)

    if feedbacks_to_insert:
        print(f"Bulk inserting {len(feedbacks_to_insert)} complaints...")
        db.feedback.insert_many(feedbacks_to_insert)

    if activities_to_insert:
        print(f"Bulk inserting {len(activities_to_insert)} activities...")
        db.activities.insert_many(activities_to_insert)

    print(f"Bulk inserting {len(users_to_insert)} seeded users...")
    db.users.insert_many(users_to_insert)

    print("\n=============================================")
    print("Database seeding completed successfully!")
    print(f"Total Projects: {len(projects_to_insert)}")
    print(f"Total Milestones: {len(timelines_to_insert)}")
    print(f"Total Complaints: {len(feedbacks_to_insert)}")
    print(f"Total Activity Logs: {len(activities_to_insert)}")
    print(f"Total Users: {len(users_to_insert)}")
    print("=============================================")

if __name__ == '__main__':
    main()
