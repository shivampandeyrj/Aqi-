# Use a lightweight JDK 17 image
FROM eclipse-temurin:17-jdk-alpine

# Set the working directory
WORKDIR /app

# Copy the pom.xml and source code
COPY . .

# Build the application
RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/aqi-cigarette-calculator-1.0.0.jar"]
