FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

ARG LAVALINK_VERSION=4.0.8
RUN wget -q "https://github.com/lavalink-devs/Lavalink/releases/download/${LAVALINK_VERSION}/Lavalink.jar" -O Lavalink.jar

COPY application.yml .

EXPOSE 2333

ENTRYPOINT ["java", "-jar", "Lavalink.jar"]
