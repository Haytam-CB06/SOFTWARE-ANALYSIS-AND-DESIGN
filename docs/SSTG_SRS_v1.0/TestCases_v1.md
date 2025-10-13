Does the code follow naming conventions?
Are commits properly labeled with Jira IDs?
Do endpoints match the API documentation?
Are diagrams up-to-date with implementation?



ID	      Test Name	                    Input	              Expected Output	        Actual Output	          Pass/Fail
TC-01	    Register new user  	          valid JSON body	    201 Created	            201 Created	            ✅
TC-02	    Login with invalid password	  wrong password	    401 Unauthorized	      401	                    ✅
TC-03	    Create event	                missing date	      400 Bad Request	        400	                    ✅
