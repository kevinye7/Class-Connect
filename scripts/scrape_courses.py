from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time
import json

def scrape_all_hunter_subjects():
    """Extract Hunter College courses for all subjects and create separate JSON files"""
    driver = webdriver.Chrome()
    
    try:
        # Navigate to results
        driver.get("https://globalsearch.cuny.edu/CFGlobalSearchTool/CFSearchToolController")
        time.sleep(2)
        
        # Select Hunter College
        hunter_checkbox = driver.find_element(By.CSS_SELECTOR, "input[value='HTR01']")
        driver.execute_script("arguments[0].click();", hunter_checkbox)
        print("✅ Selected Hunter College")
        
        term_select = Select(driver.find_element(By.NAME, "term_value"))
        term_select.select_by_value("1259")  # 2025 Fall Term
        print("✅ Selected 2025 Fall Term")
        
        next_btn = driver.find_element(By.NAME, "next_btn")
        next_btn.click()
        time.sleep(2)
        
        ug_select = Select(driver.find_element(By.NAME, "courseCareer"))
        ug_select.select_by_value("UGRD")
        print("✅ Selected Undergraduate")
        
        # Get all subject options
        subject_select = Select(driver.find_element(By.NAME, "subject_name"))
        subject_options = subject_select.options
        
        # Skip the first empty option
        subjects = []
        for option in subject_options[1:]:  # Skip first empty option
            subject_code = option.get_attribute("value")
            subject_name = option.text
            subjects.append((subject_code, subject_name))
        
        print(f"📚 Found {len(subjects)} subjects to scrape")
        
        # Scrape each subject
        for subject_code, subject_name in subjects:
            print(f"\n{'='*50}")
            print(f"Scraping: {subject_name} ({subject_code})")
            print(f"{'='*50}")
            
            try:
                # Select the subject
                subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                subject_select.select_by_value(subject_code)
                
                search_btn = driver.find_element(By.NAME, "search_btn_search")
                search_btn.click()
                print("✅ Clicked Search")
                time.sleep(5)
                
                # Click ALL expand buttons
                print("Expanding all course sections...")
                expand_buttons = driver.find_elements(By.CSS_SELECTOR, "a[id^='imageDivLink']")
                print(f"Found {len(expand_buttons)} expand buttons")
                
                for i, btn in enumerate(expand_buttons):
                    try:
                        driver.execute_script("arguments[0].click();", btn)
                        if (i + 1) % 20 == 0 and len(expand_buttons) > 20:
                            print(f"Clicked {i + 1}/{len(expand_buttons)} expand buttons...")
                    except:
                        continue
                time.sleep(3)
                
                # Extract data from all visible tables
                courses = []
                course_tables = driver.find_elements(By.CSS_SELECTOR, "table.classinfo")
                print(f"Found {len(course_tables)} course tables")
                
                for table in course_tables:
                    try:
                        rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
                        
                        for row in rows:
                            cells = row.find_elements(By.TAG_NAME, "td")
                            
                            course_data = {
                                "course_code": "",
                                "course_name": "",
                                "section": "",
                                "days_times": "",
                                "room": "",
                                "instructor": "",
                                "instruction_mode": "",
                                "meeting_dates": "",
                                "status": "",
                                "college": "Hunter College",
                                "subject_code": subject_code,
                                "subject_name": subject_name
                            }
                            
                            # Extract data from each cell based on data-label
                            for cell in cells:
                                data_label = cell.get_attribute("data-label")
                                cell_text = cell.text.strip()
                                
                                if data_label == "Class" and cell_text:
                                    course_data["course_code"] = cell_text
                                elif data_label == "Course Topic" and cell_text:
                                    course_data["course_name"] = cell_text
                                elif data_label == "Section" and cell_text:
                                    course_data["section"] = cell_text
                                elif data_label == "DaysAndTimes" and cell_text:
                                    course_data["days_times"] = cell_text
                                elif data_label == "Room" and cell_text:
                                    course_data["room"] = cell_text
                                elif data_label == "Instructor" and cell_text:
                                    course_data["instructor"] = cell_text
                                elif data_label == "Instruction Mode" and cell_text:
                                    course_data["instruction_mode"] = cell_text
                                elif data_label == "Meeting Dates" and cell_text:
                                    course_data["meeting_dates"] = cell_text
                                elif data_label == "Status" and cell_text:
                                    course_data["status"] = cell_text
                            
                            # Only add if we have course code and name
                            if course_data["course_code"] and course_data["course_name"]:
                                # Avoid duplicates based on course code + section
                                duplicate = any(
                                    c["course_code"] == course_data["course_code"] and 
                                    c["section"] == course_data["section"]
                                    for c in courses
                                )
                                
                                if not duplicate:
                                    courses.append(course_data)
                                    
                    except Exception as e:
                        print(f"Error parsing table: {e}")
                        continue
                
                print(f"🎉 Found {len(courses)} courses for {subject_name}")
                
                # Save results for this subject
                if courses:
                    # Create safe filename
                    safe_subject_name = "".join(c for c in subject_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
                    filename = f"hunter_{subject_code}_{safe_subject_name}_courses.json".replace(' ', '_')
                    
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(courses, f, indent=2, ensure_ascii=False)
                    print(f"💾 Saved to {filename}")
                    
                    # Show sample
                    print(f"Sample courses for {subject_name}:")
                    for course in courses[:3]:
                        print(f"  {course['course_code']} - {course['course_name']}")
                
                else:
                    print(f"❌ No courses found for {subject_name}")
                
                # Go back to search page for next subject
                driver.back()
                time.sleep(2)
                
                # Refresh the subject select element
                subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                
            except Exception as e:
                print(f"❌ Error scraping {subject_name}: {e}")
                # Try to go back and continue with next subject
                try:
                    driver.back()
                    time.sleep(2)
                    subject_select = Select(driver.find_element(By.NAME, "subject_name"))
                except:
                    pass
                continue
        
        print(f"\n{'='*50}")
        print("🎊 ALL SUBJECTS COMPLETED!")
        print(f"{'='*50}")
                
    except Exception as e:
        print(f"❌ Main Error: {e}")
        
    finally:
        driver.quit()

# Run the script for all Hunter College subjects
scrape_all_hunter_subjects()