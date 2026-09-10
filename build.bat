@rem Tycho 4.0.x richiede Maven 3.9+ : usare maven39, non \Shadow-tools\maven (3.6.3)
set java_home=\Shadow-tools\win64\java26
\Shadow-tools\maven39\bin\mvn -Dmaven.test.skip=true clean verify
pause
