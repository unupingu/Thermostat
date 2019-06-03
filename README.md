# Folder overview
  - controllermd contains the main code
  - tester contains the tester code
  - extra contains the executable and the auto-generated documentation of the main code (start opening the index.html file)

# How to test
You need to execute first the controllermd and then the tester.
The tester at every execution will delete the old esp and create 3 new one (sensor, cooler, heater) + one standard espDataProducer that will produce data every 10 seconds

Open a cmd and run "java -jar controllermd-0.0.1-SNAPSHOT.jar"  
The open an other cmd and run "java -jar "tester-0.0.1-SNAPSHOT.jar"

# How to set up github
https://www.youtube.com/watch?v=J_Clau1bYco
First found, if you have problem cloning this repository check youtube or ask me

# HTTP endpoint description
https://docs.google.com/document/d/1TF6zZ8DTbSKHRjFNf6_r4kNfpuSn5rqgrSfVmJvNIGA/edit#heading=h.38xql5hyg87g

# EXTRA
Simple tool to test the http endpoint -> https://www.getpostman.com/downloads/
To open a cmdline very fast go the folder and shift+right click and then choose Open PowerShell here  
Keep the jar in different folder  
If windows asks, allow access in private network  
