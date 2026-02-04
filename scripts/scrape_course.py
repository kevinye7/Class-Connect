from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time
import json
import os
import re
import sqlite3
import hashlib

def parse_days_times(days_times_str):
    """Parse days and times from a string like 'MoWe 10:00AM-11:15AM'"""
    days = None
    start_time = None
    end_time = None
    
    if not days_times_str:
        return days, start_time, end_time
    
    # Try to extract days (common patterns: MoWe, TuTh, etc.)
    days_match = re.search(r'([A-Za-z]{2,})', days_times_str)
    if days_match:
        days = days_match.group(1)
    
    # Try to extract time range (e.g., "10:00AM-11:15AM")
    time_match = re.search(r'(\d{1,2}:\d{2}[AP]M)-(\d{1,2}:\d{2}[AP]M)', days_times_str)
    if time_match:
        start_time = time_match.group(1)
        end_time = time_match.group(2)
    
    return days, start_time, end_time

def parse_course_code(course_code_str):
    """Parse course code to extract catalog number and class number"""
    catalog_number = None
    class_number = None
    
    if not course_code_str:
        return catalog_number, class_number
    
    # Try to extract catalog number (e.g., "135" from "CSCI 135" or "CSCI135")
    catalog_match = re.search(r'(\d+)', course_code_str)
    if catalog_match:
        catalog_number = catalog_match.group(1)
    
    # Class number might be in a separate field or part of the code
    # For now, we'll try to extract it if it's clearly separate
    # This might need adjustment based on actual data format
    
    return catalog_number, class_number

def get_college_id(college_code):
    """Map college code to college ID"""
    college_map = {
        'HTR01': 'hunter',
        'BKL01': 'brooklyn',
        'QNS01': 'queens',
        'NYC01': 'city',
        'LEH01': 'lehman',
        'YOR01': 'york',
        'JJC01': 'johnjay',
        'MEC01': 'medgar',
        'NYT01': 'citytech',
        'BMC01': 'bmcc',
        'BCC01': 'bcc',
        'QCC01': 'qcc',
        'KCC01': 'kingsborough',
        'LAG01': 'laguardia',
        'HOS01': 'hostos',
        'GUT01': 'guttman',
        'LAW01': 'law',
        'SPS01': 'sps',
        'GRD01': 'gradcenter',
        'JOU01': 'soj',
        'BRC01': 'baruch'
    }
    return college_map.get(college_code, college_code.lower().replace('01', '') if college_code else 'unknown')

def generate_course_id(course):
    """Generate a unique course ID"""
    parts = [
        course.get('collegeCode', 'UNKNOWN'),
        course.get('subject', ''),
        course.get('catalogNumber', ''),
        course.get('section', '')
    ]
    parts = [p for p in parts if p]
    base = '-'.join(str(p) for p in parts)
    return hashlib.md5(base.encode()).hexdigest()[:12]

def initialize_database(db_path):
    """Initialize the database schema"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create courses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            instructor TEXT NOT NULL,
            students INTEGER DEFAULT 0,
            collegeId TEXT NOT NULL,
            collegeCode TEXT,
            collegeName TEXT,
            subject TEXT,
            catalogNumber TEXT,
            classNumber TEXT,
            section TEXT,
            title TEXT,
            days TEXT,
            startTime TEXT,
            endTime TEXT,
            location TEXT,
            status TEXT,
            instructionMode TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_courses_collegeId ON courses(collegeId)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_courses_collegeCode ON courses(collegeCode)')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def save_courses_to_database(db_path, courses):
    """Save courses to SQLite database"""
    if not courses:
        print("⚠️ No courses to save to database")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    insert_stmt = '''
        INSERT OR REPLACE INTO courses (
            id, name, code, instructor, students, collegeId,
            collegeCode, collegeName, subject, catalogNumber, classNumber,
            section, title, days, startTime, endTime, location, status, instructionMode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''
    
    saved = 0
    skipped = 0
    
    for course in courses:
        try:
            # Generate course ID
            course_id = generate_course_id(course)
            
            # Get college ID
            college_id = get_college_id(course.get('collegeCode', ''))
            
            # Build course code
            catalog_num = course.get('catalogNumber', '')
            subject = course.get('subject', '')
            course_code = f"{subject} {catalog_num}".strip() if catalog_num else course.get('code', '')
            
            # Build course name/title
            course_name = course.get('title') or course.get('name') or course_code
            
            cursor.execute(insert_stmt, (
                course_id,
                course_name,
                course_code,
                course.get('instructor', 'TBA'),
                0,  # students count
                college_id,
                course.get('collegeCode'),
                course.get('collegeName'),
                course.get('subject'),
                course.get('catalogNumber'),
                course.get('classNumber'),
                course.get('section'),
                course.get('title') or course_name,
                course.get('days'),
                course.get('startTime'),
                course.get('endTime'),
                course.get('location'),
                course.get('status'),
                course.get('instructionMode')
            ))
            saved += 1
        except Exception as e:
            print(f"  ⚠️ Error saving course to database: {e}")
            skipped += 1
            continue
    
    conn.commit()
    conn.close()
    
    print(f"✅ Saved {saved} courses to database")
    if skipped > 0:
        print(f"⚠️ Skipped {skipped} courses due to errors")

def save_courses_to_json(output_file, courses):
    """Save courses to JSON file incrementally"""
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(courses, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"  ⚠️ Error saving to JSON: {e}")
        return False

def scrape_all_cuny_colleges():
    """Extract courses for all CUNY colleges and all subjects, save to single JSON file"""
    # Get the project root directory (parent of scripts folder)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    data_dir = os.path.join(project_root, "data")
    
    # Create data directory if it doesn't exist
    os.makedirs(data_dir, exist_ok=True)
    
    # Output file path
    output_file = os.path.join(data_dir, "cuny_all_courses_raw.json")
    
    # Initialize empty JSON file at start
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump([], f)
    print(f"📝 Initialized JSON file: {output_file}")
    
    # List to store all courses from all colleges and subjects
    all_courses = []
    
    driver = webdriver.Chrome()
    
    try:
        # Navigate to CUNY Global Search
        driver.get("https://globalsearch.cuny.edu/CFGlobalSearchTool/CFSearchToolController")
        time.sleep(3)  # TODO: replace with WebDriverWait
        
        # Get all college checkboxes - try multiple selectors
        college_checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
        
        # Filter to only college checkboxes (they have values like HTR01, BKL01, etc.)
        colleges = []
        for checkbox in college_checkboxes:
            college_code = checkbox.get_attribute("value")
            # College codes are typically 5 characters (e.g., HTR01, BKL01, QNS01)
            if college_code and len(college_code) == 5 and college_code[:3].isalpha() and college_code[3:].isdigit():
                # Try to find the label for this checkbox
                college_name = college_code  # Default fallback
                try:
                    # Method 1: Find label by for attribute
                    label = driver.find_element(By.CSS_SELECTOR, f"label[for='{checkbox.get_attribute('id')}']")
                    college_name = label.text.strip()
                except:
                    try:
                        # Method 2: Find following sibling label
                        college_name = checkbox.find_element(By.XPATH, "./following-sibling::label[1]").text.strip()
                    except:
                        try:
                            # Method 3: Find parent and then label
                            parent = checkbox.find_element(By.XPATH, "./..")
                            label = parent.find_element(By.TAG_NAME, "label")
                            college_name = label.text.strip()
                        except:
                            # Keep default
                            pass
                
                colleges.append((college_code, college_name))
        
        total_colleges = len(colleges)
        print(f"🏫 Found {total_colleges} CUNY colleges to scrape")
        
        # Select term (2025 Fall) - this applies to all colleges
        term_select = Select(driver.find_element(By.NAME, "term_value"))
        term_select.select_by_value("1259")  # 2025 Fall Term
        print("✅ Selected 2025 Fall Term")
        
        # Loop through each college
        for college_index, (college_code, college_name) in enumerate(colleges):
            print(f"\n{'='*60}")
            print(f"Scraping college: {college_name} ({college_code}) - {college_index+1}/{total_colleges}")
            print(f"{'='*60}")
            
            try:
                # Navigate back to the initial page if not already there
                if college_index > 0:
                    driver.get("https://globalsearch.cuny.edu/CFGlobalSearchTool/CFSearchToolController")
                    time.sleep(3)
                    term_select = Select(driver.find_element(By.NAME, "term_value"))
                    term_select.select_by_value("1259")
                
                # Select this college (uncheck all first, then check this one)
                # Uncheck all college checkboxes
                all_checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
                for cb in all_checkboxes:
                    cb_value = cb.get_attribute("value")
                    # Only uncheck college checkboxes (5 char codes like HTR01)
                    if cb_value and len(cb_value) == 5 and cb_value[:3].isalpha() and cb_value[3:].isdigit():
                        if cb.is_selected():
                            driver.execute_script("arguments[0].click();", cb)
                
                # Select the current college
                college_checkbox = driver.find_element(By.CSS_SELECTOR, f"input[value='{college_code}']")
                if not college_checkbox.is_selected():
                    driver.execute_script("arguments[0].click();", college_checkbox)
                print(f"✅ Selected {college_name} ({college_code})")
                
                # Click Next to go to subject selection
                next_btn = driver.find_element(By.NAME, "next_btn")
                next_btn.click()
                time.sleep(3)  # TODO: replace with WebDriverWait
                
                # Select Undergraduate
                try:
                    ug_select = Select(driver.find_element(By.NAME, "courseCareer"))
                    ug_select.select_by_value("UGRD")
                    print("✅ Selected Undergraduate")
                except:
                    print("⚠️ Could not select Undergraduate, continuing...")
                
                # Get all subject options
                try:
                    subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                    subject_options = subject_select.options
                except Exception as e:
                    print(f"❌ Could not find subject dropdown for {college_name}: {e}")
                    continue
                
                # Skip placeholder options (first one is usually empty/placeholder)
                subjects = []
                for option in subject_options[1:]:  # Skip first empty option
                    subject_code = option.get_attribute("value")
                    subject_name = option.text.strip()
                    # Skip if it's a placeholder
                    if subject_code and subject_name and subject_name.lower() not in ["none", "select subject", ""]:
                        subjects.append((subject_code, subject_name))
                
                total_subjects = len(subjects)
                print(f"📚 Found {total_subjects} subjects for {college_name}")
                
                if total_subjects == 0:
                    print(f"⚠️ No subjects found for {college_name}, skipping...")
                    continue
                
                # Scrape each subject
                for subject_index, (subject_code, subject_name) in enumerate(subjects):
                    print(f"\n  Scraping subject {subject_code} ({subject_name}) - {subject_index+1}/{total_subjects}")
                    
                    try:
                        # Select the subject
                        subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                        subject_select.select_by_value(subject_code)
                        
                        # Click Search button
                        search_btn = driver.find_element(By.NAME, "search_btn_search")
                        search_btn.click()
                        time.sleep(4)  # TODO: replace with WebDriverWait - wait for results to load
                        
                        # Click ALL expand buttons to show all sections
                        print("    Expanding all course sections...")
                        expand_buttons = driver.find_elements(By.CSS_SELECTOR, "a[id^='imageDivLink']")
                        
                        for i, btn in enumerate(expand_buttons):
                            try:
                                driver.execute_script("arguments[0].click();", btn)
                                if (i + 1) % 20 == 0 and len(expand_buttons) > 20:
                                    print(f"    Clicked {i + 1}/{len(expand_buttons)} expand buttons...")
                            except:
                                continue
                        time.sleep(2)  # Wait for all sections to expand
                        
                        # Extract data from all visible course tables
                        course_tables = driver.find_elements(By.CSS_SELECTOR, "table.classinfo")
                        print(f"    Found {len(course_tables)} course tables")
                        
                        # Track courses found for this subject
                        courses_for_subject = 0
                        
                        for table in course_tables:
                            try:
                                rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
                                
                                for row in rows:
                                    try:
                                        cells = row.find_elements(By.TAG_NAME, "td")
                                        
                                        # Initialize course dict with all fields
                                        course_code = ""
                                        course_name = ""
                                        section = ""
                                        days_times = ""
                                        room = ""
                                        instructor = ""
                                        instruction_mode = ""
                                        status = ""
                                        
                                        # Extract data from each cell based on data-label
                                        for cell in cells:
                                            data_label = cell.get_attribute("data-label")
                                            cell_text = cell.text.strip()
                                            
                                            if data_label == "Class" and cell_text:
                                                course_code = cell_text
                                            elif data_label == "Course Topic" and cell_text:
                                                course_name = cell_text
                                            elif data_label == "Section" and cell_text:
                                                section = cell_text
                                            elif data_label == "DaysAndTimes" and cell_text:
                                                days_times = cell_text
                                            elif data_label == "Room" and cell_text:
                                                room = cell_text
                                            elif data_label == "Instructor" and cell_text:
                                                instructor = cell_text
                                            elif data_label == "Instruction Mode" and cell_text:
                                                instruction_mode = cell_text
                                            elif data_label == "Status" and cell_text:
                                                status = cell_text
                                        
                                        # Only process if we have course code and name
                                        if course_code and course_name:
                                            # Parse days and times
                                            days, start_time, end_time = parse_days_times(days_times)
                                            
                                            # Parse catalog number from course code
                                            catalog_number, class_number = parse_course_code(course_code)
                                            
                                            # Create course dict with desired structure
                                            course = {
                                                "collegeCode": college_code,
                                                "collegeName": college_name,
                                                "subject": subject_code,
                                                "catalogNumber": catalog_number,
                                                "classNumber": class_number,  # May be None if not available
                                                "section": section if section else None,
                                                "title": course_name,
                                                "days": days,
                                                "startTime": start_time,
                                                "endTime": end_time,
                                                "instructor": instructor if instructor else "TBA",
                                                "location": room if room else None,
                                                "status": status if status else None,
                                                "instructionMode": instruction_mode if instruction_mode else None
                                            }
                                            
                                            # Add to all_courses list
                                            all_courses.append(course)
                                            courses_for_subject += 1
                                            
                                    except Exception as e:
                                        # Skip bad rows, continue with next row
                                        continue
                                        
                            except Exception as e:
                                print(f"    Error parsing table: {e}")
                                continue
                        
                        print(f"    ✅ Found {courses_for_subject} courses for {subject_name}")
                        
                        # Go back to search page for next subject
                        # Try multiple methods to go back
                        try:
                            # Method 1: Look for "New Search" button
                            new_search_btn = driver.find_elements(By.NAME, "new_search_btn")
                            if new_search_btn and new_search_btn[0].is_displayed():
                                new_search_btn[0].click()
                                time.sleep(2)
                            else:
                                # Method 2: Look for "Change Search" or similar
                                change_search = driver.find_elements(By.PARTIAL_LINK_TEXT, "Change Search")
                                if change_search:
                                    change_search[0].click()
                                    time.sleep(2)
                                else:
                                    # Method 3: Use browser back
                                    driver.back()
                                    time.sleep(2)
                        except:
                            # Fallback: use browser back
                            try:
                                driver.back()
                                time.sleep(2)
                            except:
                                pass
                        
                        # Refresh the subject select element after going back
                        try:
                            subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                        except:
                            # If we can't find it, we might need to navigate back to college selection
                            print(f"    ⚠️ Could not find subject dropdown, may need to restart for next subject")
                            break
                        
                    except Exception as e:
                        print(f"    ❌ Error scraping {subject_name}: {e}")
                        # Try to go back and continue with next subject
                        try:
                            driver.back()
                            time.sleep(2)
                            subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                        except:
                            # If navigation fails, break out of subject loop and move to next college
                            print(f"    ⚠️ Navigation failed, moving to next college")
                            break
                        continue
                
            except Exception as e:
                print(f"❌ Error processing college {college_name}: {e}")
                import traceback
                traceback.print_exc()
                continue
            
            # Save incrementally after each college (so you can see progress)
            if all_courses:
                save_courses_to_json(output_file, all_courses)
                print(f"  💾 Progress saved: {len(all_courses)} total courses so far")
        
        # Final save to JSON file and database
        print(f"\n{'='*60}")
        print("🎊 ALL COLLEGES AND SUBJECTS COMPLETED!")
        print(f"{'='*60}")
        
        # Final save to JSON file (in case of any updates)
        save_courses_to_json(output_file, all_courses)
        print(f"✅ Saved {len(all_courses)} classes to JSON: {output_file}")
        
        # Save to database
        db_path = os.path.join(data_dir, "classconnect.db")
        initialize_database(db_path)
        save_courses_to_database(db_path, all_courses)
        
        # Get total count from database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        total_count = cursor.execute('SELECT COUNT(*) FROM courses').fetchone()[0]
        conn.close()
        
        print(f"\n📊 Total courses in database: {total_count}")
        print(f"✅ Scraping complete. Saved {len(all_courses)} classes from {total_colleges} colleges")
                
    except Exception as e:
        print(f"❌ Main Error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_all_cuny_colleges()