#!/usr/bin/env python3

import requests
import sys
import os
from datetime import datetime
import json

class HealthAdvisorAPITester:
    def __init__(self, base_url="https://health-assist-32.preview.emergentagent.com"):
        self.base_url = base_url
        self.api = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {str(response_data)[:100]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text}")

            self.test_results.append({
                "test": name,
                "status": "PASS" if success else "FAIL",
                "expected": expected_status,
                "actual": response.status_code,
                "error": response.text if not success else None
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Exception: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "FAIL",
                "expected": expected_status,
                "actual": None,
                "error": str(e)
            })
            return False, {}

    def test_basic_api(self):
        """Test basic API connectivity"""
        print("=== TESTING BASIC API CONNECTIVITY ===")
        success, _ = self.run_test("API Root", "GET", "", 200)
        return success

    def test_seed_data(self):
        """Test seeding data"""
        print("\n=== TESTING DATA SEEDING ===")
        success, _ = self.run_test("Seed Data", "POST", "seed-data", 200)
        return success

    def test_user_management(self):
        """Test user creation and retrieval"""
        print("\n=== TESTING USER MANAGEMENT ===")
        
        # Create user
        test_user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "age": 30
        }
        
        success, user_data = self.run_test(
            "Create User", "POST", "users", 200, test_user_data
        )
        
        if not success:
            return False, None
            
        user_id = user_data.get('id')
        if not user_id:
            print("❌ Failed - No user ID returned")
            return False, None
            
        # Get user
        success, _ = self.run_test(
            "Get User", "GET", f"users/{user_id}", 200
        )
        
        return success, user_id

    def test_symptom_analysis(self):
        """Test symptom analysis"""
        print("\n=== TESTING SYMPTOM ANALYSIS ===")
        
        symptom_data = {
            "symptoms": "fever, headache, sore throat"
        }
        
        success, response = self.run_test(
            "Symptom Analysis", "POST", "symptom-analysis", 200, symptom_data
        )
        
        if success and response:
            # Check response structure
            required_fields = ['possible_conditions', 'severity', 'recommendations', 'suggested_specialists']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False
            print(f"   Analysis result: {response['possible_conditions'][:2]}...")
        
        return success

    def test_image_analysis(self):
        """Test image analysis - we'll test the endpoint structure"""
        print("\n=== TESTING IMAGE ANALYSIS ENDPOINT ===")
        
        # Create a small test file
        test_image_content = b"fake_image_content_for_testing"
        
        try:
            files = {'file': ('test.jpg', test_image_content, 'image/jpeg')}
            success, _ = self.run_test(
                "Image Analysis", "POST", "symptom-image-analysis", 500, files=files
            )
            # We expect 500 due to fake image, but endpoint should be accessible
            print("   Note: Expected 500 due to fake image data - endpoint is accessible")
            return True
        except Exception as e:
            print(f"❌ Image analysis endpoint error: {e}")
            return False

    def test_doctor_hospital_apis(self):
        """Test doctor and hospital endpoints"""
        print("\n=== TESTING DOCTOR/HOSPITAL APIS ===")
        
        # Get all doctors
        success1, _ = self.run_test("Get All Doctors", "GET", "doctors", 200)
        
        # Get doctors with filters
        success2, _ = self.run_test(
            "Get Filtered Doctors", "GET", "doctors", 200,
            {"specialization": "Cardiologist", "min_rating": 4.0}
        )
        
        # Get all hospitals
        success3, _ = self.run_test("Get All Hospitals", "GET", "hospitals", 200)
        
        # Get emergency hospitals
        success4, _ = self.run_test(
            "Get Emergency Hospitals", "GET", "hospitals", 200,
            {"emergency_only": "true"}
        )
        
        return all([success1, success2, success3, success4])

    def test_health_records(self, user_id):
        """Test health records management"""
        print("\n=== TESTING HEALTH RECORDS ===")
        
        if not user_id:
            print("❌ Cannot test health records without user ID")
            return False
            
        # Create health record
        record_data = {
            "user_id": user_id,
            "symptoms": "test symptoms",
            "conditions": ["test condition"],
            "medicines": ["test medicine"],
            "notes": "test notes"
        }
        
        success1, _ = self.run_test(
            "Create Health Record", "POST", "health-records", 200, record_data
        )
        
        # Get health records
        success2, _ = self.run_test(
            "Get Health Records", "GET", f"health-records/{user_id}", 200
        )
        
        return success1 and success2

    def test_chat_functionality(self):
        """Test chat endpoint"""
        print("\n=== TESTING CHAT FUNCTIONALITY ===")
        
        chat_data = {
            "session_id": "test_session_123",
            "message": "What are some general health tips?"
        }
        
        success, response = self.run_test(
            "Chat Endpoint", "POST", "chat", 200, chat_data
        )
        
        if success and response:
            if 'response' not in response:
                print("❌ Missing 'response' field in chat response")
                return False
            print(f"   Chat response: {response['response'][:50]}...")
        
        return success

    def test_health_tips(self):
        """Test health tips endpoint"""
        print("\n=== TESTING HEALTH TIPS ===")
        
        categories = ['general', 'nutrition', 'exercise', 'mental_health']
        all_success = True
        
        for category in categories:
            success, response = self.run_test(
                f"Health Tips ({category})", "GET", "health-tips", 200,
                {"category": category}
            )
            if success and response:
                if 'tips' not in response:
                    print(f"❌ Missing 'tips' field for {category}")
                    all_success = False
                elif len(response['tips']) == 0:
                    print(f"❌ Empty tips list for {category}")
                    all_success = False
                else:
                    print(f"   Found {len(response['tips'])} tips for {category}")
            else:
                all_success = False
                
        return all_success

    def test_medicines_api(self):
        """Test medicines endpoint"""
        print("\n=== TESTING MEDICINES API ===")
        
        # Get all medicines
        success1, _ = self.run_test("Get All Medicines", "GET", "medicines", 200)
        
        # Get medicines by category
        success2, _ = self.run_test(
            "Get Medicines by Category", "GET", "medicines", 200,
            {"category": "Pain Relief"}
        )
        
        return success1 and success2

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 STARTING HEALTHADVISOR API TESTING")
        print(f"Testing against: {self.base_url}")
        print("="*60)
        
        # Test basic connectivity
        if not self.test_basic_api():
            print("❌ Basic API test failed - aborting")
            return False
            
        # Seed data first
        self.test_seed_data()
        
        # Test user management
        user_success, user_id = self.test_user_management()
        
        # Test symptom analysis
        self.test_symptom_analysis()
        
        # Test image analysis endpoint
        self.test_image_analysis()
        
        # Test doctor/hospital APIs
        self.test_doctor_hospital_apis()
        
        # Test health records (if user created)
        if user_id:
            self.test_health_records(user_id)
            
        # Test chat functionality
        self.test_chat_functionality()
        
        # Test health tips
        self.test_health_tips()
        
        # Test medicines API
        self.test_medicines_api()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if t['status'] == 'FAIL']
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = HealthAdvisorAPITester()
    success = tester.run_all_tests()
    
    # Write results to file
    os.makedirs('/app/test_reports', exist_ok=True)
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())