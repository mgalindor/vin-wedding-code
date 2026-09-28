# syntax=docker/dockerfile:1.7

# =====================================================================================
# Stage 1: build the Spring Boot jar
# Resolves Maven dependencies in their own layer, then compiles and packages the app
# (plain JVM package - no GraalVM/native-image, to keep cloud build times/cost low).
# =====================================================================================
FROM eclipse-temurin:25-jdk-jammy AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/main/ src/main/
RUN ./mvnw -B -q package -DskipTests

# =====================================================================================
# Stage 2: extract the repackaged jar into layers
# Splits third-party deps, the Spring Boot loader and app code into separate layers so
# unchanged dependencies stay cached across image rebuilds.
# =====================================================================================
FROM build AS extract
WORKDIR /workspace
RUN cp target/*.jar application.jar \
  && java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# =====================================================================================
# Stage 3: production runtime
# Distroless (no shell, no package manager, no curl) - smallest attack surface. Runs as
# the built-in "nonroot" user. There is no HEALTHCHECK here since there's no shell/curl
# to run one; configure Render's HTTP health check against /actuator/health instead.
# =====================================================================================
FROM gcr.io/distroless/java25-debian13:nonroot AS runtime

WORKDIR /application
COPY --from=extract --chown=nonroot:nonroot /workspace/extracted/dependencies/ ./
COPY --from=extract --chown=nonroot:nonroot /workspace/extracted/spring-boot-loader/ ./
COPY --from=extract --chown=nonroot:nonroot /workspace/extracted/snapshot-dependencies/ ./
COPY --from=extract --chown=nonroot:nonroot /workspace/extracted/application/ ./

EXPOSE 8080

# Render (and most PaaS) honor JAVA_TOOL_OPTIONS automatically, e.g. to cap heap size
# -XX:+UseCompactObjectHeaders (JEP 519, product feature since Java 25): ~20% less heap, fewer GCs
ENTRYPOINT ["java", "-XX:+UseCompactObjectHeaders", "-jar", "application.jar"]
