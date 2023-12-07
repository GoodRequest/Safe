FROM oven/bun

RUN mkdir -p /home/app
WORKDIR /home/app
COPY . .

EXPOSE 8000
CMD ["bun", "start"]
