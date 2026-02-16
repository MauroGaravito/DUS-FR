FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package.json ./
RUN npm install --production

COPY src ./src

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
